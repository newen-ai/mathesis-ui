"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listAteneoFeed,
  listAteneoGroups,
  type AteneoTopic,
  type AteneoTopicAttachment
} from "@/lib/api/ateneo";
import { AteneoTopicCard, type AteneoTopicCardTopic } from "./AteneoTopicCard";

type AteneoFeedTopic = AteneoTopicCardTopic & {
  groupId: string;
  reactions: number;
  attachments: AteneoTopicAttachment[];
};

function mapTopic(topic: AteneoTopic): AteneoFeedTopic {
  const authorName = [topic.author.firstName, topic.author.lastName].filter(Boolean).join(" ").trim();

  return {
    id: topic.id,
    groupId: topic.groupId,
    groupLabel: topic.groupLabel,
    authorImageUrl: topic.author.profileImageUrl,
    authorInitial: topic.author.initials,
    authorName: authorName || "Usuario",
    timeLabel: topic.timeLabel,
    title: topic.title,
    description: topic.description,
    tone: topic.tone,
    hotScore: topic.hotScore,
    reactions: topic.reactions,
    comments: topic.comments,
    isRecommended: topic.isRecommended,
    attachments: topic.attachments
  };
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
          <AteneoTopicCard
            key={topic.id}
            topic={topic}
            topicHref={`/ateneo/groups/${encodeURIComponent(topic.groupId)}/topics/${encodeURIComponent(topic.id)}`}
            variant="feed"
            showRecommendedBadge
          />
        ))}
      </div>
    </section>
  );
}