"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "success" | "danger" | "gray";
  sub?: string;
}

const ACCENTS: Record<string, { text: string; bg: string; glow?: string }> = {
  primary: { text: "text-primary", bg: "bg-primary/10" },
  success: { text: "text-emerald-500", bg: "bg-emerald-500/10", glow: "bg-emerald-500/10" },
  danger: { text: "text-rose-500", bg: "bg-rose-500/10", glow: "bg-rose-500/10" },
  gray: { text: "text-on-surface-variant", bg: "bg-surface-container-high" },
};

export default function StatCard({ title, value, icon: Icon, accent = "primary", sub }: StatCardProps) {
  const colors = ACCENTS[accent] || ACCENTS.primary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-xl p-3 sm:p-md flex flex-col justify-between relative overflow-hidden"
    >
      {colors.glow && (
        <div className={`absolute -right-4 -top-4 w-20 sm:w-24 h-20 sm:h-24 ${colors.glow} rounded-full blur-xl`} />
      )}
      <div className="flex justify-between items-start mb-2 sm:mb-md relative z-10">
        <span className="text-[10px] sm:text-label-md text-on-surface-variant uppercase tracking-wider">
          {title}
        </span>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${colors.text} opacity-80`} />
      </div>
      <div className="relative z-10">
        <span className="font-mono text-[32px] sm:text-[40px] md:text-metric-xl leading-none text-on-background">{value}</span>
        {sub && <p className="mt-1 text-[10px] sm:text-xs text-on-surface-variant">{sub}</p>}
      </div>
    </motion.div>
  );
}
