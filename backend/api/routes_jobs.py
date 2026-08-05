"""Job endpoints: start, poll, resume, cancel, download."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from auth import SessionStore
from config import EXPORT_DIR
from services import get_job_manager

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _store() -> SessionStore:
    from main import session_store

    return session_store


@router.get("/list")
def list_jobs() -> dict:
    return {"jobs": get_job_manager().list_jobs()}


@router.get("/{job_id}")
def job_status(job_id: str) -> dict:
    snapshot = get_job_manager().snapshot(job_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Job not found")
    return snapshot


@router.post("/{job_id}/start")
def start_job(job_id: str) -> dict:
    session_id = _store().get()
    if not session_id:
        raise HTTPException(status_code=400, detail="No session saved. Please save a Session ID first.")

    manager = get_job_manager()
    job = manager.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in ("queued", "done", "failed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Job already {job.status}")

    try:
        return manager.start(job_id, session_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not start job: {str(exc)[:200]}")


@router.post("/{job_id}/resume")
def resume_job(job_id: str) -> dict:
    session_id = _store().get()
    if not session_id:
        raise HTTPException(status_code=400, detail="No session saved. Please save a Session ID first.")

    manager = get_job_manager()
    job = manager.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "session_expired":
        raise HTTPException(status_code=400, detail="Job is not waiting for a session")

    try:
        return manager.resume(job_id, session_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not resume job: {str(exc)[:200]}")


@router.post("/{job_id}/cancel")
def cancel_job(job_id: str) -> dict:
    manager = get_job_manager()
    job = manager.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    try:
        return manager.cancel(job_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not cancel job: {str(exc)[:200]}")


@router.get("/{job_id}/download")
def download_result(job_id: str) -> FileResponse:
    snapshot = get_job_manager().snapshot(job_id)
    if not snapshot:
        raise HTTPException(status_code=404, detail="Job not found")
    filename = snapshot.get("output_filename")
    if not filename:
        raise HTTPException(status_code=400, detail="No result file yet")
    path = EXPORT_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Result file missing")
    return FileResponse(path, filename=filename, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
