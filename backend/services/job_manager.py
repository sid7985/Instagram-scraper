"""Background job manager.

Each job processes a list of Instagram URLs with a fixed number of
worker threads. State (per-row results, logs, progress) is kept in
memory and exposed to the API for polling.

Session expiry pauses the whole job at the current position; the user
saves a new sessionid and the job resumes from the first failed row.
"""

import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from excel.writer import STATUS_OK, write_results
from config import MAX_WORKERS
from scraper import InstagramScraper, ScrapeError, ScrapeErrorType

LOG_LIMIT = 500


class Job:
    def __init__(self, job_id: str, input_path: Path, original_df, url_rows, export_dir: Path):
        self.id = job_id
        self.input_path = input_path
        self.original_df = original_df
        self.url_rows = url_rows
        self.export_dir = export_dir

        self.status = "queued"  # queued | running | session_expired | done | failed | cancelled
        self.results: dict[str, dict] = {}
        self.pending: list = [u.url for u in url_rows]
        self.current_url: str | None = None
        self.current_username: str | None = None
        self.current_row: int = 0
        self.total = len(url_rows)
        self.error: str | None = None
        self.output_filename: str | None = None
        self.started_at: datetime | None = None
        self.finished_at: datetime | None = None

        self._lock = threading.Lock()
        self._logs: list[dict] = []
        self._thread: threading.Thread | None = None
        self._cancel = threading.Event()
        self._epoch = 0

    # ------------------------------------------------------------------ #
    # Logging
    # ------------------------------------------------------------------ #
    def log(self, level: str, message: str) -> None:
        with self._lock:
            self._logs.append(
                {
                    "ts": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                    "level": level,
                    "message": message,
                }
            )
            if len(self._logs) > LOG_LIMIT:
                self._logs = self._logs[-LOG_LIMIT:]

    # ------------------------------------------------------------------ #
    # Lifecycle
    # ------------------------------------------------------------------ #
    def start(self, session_id: str) -> None:
        self.started_at = datetime.now(timezone.utc)
        self._thread = threading.Thread(
            target=self._run, args=(session_id,), name=f"job-{self.id}", daemon=True
        )
        self._thread.start()

    def pause_for_session(self) -> None:
        with self._lock:
            if self.status == "running":
                self.status = "session_expired"
        self.log("warn", "Session expired. Waiting for a new Session ID...")

    def resume(self, session_id: str) -> None:
        with self._lock:
            if self.status != "session_expired":
                raise ValueError("Job is not waiting for a session")
            self.status = "running"
            self._epoch += 1
            self._cancel.clear()
        self.log("info", "New session saved. Resuming from the failed row...")
        self._thread = threading.Thread(
            target=self._run, args=(session_id,), name=f"job-{self.id}-r", daemon=True
        )
        self._thread.start()

    def cancel(self) -> None:
        self._cancel.set()
        self.log("warn", "Cancel requested...")

    # ------------------------------------------------------------------ #
    # Processing loop
    # ------------------------------------------------------------------ #
    def _run(self, session_id: str) -> None:
        with self._lock:
            self.status = "running"
            epoch = self._epoch

        scraper = InstagramScraper(session_id)
        remaining = [u for u in self.url_rows if u.url not in self.results]
        with self._lock:
            self.pending = [u.url for u in remaining]

        self.log("info", f"Processing {len(remaining)} URLs with session")
        workers = min(MAX_WORKERS, max(1, (len(remaining) + 3) // 4))
        self.log("info", f"Starting {workers} worker(s)")

        try:
            with ThreadPoolExecutor(max_workers=workers) as pool:
                futures = {pool.submit(self._fetch_one, scraper, row): row for row in remaining}
                for future in as_completed(futures):
                    if self._cancel.is_set():
                        self._fail_pending("Cancelled")
                        break
                    row = futures[future]
                    try:
                        future.result()
                    except ScrapeError as err:
                        self._mark_failed(row, err)
                    except Exception as exc:
                        self._mark_failed(
                            row, ScrapeError(ScrapeErrorType.UNKNOWN, str(exc)[:200])
                        )
        finally:
            if self._cancel.is_set():
                with self._lock:
                    self.status = "cancelled"
                self.log("warn", "Job cancelled.")
            elif self.status == "session_expired":
                self.log("warn", "Job paused - new session required.")
            elif self.status == "running" and self._epoch == epoch:
                self._finish()

    def _fetch_one(self, scraper: InstagramScraper, row) -> None:
        if self._cancel.is_set():
            return
        with self._lock:
            self.current_row = row.excel_row
            self.current_url = row.url
            self.current_username = None
        self.log("info", f"Fetching row {row.excel_row}: {row.url[:60]}")

        data = scraper.fetch(row.url)
        data["status"] = STATUS_OK
        data["error"] = ""

        with self._lock:
            self.results[row.url] = data
            if row.url in self.pending:
                self.pending.remove(row.url)
        self.current_username = data.get("username") or ""
        self.log("success", f"Row {row.excel_row}: @{self.current_username} | "
                            f"views={data.get('views')} | likes={data.get('likes')}")

    def _mark_failed(self, row, error: ScrapeError) -> None:
        if error.error_type in (
            ScrapeErrorType.SESSION_EXPIRED,
            ScrapeErrorType.CHECKPOINT_REQUIRED,
        ):
            self.pause_for_session()
            return

        with self._lock:
            self.results[row.url] = {
                "url": row.url,
                "status": "Failed",
                "error": f"{error.error_type.value}: {error.message}",
                "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
            }
            if row.url in self.pending:
                self.pending.remove(row.url)
        self.log("error", f"Row {row.excel_row}: {error.error_type.value}")

    def _fail_pending(self, reason: str) -> None:
        for url in list(self.pending):
            if url not in self.results:
                self.results[url] = {
                    "url": url,
                    "status": "Failed",
                    "error": reason,
                    "last_updated": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"),
                }
        self.pending = []

    def _finish(self) -> None:
        self.finished_at = datetime.now(timezone.utc)
        filename = f"Instagram_Analytics_Result_{self.id[:8]}.xlsx"
        output_path = self.export_dir / filename
        try:
            write_results(
                self.original_df,
                self.url_rows,
                self.results,
                output_path,
                self.started_at,
                self.finished_at,
            )
            self.output_filename = filename
            with self._lock:
                self.status = "done"
            success = sum(1 for r in self.results.values() if r.get("status") == STATUS_OK)
            failed = len(self.results) - success
            self.log("success", f"Done. {success} success, {failed} failed.")
            self.log("success", f"Results saved: {filename}")
        except Exception as exc:
            with self._lock:
                self.status = "failed"
            self.error = str(exc)[:300]
            self.log("error", f"Failed to generate Excel: {self.error}")

    # ------------------------------------------------------------------ #
    # Snapshot for the API
    # ------------------------------------------------------------------ #
    def snapshot(self) -> dict:
        with self._lock:
            done = len(self.results)
            success = sum(1 for r in self.results.values() if r.get("status") == STATUS_OK)
            failed = done - success

            elapsed = None
            if self.started_at:
                end = self.finished_at or datetime.now(timezone.utc)
                elapsed = round((end - self.started_at).total_seconds(), 1)

            speed = None
            if elapsed and elapsed > 0:
                speed = round(done / (elapsed / 60), 2)

            return {
                "id": self.id,
                "status": self.status,
                "total": self.total,
                "done": done,
                "success": success,
                "failed": failed,
                "remaining": max(self.total - done, 0),
                "pending": list(self.pending),
                "current_row": self.current_row,
                "current_url": self.current_url,
                "current_username": self.current_username,
                "elapsed_sec": elapsed,
                "speed_per_min": speed,
                "logs": list(self._logs),
                "output_filename": self.output_filename,
                "error": self.error,
            }


class JobManager:
    def __init__(self, export_dir: Path):
        self.export_dir = export_dir
        self._jobs: dict[str, Job] = {}
        self._lock = threading.Lock()

    def create(self, input_path: Path, original_df, url_rows) -> Job:
        job = Job(
            job_id=uuid.uuid4().hex,
            input_path=input_path,
            original_df=original_df,
            url_rows=url_rows,
            export_dir=self.export_dir,
        )
        with self._lock:
            self._jobs[job.id] = job
        job.log("info", f"Job created: {job.total} URLs")
        return job

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)

    def snapshot(self, job_id: str) -> dict | None:
        job = self.get(job_id)
        return job.snapshot() if job else None

    def start(self, job_id: str, session_id: str) -> dict:
        job = self.get(job_id)
        if not job:
            raise KeyError("Job not found")
        job.start(session_id)
        return job.snapshot()

    def resume(self, job_id: str, session_id: str) -> dict:
        job = self.get(job_id)
        if not job:
            raise KeyError("Job not found")
        job.resume(session_id)
        return job.snapshot()

    def cancel(self, job_id: str) -> dict:
        job = self.get(job_id)
        if not job:
            raise KeyError("Job not found")
        job.cancel()
        return job.snapshot()

    def list_jobs(self) -> list[dict]:
        with self._lock:
            ids = list(self._jobs.keys())
        return [self._jobs[i].snapshot() for i in ids]


job_manager: JobManager | None = None


def init_job_manager(export_dir: Path) -> JobManager:
    global job_manager
    if job_manager is None:
        job_manager = JobManager(export_dir)
    return job_manager


def get_job_manager() -> JobManager:
    if job_manager is None:
        raise RuntimeError("JobManager not initialised")
    return job_manager
