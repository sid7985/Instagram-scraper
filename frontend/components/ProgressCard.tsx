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
      className="surface-card rounded-xl p-md flex flex-col gap-sm"
    >
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-headline-md text-on-background">
            {running ? "Extracting Data..." : "Progress"}
          </h2>
          <p className="text-body-md text-on-surface-variant mt-xs">
            Row {currentRow} / {total}
            {currentUsername && (
              <>
                <span className="mx-2">&bull;</span>
                Current: @{currentUsername}
              </>
            )}
          </p>
        </div>
        <div className="font-mono text-metric-xl text-primary">{percent}%</div>
      </div>

      <div className="h-4 bg-surface-container-lowest rounded-full overflow-hidden mt-sm border border-outline-variant/50">
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
