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
  Settings,
  Timer,
  XCircle,
} from "lucide-react";

import Header from "@/components/Header";
import LiveLogs from "@/components/LiveLogs";
import ProgressCard from "@/components/ProgressCard";
import SessionModal from "@/components/SessionModal";
import SettingsPanel, { type MetricSettings, type EngineSettings } from "@/components/SettingsPanel";
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

const DEFAULT_METRICS: MetricSettings = {
  postReel: {
    views: true,
    likes: true,
    comments: true,
    caption: false,
    hashtags: false,
    postUrl: false,
    timestamp: false,
    mediaType: false,
  },
  profile: {
    followers: true,
    following: true,
    biography: true,
    verified: false,
    externalUrl: false,
    totalPosts: false,
  },
  engagementRate: true,
};

const DEFAULT_ENGINE: EngineSettings = {
  concurrency: 3,
  delayMin: 2,
  delayMax: 5,
  exportFormat: "xlsx",
};

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
  const [activeView, setActiveView] = useState<"dashboard" | "settings">("dashboard");
  const [metrics, setMetrics] = useState<MetricSettings>(DEFAULT_METRICS);
  const [engine, setEngine] = useState<EngineSettings>(DEFAULT_ENGINE);

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

  const handleMetricsChange = (m: MetricSettings, e: EngineSettings) => {
    setMetrics(m);
    setEngine(e);
  };

  const percent = job && job.total > 0 ? Math.round((job.done / job.total) * 100) : 0;
  const isRunning = job?.status === "running";
  const isQueued = job?.status === "queued";

  return (
    <div className="min-h-screen bg-background">
      <Header
        loggedIn={session.set}
        onManageSession={() => setModal("required")}
        activeView={activeView}
        onNavigate={setActiveView}
      />

      {/* Main Content Wrapper with sidebar offset */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full min-h-[calc(100vh-64px)] relative">
        <main className="flex-1 p-margin-mobile lg:p-margin-desktop max-w-7xl mx-auto w-full">
          {activeView === "dashboard" ? (
            <>
              {/* Dashboard Header & Status */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
                <div>
                  <h2 className="text-headline-lg text-on-background mb-xs">Data Pipeline</h2>
                  <p className="text-body-md text-on-surface-variant">
                    Manage and process your bulk analytics uploads.
                  </p>
                </div>
                {/* Session Status Card */}
                <div className="surface-card rounded-lg px-md py-sm flex items-center gap-sm">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      session.set
                        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "bg-danger"
                    }`}
                  />
                  <div>
                    <span className="text-label-md text-on-surface-variant block mb-[2px]">
                      Session Status
                    </span>
                    <span className="text-body-md font-semibold text-on-surface flex items-center gap-xs">
                      {session.set ? (
                        <>
                          Logged In
                          <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                        </>
                      ) : (
                        "Not Connected"
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {apiReachable === false && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="surface-card rounded-xl mb-6 flex items-center gap-3 border-error/40 bg-error/10 px-md py-sm"
                >
                  <XCircle className="h-4 w-4 shrink-0 text-error" />
                  <div>
                    <p className="text-sm font-semibold text-error">Backend unreachable</p>
                    <p className="text-xs text-on-surface-variant">
                      {API_BASE
                        ? `Could not reach ${API_BASE}. Check the backend service is running.`
                        : "No API URL configured. Set NEXT_PUBLIC_API_URL on Vercel."}
                    </p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="surface-card rounded-xl mb-6 flex items-center gap-3 border-error/40 bg-error/10 px-md py-sm"
                >
                  <XCircle className="h-4 w-4 shrink-0 text-error" />
                  <p className="text-sm text-error">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                {/* Metrics Cluster (4 cols) */}
                <div className="md:col-span-4 grid grid-cols-2 gap-sm">
                  <StatCard title="Total URLs" value={job?.total ?? 0} icon={FileSpreadsheet} accent="primary" />
                  <StatCard title="Success" value={job?.success ?? 0} icon={Download} accent="success" />
                  <StatCard title="Failed" value={job?.failed ?? 0} icon={ListX} accent="danger" />
                  <StatCard title="Remaining" value={job?.remaining ?? 0} icon={Hourglass} accent="gray" />
                </div>

                {/* Main Action Area (8 cols) */}
                <div className="md:col-span-8">
                  <UploadDropzone
                    fileName={file?.name ?? null}
                    onFile={handleFile}
                    disabled={uploading || isRunning || isQueued}
                  />
                </div>
              </div>

              {/* Actions */}
              {file && !job && (
                <div className="mt-md flex items-center gap-sm">
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
                <div className="mt-md">
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
                  className="surface-card rounded-xl mt-md flex flex-col items-center gap-4 p-8 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                    <Download className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-headline-sm text-on-surface">Processing complete</h3>
                    <p className="mt-1 text-body-md text-on-surface-variant">
                      {job.success} successful &middot; {job.failed} failed &middot; {job.elapsed_sec}s
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
                  className="surface-card rounded-xl mt-md border-yellow-500/30 bg-yellow-500/5 px-md py-sm text-sm text-yellow-400"
                >
                  Session expired — the job is paused. Paste a new Session ID to resume.
                </motion.div>
              )}

              {job?.status === "failed" && (
                <div className="surface-card rounded-xl mt-md px-md py-sm text-sm text-error">
                  Job failed: {job.error}
                </div>
              )}

              {/* Logs */}
              {job && (
                <div className="mt-md">
                  <LiveLogs logs={job.logs} />
                </div>
              )}
            </>
          ) : (
            /* Settings View */
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-md">
                <div>
                  <h1 className="text-headline-lg text-on-surface mb-xs">
                    Settings & Metrics
                  </h1>
                  <p className="text-body-md text-on-surface-variant max-w-2xl">
                    Configure data collection parameters, select target metrics, and define export
                    preferences for your scraping tasks.
                  </p>
                </div>
              </div>

              <SettingsPanel
                metrics={metrics}
                engine={engine}
                onChange={handleMetricsChange}
              />
            </>
          )}
        </main>
      </div>

      <SessionModal
        kind={modal}
        onClose={() => setModal(null)}
        onSave={handleSessionSave}
      />
    </div>
  );
}
