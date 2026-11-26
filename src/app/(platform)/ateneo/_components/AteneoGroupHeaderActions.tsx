"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type AteneoGroupHeaderActionsProps = {
  groupId: string;
  groupName: string;
  isAdmin: boolean;
  isOwner: boolean;
  // Leaves the group and refreshes the page state; throws on failure.
  onLeave: () => Promise<void>;
};

const MENU_ITEM_CLASS_NAME =
  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-scale-2 font-medium transition";

// Icon-only link with a short hover/focus hint under it; the full label stays as the accessible name.
function HeaderButton({ href, label, hint, icon }: { href: string; label: string; hint: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] focus-visible:border-[var(--line-strong)] focus-visible:text-[var(--text-primary)]"
    >
      {icon}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-scale-1 font-medium text-[var(--text-secondary)] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        {hint}
      </span>
    </Link>
  );
}

export function AteneoGroupHeaderActions({ groupId, groupName, isAdmin, isOwner, onLeave }: AteneoGroupHeaderActionsProps) {
  const { t } = useTranslation("ateneo");

  return (
    <div className="flex items-center gap-2">
      <HeaderButton
        href={`/ateneo/groups/${encodeURIComponent(groupId)}/info`}
        label={t("headerActions.groupInfo")}
        hint={t("headerActions.hints.groupInfo")}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M7 6.5h10M7 12h10M7 17.5h7" />
            <path d="M5.5 4.5h13a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" />
          </svg>
        }
      />
      <HeaderButton
        href={`/ateneo/groups/${encodeURIComponent(groupId)}/members`}
        label={t("headerActions.groupMembers")}
        hint={t("headerActions.hints.groupMembers")}
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <circle cx="8.5" cy="9" r="2.2" />
            <circle cx="15.5" cy="10.5" r="2.2" />
            <path d="M4.5 18.5a4 4 0 0 1 8 0" />
            <path d="M11.5 18.5a4 4 0 0 1 8 0" />
          </svg>
        }
      />
      <GroupOverflowMenu groupId={groupId} groupName={groupName} isAdmin={isAdmin} isOwner={isOwner} onLeave={onLeave} />
    </div>
  );
}

// "⋯" menu with group options: edit (admins) and leave. The owner sees "leave" disabled with the reason.
function GroupOverflowMenu({ groupId, groupName, isAdmin, isOwner, onLeave }: AteneoGroupHeaderActionsProps) {
  const { t } = useTranslation("ateneo");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && rootRef.current?.contains(event.target)) return;
      setIsMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const confirmLeave = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await onLeave();
      setIsConfirmOpen(false);
      toast.success(t("headerActions.leaveSuccess"));
    } catch {
      toast.error(t("headerActions.leaveError"));
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={t("headerActions.moreOptions")}
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((current) => !current)}
        className="group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-xl leading-none text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] focus-visible:border-[var(--line-strong)] focus-visible:text-[var(--text-primary)]"
      >
        <span aria-hidden="true">⋯</span>
        {isMenuOpen ? null : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-scale-1 font-medium text-[var(--text-secondary)] opacity-0 shadow-sm transition group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            {t("headerActions.hints.moreOptions")}
          </span>
        )}
      </button>

      {isMenuOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 min-w-[230px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-sm"
        >
          {isAdmin ? (
            <Link
              role="menuitem"
              href={`/ateneo/groups/${encodeURIComponent(groupId)}/edit`}
              onClick={() => setIsMenuOpen(false)}
              className={`${MENU_ITEM_CLASS_NAME} text-[var(--text-primary)] hover:bg-[var(--surface-2)]`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <circle cx="12" cy="12" r="3.1" />
                <path d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
              </svg>
              <span>{t("headerActions.editGroup")}</span>
            </Link>
          ) : null}

          <button
            type="button"
            role="menuitem"
            disabled={isOwner}
            aria-describedby={isOwner ? "ateneo-leave-group-owner-hint" : undefined}
            title={isOwner ? t("headerActions.leaveGroupOwnerDisabled") : undefined}
            onClick={() => {
              setIsMenuOpen(false);
              setIsConfirmOpen(true);
            }}
            className={`${MENU_ITEM_CLASS_NAME} text-[var(--danger-500)] hover:bg-[color:color-mix(in_srgb,var(--danger-500)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" />
              <path d="M10.5 12h9M16.5 8.5 20 12l-3.5 3.5" />
            </svg>
            <span>{t("headerActions.leaveGroup")}</span>
          </button>
          {isOwner ? (
            <p id="ateneo-leave-group-owner-hint" className="px-2 pb-1 text-scale-1 text-[var(--text-secondary)]">
              {t("headerActions.leaveGroupOwnerDisabled")}
            </p>
          ) : null}
        </div>
      ) : null}

      {isConfirmOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[color:color-mix(in_srgb,var(--surface)_34%,black)] px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ateneo-leave-group-title"
            className="w-full max-w-[30rem] rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="ateneo-leave-group-title" className="font-display text-scale-5 font-semibold text-[var(--heading-primary)]">
                {t("headerActions.leaveConfirm.title")}
              </h2>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isLeaving}
                aria-label={t("headerActions.leaveConfirm.closeAria")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-scale-3 text-[var(--text-primary)]">
              {t("headerActions.leaveConfirm.body", { name: groupName })}
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isLeaving}
                className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("headerActions.leaveConfirm.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmLeave();
                }}
                disabled={isLeaving}
                className="rounded-full bg-[var(--danger-500)] px-5 py-2 text-scale-2 font-semibold text-[var(--surface)] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLeaving ? t("headerActions.leaveConfirm.leaving") : t("headerActions.leaveConfirm.confirm")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
