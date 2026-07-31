"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0" onClick={onCancel} />

      <div className="relative w-full max-w-sm bg-popover border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center shrink-0">
            <TriangleAlert className="w-[18px] h-[18px] text-destructive" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-xs font-bold text-foreground tracking-wide">
              {title}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[10px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm shadow-destructive/10"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
