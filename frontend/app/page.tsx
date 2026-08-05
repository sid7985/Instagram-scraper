"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  Download,
  FileSpreadsheet,
  Gauge,
  Hourglass,
  ListX,
  Loader2,
  Play,
  Timer,
  XCircle,
} from "lucide-react";

import Header from "@/components/Header";
import LiveLogs from "@/components/LiveLogs";
import ProgressCard from "@/components/ProgressCard";
import SessionModal from "@/components/SessionModal";
import StatCard from "@/components/StatCard";
import UploadDropzone from "@/components/UploadDropzone";

import {
  API_BASE,
  downloadUrl,
  getJob,
  getSession,
  resumeJob,
  saveSession,
  startJob,
  uploadExcel,
} from "@/lib/api";
import type { JobSnapshot, ModalKind, SessionInfo } from "@/lib/types";

const TERMINAL_STATES = ["done", "failed", "cancelled"];

export default function Dashboard() {
  const [session, setSession] = useState<SessionInfo>({ set: false, valid: null });
  const [apiReachable, setApiReachable] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<JobSnapshot | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const refreshJob = useCallback(async (id: string) => {
    try {
      const snap = await getJob(id);
      setJob(snap);

      if (snap.status === "session_expired") {
        stopPolling();
        setModal("expired");
      } else if (TERMINAL_STATES.includes(snap.status)) {
        stopPolling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch job status");
    }
  }, [stopPolling]);

  const startPolling = useCallback(
    (id: string) => {
      stopPolling();
      refreshJob(id);
      pollRef.current = setInterval(() => refreshJob(id), 1500);
    },
    [refreshJob, stopPolling]
  );

  useEffect(() => {
    getSession()
      .then((info) => {
        setSession(info);
        setApiReachable(true);
      })
      .catch(() => {
        setSession({ set: false, valid: null });
        setApiReachable(false);
      });
    return stopPolling;
  }, [stopPolling]);

  const handleFile = async (selected: File) => {
    setError(null);
    const ext = selected.name.toLowerCase().split(".").pop();
    if (ext !== "xlsx" && ext !== "xls") {
      setError("Only .xlsx or .xls files are supported");
      return;
    }
    setFile(selected);
    setUploading(true);
    try {
      const resp = await uploadExcel(selected);
      jobIdRef.current = resp.job_id;
      setJobId(resp.job_id);
      setJob(null);

      if (resp.needs_session) {
        setModal("required");
      } else {
        await handleStart(resp.job_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleStart = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const snap = await startJob(id);
      setJob(snap);
      startPolling(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start job";
      if (message.toLowerCase().includes("no session")) {
        setModal("required");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSessionSave = async (sessionId: string) => {
    const info = await saveSession(sessionId);
    setSession(info);

    if (modal === "required") {
      setModal(null);
      if (jobIdRef.current) await handleStart(jobIdRef.current);
    } else if (modal === "expired") {
      setModal(null);
      const id = jobIdRef.current;
      if (id) {
        try {
          const snap = await resumeJob(id);
          setJob(snap);
          startPolling(id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not resume job");
        }
      }
    }
  };

  const percent = job && job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
  const isRunning = job?.status === "running";
  const isQueued = job?.status === "queued";

  return (
    <main className="mx-auto max-w-5xl px-6">
      <Header
        loggedIn={session.set}
        onManageSession={() => setModal("required")}
      />

      {apiReachable === false && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card mb-6 flex items-center gap-3 border-danger/40 bg-danger/10 px-4 py-3"
        >
          <XCircle className="h-4 w-4 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-semibold text-danger">Backend unreachable</p>
            <p className="text-xs text-gray-400">
              {API_BASE
                ? `Could not reach ${API_BASE}. Check the Render service is running.`
                : "No API URL configured. Set NEXT_PUBLIC_API_URL on Vercel."}
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card mb-6 flex items-center gap-3 border-danger/40 bg-danger/10 px-4 py-3"
        >
          <XCircle className="h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-danger">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-xs text-gray-400 hover:text-white"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        <StatCard title="Total URLs" value={job?.total ?? 0} icon={FileSpreadsheet} accent="accent" />
        <StatCard title="Successful" value={job?.success ?? 0} icon={Download} accent="success" />
        <StatCard title="Failed" value={job?.failed ?? 0} icon={ListX} accent="danger" />
        <StatCard title="Remaining" value={job?.remaining ?? 0} icon={Hourglass} accent="gray" />
      </motion.div>

      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard
          title="Elapsed"
          value={job?.elapsed_sec != null ? `${job.elapsed_sec}s` : "—"}
          icon={Timer}
          accent="gray"
        />
        <StatCard
          title="Speed"
          value={job?.speed_per_min != null ? `${job.speed_per_min}/min` : "—"}
          icon={Gauge}
          accent="accent"
        />
        <StatCard
          title="Status"
          value={job?.status ?? "idle"}
          icon={Clock}
          accent={job?.status === "done" ? "success" : "gray"}
          sub={job?.output_filename ?? undefined}
        />
      </div>

      {/* Upload */}
      <div className="mt-6">
        <UploadDropzone
          fileName={file?.name ?? null}
          onFile={handleFile}
          disabled={uploading || isRunning || isQueued}
        />
      </div>

      {/* Actions */}
      {file && !job && (
        <div className="mt-6 flex items-center gap-3">
          {uploading ? (
            <button className="btn-primary" disabled>
              <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => jobId && handleStart(jobId)}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start Fetch
            </button>
          )}
        </div>
      )}

      {/* Progress + logs */}
      {job && !TERMINAL_STATES.includes(job.status) && (
        <div className="mt-6">
          <ProgressCard
            percent={percent}
            currentRow={job.current_row || job.done}
            total={job.total}
            currentUsername={job.current_username}
            running={isRunning}
          />
        </div>
      )}

      {job && job.status === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mt-6 flex flex-col items-center gap-4 p-8 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
            <Download className="h-6 w-6 text-success" />
          </div>
          <div>
            <h3 className="font-bold">Processing complete</h3>
            <p className="mt-1 text-sm text-gray-400">
              {job.success} successful · {job.failed} failed · {job.elapsed_sec}s
            </p>
          </div>
          <a href={downloadUrl(job.id)} className="btn-primary">
            <Download className="h-4 w-4" />
            Download {job.output_filename}
          </a>
        </motion.div>
      )}

      {job?.status === "session_expired" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card mt-6 border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-400"
        >
          Session expired — the job is paused. Paste a new Session ID to resume.
        </motion.div>
      )}

      {job?.status === "failed" && (
        <div className="card mt-6 px-4 py-3 text-sm text-danger">
          Job failed: {job.error}
        </div>
      )}

      {/* Logs */}
      {job && (
        <div className="mt-6">
          <LiveLogs logs={job.logs} />
        </div>
      )}

      <SessionModal
        kind={modal}
        onClose={() => setModal(null)}
        onSave={handleSessionSave}
      />
    </main>
  );
}
