"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type AteneoGroupHeaderActionsProps = {
  groupId: string;
  isAdmin: boolean;
};

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

export function AteneoGroupHeaderActions({ groupId, isAdmin }: AteneoGroupHeaderActionsProps) {
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
      {isAdmin ? (
        <HeaderButton
          href={`/ateneo/groups/${encodeURIComponent(groupId)}/edit`}
          label={t("headerActions.editGroup")}
        hint={t("headerActions.hints.editGroup")}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
              <circle cx="12" cy="12" r="3.1" />
              <path d="M12 2.8v2.1M12 19.1v2.1M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5" />
            </svg>
          }
        />
      ) : null}
    </div>
  );
}
