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
      className="card p-6"
    >
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold">
          {running ? "Processing..." : "Progress"}
        </span>
        <span className="font-mono text-accent">{percent}%</span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-[#101010]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span className="font-mono">
          Row {currentRow}/{total}
        </span>
        {currentUsername ? (
          <span className="inline-flex items-center gap-1 text-gray-200">
            <AtSign className="h-3 w-3 text-accent" />
            {currentUsername}
          </span>
        ) : running ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Fetching...
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}
