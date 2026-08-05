"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Download, Film, Save, User } from "lucide-react";

export interface MetricSettings {
  postReel: {
    views: boolean;
    likes: boolean;
    comments: boolean;
    caption: boolean;
    hashtags: boolean;
    postUrl: boolean;
    timestamp: boolean;
    mediaType: boolean;
  };
  profile: {
    followers: boolean;
    following: boolean;
    biography: boolean;
    verified: boolean;
    externalUrl: boolean;
    totalPosts: boolean;
  };
  engagementRate: boolean;
}

export interface EngineSettings {
  concurrency: number;
  delayMin: number;
  delayMax: number;
  exportFormat: "xlsx" | "csv" | "json";
}

interface SettingsPanelProps {
  metrics: MetricSettings;
  engine: EngineSettings;
  onChange: (metrics: MetricSettings, engine: EngineSettings) => void;
}

const DEFAULT_METRICS: MetricSettings = {
  postReel: {
    views: true,
    likes: true,
    comments: true,
    caption: false,
    hashtags: false,
    postUrl: false,
    timestamp: false,
    mediaType: false,
  },
  profile: {
    followers: true,
    following: true,
    biography: true,
    verified: false,
    externalUrl: false,
    totalPosts: false,
  },
  engagementRate: true,
};

const DEFAULT_ENGINE: EngineSettings = {
  concurrency: 3,
  delayMin: 2,
  delayMax: 5,
  exportFormat: "xlsx",
};

function MetricCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-outline-variant bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-0 focus:ring-offset-background shrink-0"
      />
      <span className="text-xs text-on-surface-variant group-hover:text-on-surface transition-colors">
        {label}
      </span>
    </label>
  );
}

export default function SettingsPanel({ metrics, engine, onChange }: SettingsPanelProps) {
  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [localEngine, setLocalEngine] = useState(engine);

  const updatePostReel = (key: keyof MetricSettings["postReel"], val: boolean) => {
    const updated = { ...localMetrics, postReel: { ...localMetrics.postReel, [key]: val } };
    setLocalMetrics(updated);
    onChange(updated, localEngine);
  };

  const updateProfile = (key: keyof MetricSettings["profile"], val: boolean) => {
    const updated = { ...localMetrics, profile: { ...localMetrics.profile, [key]: val } };
    setLocalMetrics(updated);
    onChange(updated, localEngine);
  };

  const updateEngine = (key: keyof EngineSettings, val: number | string) => {
    const updated = { ...localEngine, [key]: val };
    setLocalEngine(updated);
    onChange(localMetrics, updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Post & Reel Metrics */}
      <div className="surface-card rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant">
          <Film className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-on-surface">Post & Reel Metrics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
          <MetricCheckbox label="Views" checked={localMetrics.postReel.views} onChange={(v) => updatePostReel("views", v)} />
          <MetricCheckbox label="Likes" checked={localMetrics.postReel.likes} onChange={(v) => updatePostReel("likes", v)} />
          <MetricCheckbox label="Comments Count" checked={localMetrics.postReel.comments} onChange={(v) => updatePostReel("comments", v)} />
          <MetricCheckbox label="Caption Text" checked={localMetrics.postReel.caption} onChange={(v) => updatePostReel("caption", v)} />
          <MetricCheckbox label="Hashtags" checked={localMetrics.postReel.hashtags} onChange={(v) => updatePostReel("hashtags", v)} />
          <MetricCheckbox label="Post URL" checked={localMetrics.postReel.postUrl} onChange={(v) => updatePostReel("postUrl", v)} />
          <MetricCheckbox label="Timestamp" checked={localMetrics.postReel.timestamp} onChange={(v) => updatePostReel("timestamp", v)} />
          <MetricCheckbox label="Media Type" checked={localMetrics.postReel.mediaType} onChange={(v) => updatePostReel("mediaType", v)} />
        </div>
      </div>

      {/* Profile Metrics */}
      <div className="surface-card rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant">
          <User className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-on-surface">Profile Metrics</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-4">
          <MetricCheckbox label="Followers" checked={localMetrics.profile.followers} onChange={(v) => updateProfile("followers", v)} />
          <MetricCheckbox label="Following" checked={localMetrics.profile.following} onChange={(v) => updateProfile("following", v)} />
          <MetricCheckbox label="Biography" checked={localMetrics.profile.biography} onChange={(v) => updateProfile("biography", v)} />
          <MetricCheckbox label="Verified Status" checked={localMetrics.profile.verified} onChange={(v) => updateProfile("verified", v)} />
          <MetricCheckbox label="External URL" checked={localMetrics.profile.externalUrl} onChange={(v) => updateProfile("externalUrl", v)} />
          <MetricCheckbox label="Total Posts" checked={localMetrics.profile.totalPosts} onChange={(v) => updateProfile("totalPosts", v)} />
        </div>
      </div>

      {/* Engagement Rate */}
      <div className="surface-card rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-on-surface">Computed Metrics</h2>
        </div>
        <MetricCheckbox
          label="Engagement Rate (Likes+Comments / Followers x 100)"
          checked={localMetrics.engagementRate}
          onChange={(v) => {
            const updated = { ...localMetrics, engagementRate: v };
            setLocalMetrics(updated);
            onChange(updated, localEngine);
          }}
        />
      </div>

      {/* Execution Engine */}
      <div className="surface-card rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant">
          <Cpu className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-on-surface">Execution Engine</h2>
        </div>
        <div className="flex flex-col gap-3">
          {/* Concurrency */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] text-on-surface-variant">Concurrency Workers</label>
              <span className="text-xs text-primary font-bold">{localEngine.concurrency}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={localEngine.concurrency}
              onChange={(e) => updateEngine("concurrency", parseInt(e.target.value))}
              className="w-full h-1 bg-outline-variant rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div className="flex justify-between mt-0.5 text-[10px] text-outline">
              <span>1 (Safe)</span>
              <span>10 (Aggressive)</span>
            </div>
          </div>

          {/* Delay */}
          <div>
            <label className="text-[11px] text-on-surface-variant block mb-1">Request Delay (Seconds)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="60"
                value={localEngine.delayMin}
                onChange={(e) => updateEngine("delayMin", parseInt(e.target.value) || 0)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface text-xs focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1.5"
              />
              <span className="text-on-surface-variant shrink-0 text-xs">to</span>
              <input
                type="number"
                min="0"
                max="60"
                value={localEngine.delayMax}
                onChange={(e) => updateEngine("delayMax", parseInt(e.target.value) || 0)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface text-xs focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1.5"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Configuration */}
      <div className="surface-card rounded-xl px-3 py-2.5">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant">
          <Download className="h-3.5 w-3.5 text-primary" />
          <h2 className="text-xs font-semibold text-on-surface">Export Configuration</h2>
        </div>
        <div>
          <label className="text-[11px] text-on-surface-variant block mb-1">Primary Export Format</label>
          <select
            value={localEngine.exportFormat}
            onChange={(e) => updateEngine("exportFormat", e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded text-on-surface text-xs focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1.5 appearance-none cursor-pointer"
          >
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV (.csv)</option>
            <option value="json">JSON (.json)</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}
