"use client";

import { useEffect, useState } from "react";
import { getAteneoGroup, joinAteneoGroup, type AteneoGroup } from "@/lib/api/ateneo";

type AteneoGroupInfoPanelProps = {
  groupId: string;
};

function GroupHeaderIcon() {
  return (
    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="8.5" cy="9" r="2.2" />
        <circle cx="15.5" cy="10.5" r="2.2" />
        <path d="M4.5 18.5a4 4 0 0 1 8 0" />
        <path d="M11.5 18.5a4 4 0 0 1 8 0" />
      </svg>
    </div>
  );
}

export function AteneoGroupInfoPanel({ groupId }: AteneoGroupInfoPanelProps) {
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [rules, setRules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const response = await getAteneoGroup(groupId);
        if (cancelled) return;
        setGroup(response.data.group);
        setRules(response.data.rules);
      } catch {
        if (cancelled) return;
        setGroup(null);
        setRules([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const onJoin = async () => {
    if (isJoining) return;

    setIsJoining(true);
    try {
      await joinAteneoGroup(groupId);
      const response = await getAteneoGroup(groupId);
      setGroup(response.data.group);
      setRules(response.data.rules);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">Cargando información...</p>
      </section>
    );
  }

  if (!group) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">No pudimos cargar este grupo.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
      <div className="flex min-w-0 items-start gap-3">
        <GroupHeaderIcon />
        <div>
          <h1 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
            {group.name}
          </h1>
          <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">
            {group.subtitle} <span className="mx-1">·</span> {group.activity}
          </p>
        </div>
      </div>

      {group.description ? (
        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="text-scale-1 font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Descripción del grupo</p>
          <p className="mt-2 text-scale-3 text-[var(--text-primary)]">{group.description}</p>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <h2 className="text-scale-4 font-semibold text-[var(--heading-primary)]">Reglas del grupo</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-scale-3 text-[var(--text-primary)]">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>

      {!group.isMember ? (
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void onJoin();
            }}
            disabled={isJoining}
            className="rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isJoining ? "Uniéndote..." : "Unirse al grupo"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
