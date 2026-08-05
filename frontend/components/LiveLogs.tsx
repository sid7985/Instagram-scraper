"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Terminal,
  XCircle,
} from "lucide-react";
import type { LogEntry, LogLevel } from "@/lib/types";

const ICONS: Record<LogLevel, ReactNode> = {
  info: <Info className="h-3.5 w-3.5 text-accent" />,
  success: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  warn: <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" />,
  error: <XCircle className="h-3.5 w-3.5 text-danger" />,
};

export default function LiveLogs({ logs }: { logs: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="card flex h-72 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Terminal className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Live Logs
        </span>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-4 font-mono text-xs leading-relaxed">
        {logs.length === 0 ? (
          <p className="text-gray-600">Waiting for activity...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="shrink-0 text-gray-600">{log.ts}</span>
              <span className="mt-px shrink-0">{ICONS[log.level]}</span>
              <span
                className={
                  log.level === "error"
                    ? "text-danger"
                    : log.level === "success"
                      ? "text-success"
                      : log.level === "warn"
                        ? "text-yellow-400"
                        : "text-gray-300"
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
