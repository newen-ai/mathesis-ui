"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAteneoGroup, joinAteneoGroup, listAteneoTopics, type AteneoGroup, type AteneoTopic } from "@/lib/api/ateneo";
import { AteneoGroupHeaderActions } from "./AteneoGroupHeaderActions";

export type AteneoGroupTopic = {
  id: string;
  authorInitial: string;
  groupLabel: string;
  authorName: string;
  timeLabel: string;
  title: string;
  description: string;
  tone: string;
  reactions: number;
  comments: number;
};

type AteneoGroupFeedProps = {
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

function mapTopic(topic: AteneoTopic): AteneoGroupTopic {
  const authorName = [topic.author.firstName, topic.author.lastName].filter(Boolean).join(" ").trim();

  return {
    id: topic.id,
    authorInitial: topic.author.initials,
    groupLabel: topic.groupLabel,
    authorName: authorName || "Usuario",
    timeLabel: topic.timeLabel,
    title: topic.title,
    description: topic.description,
    tone: topic.tone,
    reactions: topic.reactions,
    comments: topic.comments
  };
}

export function AteneoGroupFeed({ groupId }: AteneoGroupFeedProps) {
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [rules, setRules] = useState<string[]>([]);
  const [topics, setTopics] = useState<AteneoGroupTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const groupRes = await getAteneoGroup(groupId);

        if (cancelled) return;

        setGroup(groupRes.data.group);
        setRules(groupRes.data.rules);

        if (!groupRes.data.group.isMember) {
          setTopics([]);
          return;
        }

        const topicsRes = await listAteneoTopics(groupId);
        if (cancelled) return;
        setTopics(topicsRes.data.topics.map((topic) => mapTopic(topic)));
      } catch {
        if (cancelled) return;
        setGroup(null);
        setRules([]);
        setTopics([]);
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
      const [groupRes, topicsRes] = await Promise.all([
        getAteneoGroup(groupId),
        listAteneoTopics(groupId)
      ]);

      setGroup(groupRes.data.group);
      setRules(groupRes.data.rules);
      setTopics(topicsRes.data.topics.map((topic) => mapTopic(topic)));
    } catch {
      // Keep current preview state if join fails.
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">Cargando grupo...</p>
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

        {group.description ? (
          <p className="mt-4 text-scale-3 text-[var(--text-primary)]">{group.description}</p>
        ) : null}

        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="text-scale-4 font-semibold text-[var(--heading-primary)]">Reglas del grupo</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-scale-3 text-[var(--text-primary)]">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

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

  const canCreateTopics = group.createTopicsMode !== "admins" || group.isAdmin;

  return (
    <>
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
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

          <AteneoGroupHeaderActions groupId={groupId} isAdmin={group.isAdmin} />
        </div>

        {canCreateTopics ? (
          <div className="mt-4">
            <Link
              href={`/ateneo/groups/${encodeURIComponent(groupId)}/new-topic`}
              className="flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95"
            >
              + Nuevo tema
            </Link>
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <h2 className="text-scale-4 font-semibold text-[var(--heading-primary)]">Reglas del grupo</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-scale-3 text-[var(--text-primary)]">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-1 font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
          Temas más populares
        </h2>

        <div className="mt-3 space-y-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topic.id)}`}
              className="block rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--brand-700)] hover:bg-[var(--surface-2)]"
            >
              <article>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-sm font-semibold text-[var(--surface)]">
                    {topic.authorInitial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-scale-2 text-[var(--text-secondary)]">
                      {topic.groupLabel} <span className="mx-1">·</span> <span className="font-semibold text-[var(--text-primary)]">{topic.authorName}</span> <span className="mx-1">·</span> {topic.timeLabel}
                    </p>
                    <h3 className="mt-1 text-[1.32rem] font-semibold leading-tight text-[var(--heading-primary)]">
                      {topic.title}
                    </h3>
                    <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">{topic.description}</p>

                    <div className="mt-3 flex items-center gap-3 text-scale-2 text-[var(--text-secondary)]">
                      <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-0.5 font-semibold text-[var(--brand-800)]">
                        {topic.tone}
                      </span>
                      <span>○ {topic.reactions}</span>
                      <span>💬 {topic.comments}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
