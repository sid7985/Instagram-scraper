"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "accent" | "success" | "danger" | "gray";
  sub?: string;
}

const ACCENTS: Record<string, string> = {
  accent: "text-accent bg-accent/10",
  success: "text-success bg-success/10",
  danger: "text-danger bg-danger/10",
  gray: "text-gray-300 bg-gray-500/10",
};

export default function StatCard({ title, value, icon: Icon, accent = "accent", sub }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {title}
        </p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${ACCENTS[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </motion.div>
  );
}
