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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-xl px-3 py-2.5 flex flex-col gap-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-on-surface">
            {running ? "Extracting..." : "Progress"}
          </span>
          <span className="text-[10px] text-on-surface-variant truncate">
            Row {currentRow}/{total}
          </span>
          {currentUsername && (
            <span className="text-[10px] text-primary truncate hidden sm:inline">@{currentUsername}</span>
          )}
        </div>
        <span className="font-mono text-lg sm:text-xl text-primary shrink-0">{percent}%</span>
      </div>

      <div className="h-2 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/50">
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

      {currentUsername && (
        <div className="flex items-center gap-1 text-[10px] text-on-surface-variant">
          <AtSign className="h-2.5 w-2.5 text-primary" />
          <span className="truncate">@{currentUsername}</span>
        </div>
      )}
    </motion.div>
  );
}
