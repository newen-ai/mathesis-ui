"use client";

import { ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

type ProfileEditModalProps = {
  title: string;
  onClose: () => void;
  /** While true the modal cannot be dismissed (Escape, overlay click, close button). */
  isBusy?: boolean;
  /** Optional element rendered before the title (for example a back button in multi-step flows). */
  headerStart?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

/**
 * Shared overlay used by every profile edit flow.
 * Rendered in a portal above the mobile platform footer (z-[120]).
 * Mobile: bottom sheet; desktop: centered dialog. Header and footer stay fixed while the body scrolls.
 */
export function ProfileEditModal({
  title,
  onClose,
  isBusy = false,
  headerStart,
  footer,
  children,
}: ProfileEditModalProps) {
  const { t } = useTranslation("profile");
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Inner controls (for example suggestion dropdowns) consume Escape with preventDefault.
      if (event.key === "Escape" && !event.defaultPrevented && !isBusy) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isBusy, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-[130] flex items-end justify-center bg-black/45 sm:items-center sm:px-3 sm:py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-[var(--line)] bg-[var(--surface)] shadow-2xl sm:max-h-full sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          {headerStart}
          <h3
            id={titleId}
            className="min-w-0 flex-1 truncate font-display text-scale-4 font-semibold text-[var(--heading-primary)]"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label={t("common.close")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[1.25rem] leading-none text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--line)] px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-6 sm:pb-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

type ModalButtonProps = {
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  form?: string;
  children: ReactNode;
};

export function ProfileModalPrimaryButton({
  onClick,
  disabled,
  type = "button",
  form,
  children,
}: ModalButtonProps) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-xl bg-[var(--brand-700)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  );
}

export function ProfileModalSecondaryButton({ onClick, disabled, children }: ModalButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {children}
    </button>
  );
}

export function ProfileModalError({ message, tone = "error" }: { message: string | null; tone?: "error" | "warning" }) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`mt-4 rounded-lg border px-3 py-2 text-xs font-semibold ${
        tone === "error"
          ? "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger-500)]"
          : "border-[var(--pending-line)] bg-[var(--pending-soft)] text-[var(--pending-500)]"
      }`}
    >
      {message}
    </p>
  );
}
