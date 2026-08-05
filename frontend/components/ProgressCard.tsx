"use client";

import { motion } from "framer-motion";
import { AtSign, Loader2 } from "lucide-react";

interface ProgressCardProps {
  percent: number;
  currentRow: number;
  total: number;
  currentUsername: string | null;
  running: boolean;
}

export default function ProgressCard({
  percent,
  currentRow,
  total,
  currentUsername,
  running,
}: ProgressCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-xl p-3 sm:p-md flex flex-col gap-sm"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1">
        <div className="min-w-0">
          <h2 className="text-headline-sm sm:text-headline-md text-on-background">
            {running ? "Extracting Data..." : "Progress"}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-xs truncate">
            Row {currentRow} / {total}
            {currentUsername && (
              <>
                <span className="mx-2 hidden sm:inline">&bull;</span>
                <span className="hidden sm:inline">Current: @{currentUsername}</span>
              </>
            )}
          </p>
        </div>
        <div className="font-mono text-[32px] sm:text-[40px] md:text-metric-xl leading-none text-primary shrink-0">{percent}%</div>
      </div>

      <div className="h-3 sm:h-4 bg-surface-container-lowest rounded-full overflow-hidden mt-sm border border-outline-variant/50">
        <motion.div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{
            backgroundImage:
              "linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)",
            backgroundSize: "1rem 1rem",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      <div className="mt-sm flex items-center gap-sm text-xs text-on-surface-variant">
        {currentUsername ? (
          <span className="inline-flex items-center gap-1 text-on-surface">
            <AtSign className="h-3 w-3 text-primary" />
            @{currentUsername}
          </span>
        ) : running ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            Fetching...
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
