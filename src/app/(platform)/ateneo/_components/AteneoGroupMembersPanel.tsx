"use client";

import { useEffect, useState } from "react";
import { getAteneoGroup, listAteneoGroupMembers, joinAteneoGroup, type AteneoGroup, type AteneoGroupMember } from "@/lib/api/ateneo";

type AteneoGroupMembersPanelProps = {
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

export function AteneoGroupMembersPanel({ groupId }: AteneoGroupMembersPanelProps) {
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [members, setMembers] = useState<AteneoGroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const groupResponse = await getAteneoGroup(groupId);
        if (cancelled) return;
        setGroup(groupResponse.data.group);

        if (!groupResponse.data.group.isMember) {
          setMembers([]);
          return;
        }

        const membersResponse = await listAteneoGroupMembers(groupId);
        if (cancelled) return;
        setMembers(membersResponse.data.members);
      } catch {
        if (cancelled) return;
        setGroup(null);
        setMembers([]);
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
      const [groupResponse, membersResponse] = await Promise.all([
        getAteneoGroup(groupId),
        listAteneoGroupMembers(groupId)
      ]);
      setGroup(groupResponse.data.group);
      setMembers(membersResponse.data.members);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">Cargando miembros...</p>
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

  if (!group.isMember) {
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

        <p className="mt-5 text-scale-3 text-[var(--text-secondary)]">
          Unite al grupo para ver el listado completo de miembros.
        </p>

        <div className="mt-5">
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

      <div className="mt-5 space-y-3">
        {members.map((member) => {
          const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ").trim() || "Usuario";

          return (
            <article key={member.userId} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-sm font-semibold text-[var(--surface)]">
                {member.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{fullName}</h2>
                  {member.isAdmin ? (
                    <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--brand-900)]">
                      ADMIN
                    </span>
                  ) : null}
                  {member.isPinned ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--text-secondary)]">
                      FIJADO
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">Miembro desde {new Date(member.joinedAt).toLocaleDateString("es-AR")}</p>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-scale-2 text-[var(--text-secondary)]">{members.length} miembros en total.</p>
    </section>
  );
}
