"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAteneoGroup,
  joinAteneoGroup,
  listAteneoTopics,
  type AteneoGroup,
  type AteneoTopic,
  type AteneoTopicAttachment
} from "@/lib/api/ateneo";
import { AteneoGroupHeaderActions } from "./AteneoGroupHeaderActions";
import { AteneoTopicCard, type AteneoTopicCardTopic } from "./AteneoTopicCard";
import { AteneoGroupMeta } from "./AteneoLocalizedLabels";

export type AteneoGroupTopic = AteneoTopicCardTopic & {
  reactions: number;
  attachments: AteneoTopicAttachment[];
};

type AteneoGroupFeedProps = {
  groupId: string;
};

// Same "selected" treatment as the active group item in the left rail (AteneoExploreGroups).
const GROUP_HEADER_CLASS_NAME =
  "rounded-2xl border border-[var(--brand-500)] bg-[color:color-mix(in_srgb,var(--brand-100)_42%,var(--surface))] p-5 sm:p-6";

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
    authorImageUrl: topic.author.profileImageUrl,
    authorInitial: topic.author.initials,
    authorUserId: topic.author.userId,
    groupLabel: topic.groupLabel,
    authorName: authorName || "Usuario",
    timeLabel: topic.timeLabel,
    createdAt: topic.createdAt,
    title: topic.title,
    description: topic.description,
    tone: topic.tone,
    hotScore: topic.hotScore,
    reactions: topic.reactions,
    comments: topic.comments,
    attachments: topic.attachments
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

        // Non-members can read the group's topics (only joining is needed to participate); users
        // expelled from the group cannot, and the backend answers 404 for them.
        if (!groupRes.data.group.isMember && groupRes.data.group.isJoinBlockedByExpulsion) {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos unirte al grupo.");
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

  const topicsSection =
    topics.length > 0 ? (
      <section className="mt-4">
        <h2 className="px-1 font-display text-scale-5 font-semibold text-[var(--heading-primary)]">
          Temas más populares
        </h2>

        <div className="mt-3 space-y-3">
          {topics.map((topic) => (
            <AteneoTopicCard
              key={topic.id}
              topic={topic}
              topicHref={`/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topic.id)}`}
              variant="group"
            />
          ))}
        </div>
      </section>
    ) : null;

  if (!group.isMember) {
    const joinBlockedByExpulsion = group.isJoinBlockedByExpulsion;
    const joinDisabledTooltip = joinBlockedByExpulsion
      ? "No podés unirte porque fuiste expulsado de este grupo."
      : undefined;

    return (
      <>
      <section className={GROUP_HEADER_CLASS_NAME}>
        <div className="flex min-w-0 items-start gap-3">
          <GroupHeaderIcon />
          <div>
            <h1 className="font-display text-scale-5 font-semibold text-[var(--heading-primary)]">
              {group.name}
            </h1>
            <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">
              <AteneoGroupMeta group={group} />
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
          <span className="inline-flex" title={joinDisabledTooltip}>
            <button
              type="button"
              onClick={() => {
                void onJoin();
              }}
              disabled={isJoining || joinBlockedByExpulsion}
              className="rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold sophium-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isJoining ? "Uniéndote..." : "Unirse al grupo"}
            </button>
          </span>
        </div>

        {joinBlockedByExpulsion ? (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">
            Esta cuenta fue expulsada del grupo y no puede volver a unirse.
          </p>
        ) : (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">
            Podés leer los temas del grupo. Para publicar, comentar o valorar, unite.
          </p>
        )}
      </section>
      {topicsSection}
      </>
    );
  }

  const canCreateTopics = group.createTopicsMode !== "admins" || group.isAdmin;

  return (
    <>
      <section className={GROUP_HEADER_CLASS_NAME}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <GroupHeaderIcon />
            <div>
              <h1 className="font-display text-scale-5 font-semibold text-[var(--heading-primary)]">
                {group.name}
              </h1>
              <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">
                <AteneoGroupMeta group={group} />
              </p>
            </div>
          </div>

          <AteneoGroupHeaderActions groupId={groupId} isAdmin={group.isAdmin} />
        </div>

        {canCreateTopics ? (
          <div className="mt-4">
            <Link
              href={`/ateneo/groups/${encodeURIComponent(groupId)}/new-topic`}
              className="flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold sophium-on-brand transition hover:brightness-95"
            >
              + Nuevo tema
            </Link>
          </div>
        ) : null}

      </section>

      {topicsSection}
    </>
  );
}
