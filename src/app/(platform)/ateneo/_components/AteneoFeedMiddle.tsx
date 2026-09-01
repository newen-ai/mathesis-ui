"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  isImageMimeType,
  listAteneoFeed,
  listAteneoGroups,
  resolveAteneoAttachmentUrl,
  type AteneoTopic,
  type AteneoTopicAttachment
} from "@/lib/api/ateneo";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { LinkPreviewList } from "@/components/ui/LinkPreviewList";

type AteneoFeedTopic = {
  id: string;
  groupId: string;
  groupLabel: string;
  authorImageUrl: string | null;
  authorInitial: string;
  authorName: string;
  timeLabel: string;
  title: string;
  description: string;
  tone: string;
  reactions: number;
  comments: number;
  isRecommended?: boolean;
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
    reactions: topic.reactions,
    comments: topic.comments,
    isRecommended: topic.isRecommended,
    attachments: topic.attachments
  };
}

function FeedTopicCard({ topic }: { topic: AteneoFeedTopic }) {
  const topicHref = `/ateneo/groups/${encodeURIComponent(topic.groupId)}/topics/${encodeURIComponent(topic.id)}`;

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--brand-700)] hover:bg-[var(--surface-2)]">
        <div className="flex items-start gap-3">
          <UserAvatar
            imageUrl={topic.authorImageUrl}
            initials={topic.authorInitial}
            label={`Foto de perfil de ${topic.authorName}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
            initialsClassName="text-sm font-semibold text-[var(--surface)]"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-scale-1 text-[var(--text-secondary)]">
              <span>
                <Link href={topicHref} className="mathesis-link-accent font-medium hover:underline">
                  {topic.groupLabel}
                </Link>
              </span>
              <span>·</span>
              <span className="font-semibold text-[var(--text-primary)]">{topic.authorName}</span>
              <span>·</span>
              <span>{topic.timeLabel}</span>
            </div>

            <h3 className="mt-1 text-scale-4 font-semibold leading-tight text-[var(--heading-primary)]">
              <Link href={topicHref} className="hover:underline">
                {topic.title}
              </Link>
            </h3>
            <LinkifiedText
              text={topic.description}
              className="mt-1 whitespace-pre-wrap text-scale-2 text-[var(--text-secondary)]"
              linkClassName="mathesis-link-accent underline underline-offset-2"
            />
            <LinkPreviewList text={topic.description} className="mt-3 grid gap-2" />

            {topic.attachments.length > 0 ? (
              <div className="mt-3 space-y-2">
                {topic.attachments.map((attachment) => (
                  <div key={attachment.id} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-2)]">
                    {isImageMimeType(attachment.mimeType) ? (
                      <a
                        href={resolveAteneoAttachmentUrl(attachment.downloadUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="block px-3 py-3 text-scale-2 font-medium text-[var(--text-primary)] hover:bg-[var(--surface)]"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span aria-hidden="true">🖼</span>
                          <span className="truncate">{attachment.fileName}</span>
                        </span>
                      </a>
                    ) : (
                      <a
                        href={resolveAteneoAttachmentUrl(attachment.downloadUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between gap-3 px-3 py-3 text-scale-2 font-medium text-[var(--text-primary)] hover:bg-[var(--surface)]"
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <span aria-hidden="true">📄</span>
                          <span className="truncate">{attachment.fileName}</span>
                        </span>
                        <span className="shrink-0 text-scale-1 text-[var(--text-secondary)]">PDF</span>
                      </a>
                    )}
                  </div>
                ))}
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
              <span>💬 {topic.comments}</span>
              <Link href={topicHref} className="mathesis-link-accent font-semibold hover:underline">
                Ver tema
              </Link>
            </div>
          </div>
        </div>
    </article>
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