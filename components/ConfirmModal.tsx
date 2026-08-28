"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Volver",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const accent = tone === "danger" ? "alarm" : "chalk";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="absolute inset-0 bg-felt-darker/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-sm bg-panel border border-rail/50 rounded-2xl shadow-felt p-6 animate-[popIn_0.15s_ease-out]">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${
            tone === "danger" ? "bg-alarm/15" : "bg-chalk/15"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={`w-6 h-6 ${tone === "danger" ? "text-alarm" : "text-chalk"}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </div>

        <h2 id="confirm-modal-title" className="font-display text-xl tracking-wide text-ink mb-2">
          {title}
        </h2>
        <p className="text-ink-muted text-sm mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-rail/60 text-ink-muted hover:text-ink hover:border-ink-faint transition font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg font-bold transition ${
              tone === "danger"
                ? "bg-alarm hover:bg-alarm-dark text-white"
                : "bg-cloth hover:bg-cloth-light text-felt-darker"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.96) translateY(4px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </div>
  );
}
