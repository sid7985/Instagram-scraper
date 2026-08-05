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
    <div className="surface-card rounded-xl flex flex-col overflow-hidden h-48 sm:h-56 md:h-64">
      <div className="bg-surface-variant px-3 sm:px-md py-2 sm:py-sm border-b border-outline-variant flex justify-between items-center">
        <span className="text-label-md text-on-surface-variant uppercase flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" /> Live Logs
        </span>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-outline-variant" />
          <div className="w-2 h-2 rounded-full bg-outline-variant" />
          <div className="w-2 h-2 rounded-full bg-outline-variant" />
        </div>
      </div>
      <div className="p-2 sm:p-md font-mono text-xs sm:text-sm text-on-surface-variant flex-grow overflow-y-auto overflow-x-auto bg-surface-container-lowest space-y-1 sm:space-y-2 flex flex-col justify-end">
        {logs.length === 0 ? (
          <p className="text-outline">Initializing batch process...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className={`flex items-start gap-1.5 sm:gap-2 py-0.5 ${LEVEL_STYLES[log.level]}`}>
              <span className="shrink-0 text-outline text-[10px] sm:text-xs">{log.ts}</span>
              <span className="mt-px shrink-0 text-[10px] sm:text-xs">{LEVEL_PREFIX[log.level]}</span>
              <span className="break-all sm:break-normal">{log.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
