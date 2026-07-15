"use client";

import { useEffect } from "react";

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
  // Listen for Escape key to close the modal
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
    <div className="fixed inset-0 bg-[#141210]/85 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Click outside backdrop triggers cancel */}
      <div className="absolute inset-0" onClick={onCancel} />

      <div className="relative w-full max-w-sm bg-[#1C1A17] border border-[#36302A] rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#B84747]/10 border border-[#B84747]/20 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B84747" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-xs font-bold text-[#E6DCC3] tracking-wide">
              {title}
            </h3>
            <p className="text-[11px] text-[#9F907E] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1.5">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 bg-[#1E1B18] border border-[#36302A] hover:bg-[#282420] text-[#9F907E] hover:text-[#E6DCC3] text-[10px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3.5 py-1.5 bg-[#B84747] hover:bg-[#C95858] text-[#E6DCC3] text-[10px] font-bold rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm shadow-[#B84747]/10"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
