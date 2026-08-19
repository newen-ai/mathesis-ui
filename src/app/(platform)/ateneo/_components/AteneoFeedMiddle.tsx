"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listAteneoFeed, listAteneoGroups, type AteneoTopic } from "@/lib/api/ateneo";

type AteneoFeedTopic = {
  id: string;
  groupId: string;
  groupLabel: string;
  authorInitial: string;
  authorName: string;
  timeLabel: string;
  title: string;
  description: string;
  tone: string;
  reactions: number;
  comments: number;
  isRecommended?: boolean;
  attachmentLabel?: string;
  hasImage?: boolean;
};

function mapTopic(topic: AteneoTopic): AteneoFeedTopic {
  const authorName = [topic.author.firstName, topic.author.lastName].filter(Boolean).join(" ").trim();

  return {
    id: topic.id,
    groupId: topic.groupId,
    groupLabel: topic.groupLabel,
    authorInitial: topic.author.initials,
    authorName: authorName || "Usuario",
    timeLabel: topic.timeLabel,
    title: topic.title,
    description: topic.description,
    tone: topic.tone,
    reactions: topic.reactions,
    comments: topic.comments,
    isRecommended: topic.isRecommended
  };
}

function FeedTopicCard({ topic }: { topic: AteneoFeedTopic }) {
  return (
    <Link
      href={`/ateneo/groups/${encodeURIComponent(topic.groupId)}/topics/${encodeURIComponent(topic.id)}`}
      className="block rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--brand-700)] hover:bg-[var(--surface-2)]"
    >
      <article>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-sm font-semibold text-[var(--surface)]">
            {topic.authorInitial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-scale-1 text-[var(--text-secondary)]">
              <span>{topic.groupLabel}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--text-primary)]">{topic.authorName}</span>
              <span>·</span>
              <span>{topic.timeLabel}</span>
            </div>

            <h3 className="mt-1 text-scale-4 font-semibold leading-tight text-[var(--heading-primary)]">{topic.title}</h3>
            <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">{topic.description}</p>

            {topic.attachmentLabel ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_55%,var(--surface))] px-3 py-1 text-scale-1 font-medium text-[var(--brand-900)]">
                <span aria-hidden="true">📄</span>
                <span>{topic.attachmentLabel}</span>
              </div>
            ) : null}

            {topic.hasImage ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--navy-900)]">
                <div className="flex min-h-[145px] items-center justify-center bg-[linear-gradient(180deg,rgba(18,47,78,1)_0%,rgba(17,41,69,1)_100%)] text-[2.2rem] text-[var(--brand-500)]">
                  ∫
                </div>
                <div className="border-t border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-scale-1 text-[var(--text-secondary)]">
                  Foto: tapa de la edición en español
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-scale-1 text-[var(--text-secondary)]">
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-0.5 font-semibold text-[var(--brand-800)]">
                {topic.tone}
              </span>
              {topic.isRecommended ? (
                <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_55%,var(--surface))] px-2.5 py-0.5 font-semibold text-[var(--brand-900)]">
                  Recomendado para vos
                </span>
              ) : null}
              <span>○ {topic.reactions}</span>
              <span>💬 {topic.comments}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function AteneoFeedMiddle() {
  const [topics, setTopics] = useState<AteneoFeedTopic[]>([]);
  const [createTopicGroupId, setCreateTopicGroupId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const [feedResponse, mineResponse] = await Promise.all([listAteneoFeed(), listAteneoGroups("mine", 1)]);
        if (cancelled) return;
        setTopics(feedResponse.data.topics.map((topic) => mapTopic(topic)));
        setCreateTopicGroupId(mineResponse.data.groups[0]?.id ?? null);
      } catch {
        if (cancelled) return;
        setTopics([]);
        setCreateTopicGroupId(null);
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
  }, []);

  const createTopicHref = createTopicGroupId
    ? `/ateneo/groups/${encodeURIComponent(createTopicGroupId)}/new-topic`
    : "/ateneo/groups?tab=mine";

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-spectral)] text-scale-4 font-semibold leading-tight text-[var(--heading-primary)]">Feed</h1>
            <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">Todos tus grupos, mezclados</p>
          </div>

          <Link
            href={createTopicHref}
            className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-2 font-semibold mathesis-on-brand transition hover:brightness-95"
          >
            + Nuevo tema
          </Link>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {isLoading ? <p className="px-1 text-scale-3 text-[var(--text-secondary)]">Cargando feed...</p> : null}
        {!isLoading && topics.length === 0 ? <p className="px-1 text-scale-3 text-[var(--text-secondary)]">No hay temas para mostrar.</p> : null}
        {topics.map((topic) => (
          <FeedTopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </section>
  );
}