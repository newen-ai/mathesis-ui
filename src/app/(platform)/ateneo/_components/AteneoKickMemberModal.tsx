"use client";

import { useMemo, useState } from "react";

type AteneoKickMemberModalProps = {
  isOpen: boolean;
  userName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string | undefined) => Promise<void> | void;
};

const MAX_REASON_LENGTH = 500;

export function AteneoKickMemberModal({
  isOpen,
  userName,
  isSubmitting,
  onClose,
  onConfirm,
}: AteneoKickMemberModalProps) {
  const [reasonDraft, setReasonDraft] = useState("");

  const remaining = useMemo(() => MAX_REASON_LENGTH - reasonDraft.length, [reasonDraft.length]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--surface)_34%,black)] px-4">
      <div className="w-full max-w-[34rem] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
            Expulsar usuario
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Cerrar modal de expulsión"
          >
            ×
          </button>
        </div>

        <p className="mt-3 text-scale-3 text-[var(--text-primary)]">
          Vas a expulsar a <span className="font-semibold text-[var(--heading-primary)]">{userName}</span>.
        </p>

        <label className="mt-4 block text-scale-2 font-medium text-[var(--text-secondary)]" htmlFor="ateneo-kick-reason">
          Motivo (opcional)
        </label>
        <textarea
          id="ateneo-kick-reason"
          value={reasonDraft}
          onChange={(event) => setReasonDraft(event.target.value.slice(0, MAX_REASON_LENGTH))}
          rows={5}
          placeholder="Podés dejar una nota para futuras revisiones administrativas."
          className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-scale-3 text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
        />

        <p className="mt-2 text-right text-scale-1 text-[var(--text-secondary)]">{remaining} caracteres restantes</p>

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
            {isSubmitting ? "Expulsando..." : "Expulsar usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}
