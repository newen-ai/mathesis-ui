"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type AteneoGroupHeaderActionsProps = {
  groupId: string;
  isAdmin: boolean;
};

function HeaderButton({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
    >
      {icon}
    </Link>
  );
}

export function AteneoGroupHeaderActions({ groupId, isAdmin }: AteneoGroupHeaderActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <HeaderButton
        href={`/ateneo/groups/${encodeURIComponent(groupId)}/info`}
        label="Ver info del grupo"
        icon={
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <path d="M7 6.5h10M7 12h10M7 17.5h7" />
            <path d="M5.5 4.5h13a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z" />
          </svg>
        }
      />
      <HeaderButton
        href={`/ateneo/groups/${encodeURIComponent(groupId)}/members`}
        label="Ver miembros del grupo"
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
          label="Editar grupo"
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
