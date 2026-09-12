"use client";

import { useState } from "react";

type AteneoContentModerationModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string | undefined) => Promise<void> | void;
};

const MAX_REASON_LENGTH = 500;

export function AteneoContentModerationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  isSubmitting,
  onClose,
  onConfirm,
}: AteneoContentModerationModalProps) {
  const [reasonDraft, setReasonDraft] = useState("");

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--surface)_34%,black)] px-4">
      <div className="w-full max-w-[34rem] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-scale-3 text-[var(--text-primary)]">{description}</p>

        <label className="mt-4 block text-scale-2 font-medium text-[var(--text-secondary)]" htmlFor="ateneo-content-moderation-reason">
          Motivo (opcional)
        </label>
        <textarea
          id="ateneo-content-moderation-reason"
          value={reasonDraft}
          onChange={(event) => setReasonDraft(event.target.value.slice(0, MAX_REASON_LENGTH))}
          rows={5}
          placeholder="Podés dejar una nota para futuras revisiones administrativas."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-scale-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />

        <p className="mt-2 text-right text-scale-1 text-[var(--text-secondary)]">
          {MAX_REASON_LENGTH - reasonDraft.length} caracteres restantes
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              void onConfirm(reasonDraft.trim() ? reasonDraft.trim() : undefined);
            }}
            disabled={isSubmitting}
            className="rounded-full bg-[var(--danger-500)] px-5 py-2 text-scale-2 font-semibold text-[var(--surface)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
