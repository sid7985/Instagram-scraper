export type LogLevel = "info" | "success" | "warn" | "error";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  message: string;
}

export type JobStatus =
  | "queued"
  | "running"
  | "session_expired"
  | "done"
  | "failed"
  | "cancelled";

export interface JobSnapshot {
  id: string;
  status: JobStatus;
  total: number;
  done: number;
  success: number;
  failed: number;
  remaining: number;
  pending: string[];
  current_row: number;
  current_url: string | null;
  current_username: string | null;
  elapsed_sec: number | null;
  speed_per_min: number | null;
  logs: LogEntry[];
  output_filename: string | null;
  error: string | null;
}

export interface UploadResponse {
  job_id: string;
  total: number;
  first_urls: string[];
  needs_session: boolean;
}

export interface SessionInfo {
  set: boolean;
  valid: boolean | null;
}

export type ModalKind = "required" | "expired" | null;
