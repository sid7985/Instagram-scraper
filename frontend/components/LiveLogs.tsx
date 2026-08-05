"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { Terminal } from "lucide-react";
import type { LogEntry, LogLevel } from "@/lib/types";

const LEVEL_STYLES: Record<LogLevel, string> = {
  info: "text-on-surface-variant",
  success: "text-tertiary",
  warn: "text-yellow-400",
  error: "text-error",
};

const LEVEL_PREFIX: Record<LogLevel, string> = {
  info: "",
  success: "\u2714 ",
  warn: "\u26A0 ",
  error: "\u2718 ",
};

export default function LiveLogs({ logs }: { logs: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  return (
    <div className="surface-card rounded-xl flex flex-col overflow-hidden h-40 sm:h-48">
      <div className="bg-surface-variant px-3 py-1.5 border-b border-outline-variant flex justify-between items-center">
        <span className="text-[10px] text-on-surface-variant uppercase flex items-center gap-1.5">
          <Terminal className="h-3 w-3 text-primary" /> Live Logs
        </span>
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
          <div className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
        </div>
      </div>
      <div className="px-2 py-1.5 font-mono text-[10px] sm:text-xs text-on-surface-variant flex-grow overflow-y-auto overflow-x-auto bg-surface-container-lowest space-y-0.5 flex flex-col justify-end">
        {logs.length === 0 ? (
          <p className="text-outline">Initializing...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-1 py-px ${LEVEL_STYLES[log.level]}`}>
              <span className="shrink-0 text-outline">{log.ts}</span>
              <span className="shrink-0">{LEVEL_PREFIX[log.level]}</span>
              <span className="break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
