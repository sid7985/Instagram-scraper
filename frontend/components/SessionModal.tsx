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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 12 }}
          className="surface-card rounded-t-2xl sm:rounded-xl w-full max-w-md border-primary/30 p-4 sm:p-md shadow-[0_0_30px_rgba(192,193,255,0.1)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <KeyRound className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <h2 className="mt-3 sm:mt-md text-headline-sm sm:text-headline-md text-on-surface">
            {isExpired ? "Session Expired" : "Instagram Login Required"}
          </h2>
          <p className="mt-1 sm:mt-xs text-body-md text-on-surface-variant">
            {isExpired
              ? "Your session has expired. Paste a new Session ID to resume."
              : "To fetch Instagram statistics, paste your Instagram Session ID."}
          </p>

          <form onSubmit={handleSubmit} className="mt-3 sm:mt-md">
            <input
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste your sessionid here..."
              className="input-dark font-mono text-xs sm:text-sm"
              autoFocus
            />
            {error && <p className="mt-2 text-xs text-error">{error}</p>}
            <button type="submit" disabled={saving} className="btn-primary mt-3 sm:mt-md w-full">
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

          <p className="mt-3 sm:mt-md text-[10px] sm:text-[11px] leading-relaxed text-outline">
            How to get it: login to instagram.com in Chrome &rarr; F12 &rarr; Application
            &rarr; Cookies &rarr; instagram.com &rarr; copy <code className="text-on-surface-variant">sessionid</code>.
            Your session is encrypted and never shown again.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
