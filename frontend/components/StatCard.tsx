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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card rounded-xl px-3 py-2.5 flex items-center gap-3 relative overflow-hidden"
    >
      {colors.glow && (
        <div className={`absolute -right-3 -top-3 w-16 h-16 ${colors.glow} rounded-full blur-xl`} />
      )}
      <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 relative z-10`}>
        <Icon className={`h-4 w-4 ${colors.text}`} />
      </div>
      <div className="relative z-10 min-w-0">
        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider block">{title}</span>
        <span className="font-mono text-lg sm:text-xl leading-tight text-on-background">{value}</span>
      </div>
    </motion.div>
  );
}
