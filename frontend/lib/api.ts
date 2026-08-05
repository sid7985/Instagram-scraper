import type { JobSnapshot, SessionInfo, UploadResponse } from "./types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export async function getSession(): Promise<SessionInfo> {
  return handle<SessionInfo>(await fetch("/api/session"));
}

export async function saveSession(sessionId: string): Promise<SessionInfo> {
  return handle<SessionInfo>(
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
  );
}

export async function uploadExcel(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return handle<UploadResponse>(await fetch("/api/upload", { method: "POST", body: form }));
}

export async function startJob(jobId: string): Promise<JobSnapshot> {
  return handle<JobSnapshot>(await fetch(`/api/jobs/${jobId}/start`, { method: "POST" }));
}

export async function resumeJob(jobId: string): Promise<JobSnapshot> {
  return handle<JobSnapshot>(await fetch(`/api/jobs/${jobId}/resume`, { method: "POST" }));
}

export async function getJob(jobId: string): Promise<JobSnapshot> {
  return handle<JobSnapshot>(await fetch(`/api/jobs/${jobId}`));
}

export function downloadUrl(jobId: string): string {
  return `/api/jobs/${jobId}/download`;
}
