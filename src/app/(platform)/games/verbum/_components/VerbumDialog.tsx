"use client";

import { useEffect, type ReactNode } from "react";

type VerbumDialogProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
};

// Centered modal with overlay. Escape or a click on the overlay closes it.
export function VerbumDialog({ title, closeLabel, onClose, children }: VerbumDialogProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[var(--accent-overlay)] p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl sm:max-w-md sm:rounded-3xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-scale-4 font-semibold text-[var(--heading-primary)]">{title}</h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={closeLabel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
