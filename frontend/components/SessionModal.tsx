"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import type { ModalKind } from "@/lib/types";

interface SessionModalProps {
  kind: ModalKind;
  onClose: () => void;
  onSave: (sessionId: string) => Promise<void>;
}

export default function SessionModal({ kind, onClose, onSave }: SessionModalProps) {
  const [sessionId, setSessionId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!kind) return null;

  const isExpired = kind === "expired";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      setError("Session ID cannot be empty");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(sessionId.trim());
      setSessionId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save session");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 12 }}
          className="card w-full max-w-md border-accent/30 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10">
              <KeyRound className="h-5 w-5 text-accent" />
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 transition hover:bg-[#222222] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <h2 className="mt-4 text-lg font-bold">
            {isExpired ? "Session Expired" : "Instagram Login Required"}
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            {isExpired
              ? "Your Instagram session has expired. Paste a new Session ID to resume from where it stopped."
              : "To fetch accurate Instagram statistics, please paste your Instagram Session ID."}
          </p>

          <form onSubmit={handleSubmit} className="mt-5">
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste your sessionid here..."
              className="input-dark font-mono text-xs"
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-danger">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary mt-4 w-full">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Validating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  {isExpired ? "Save & Resume" : "Save Session"}
                </>
              )}
            </button>
          </form>

          <p className="mt-4 text-[11px] leading-relaxed text-gray-600">
            How to get it: login to instagram.com in Chrome → F12 → Application
            → Cookies → instagram.com → copy the value of <code>sessionid</code>.
            Your session is encrypted and never shown again.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
