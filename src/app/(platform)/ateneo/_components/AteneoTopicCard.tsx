"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, type MouseEvent } from "react";
import { isImageMimeType, resolveAteneoAttachmentUrl, type AteneoTopicAttachment } from "@/lib/api/ateneo";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { LinkPreviewList } from "@/components/ui/LinkPreviewList";

export type AteneoTopicCardTopic = {
  id: string;
  groupLabel: string;
  authorImageUrl: string | null;
  authorInitial: string;
  authorName: string;
  timeLabel: string;
  title: string;
  description: string;
  tone: string;
  comments: number;
  attachments: AteneoTopicAttachment[];
  isRecommended?: boolean;
};

type AteneoTopicCardVariant = "feed" | "group";

type AteneoTopicCardProps = {
  topic: AteneoTopicCardTopic;
  topicHref: string;
  variant: AteneoTopicCardVariant;
  showRecommendedBadge?: boolean;
};

export function AteneoTopicCard({ topic, topicHref, variant, showRecommendedBadge = false }: AteneoTopicCardProps) {
  const router = useRouter();

  const metaClassName =
    variant === "feed"
      ? "flex flex-wrap items-center gap-x-2 gap-y-1 text-scale-1 text-[var(--text-secondary)]"
      : "text-scale-2 text-[var(--text-secondary)]";
  const titleClassName =
    variant === "feed"
      ? "mt-1 text-scale-4 font-semibold leading-tight text-[var(--heading-primary)]"
      : "mt-1 text-[1.32rem] font-semibold leading-tight text-[var(--heading-primary)]";
  const descriptionClassName =
    variant === "feed"
      ? "mt-1 whitespace-pre-wrap text-scale-2 text-[var(--text-secondary)]"
      : "mt-1 whitespace-pre-wrap text-scale-3 text-[var(--text-secondary)]";
  const footerClassName =
    variant === "feed"
      ? "mt-3 flex flex-wrap items-center gap-3 text-scale-1 text-[var(--text-secondary)]"
      : "mt-3 flex items-center gap-3 text-scale-2 text-[var(--text-secondary)]";

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, [role='button']")) {
      return;
    }

    router.push(topicHref);
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, [role='button']")) {
      return;
    }

    event.preventDefault();
    router.push(topicHref);
  };

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      className="cursor-pointer rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-4 transition hover:border-[var(--brand-700)] hover:bg-[var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-2"
      aria-label={`Ver tema ${topic.title}`}
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          imageUrl={topic.authorImageUrl}
          initials={topic.authorInitial}
          label={`Foto de perfil de ${topic.authorName}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
          initialsClassName="text-sm font-semibold text-[var(--surface)]"
        />

        <div className="min-w-0 flex-1">
          {variant === "feed" ? (
            <div className={metaClassName}>
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
          ) : (
            <p className={metaClassName}>
              <Link href={topicHref} className="mathesis-link-accent font-medium hover:underline">
                {topic.groupLabel}
              </Link>{" "}
              <span className="mx-1">·</span> <span className="font-semibold text-[var(--text-primary)]">{topic.authorName}</span> <span className="mx-1">·</span> {topic.timeLabel}
            </p>
          )}

          <h3 className={titleClassName}>
            <Link href={topicHref} className="hover:underline">
              {topic.title}
            </Link>
          </h3>

          <LinkifiedText
            text={topic.description}
            className={descriptionClassName}
            linkClassName="mathesis-link-accent underline underline-offset-2"
          />
          <LinkPreviewList text={topic.description} className="mt-3 grid gap-2" />

          {topic.attachments.length > 0 ? (
            <div className="mt-3 space-y-2">
              {topic.attachments.map((attachment) =>
                variant === "feed" ? (
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
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span aria-hidden="true">📄</span>
                          <span className="truncate">{attachment.fileName}</span>
                        </span>
                        <span className="shrink-0 text-scale-1 text-[var(--text-secondary)]">PDF</span>
                      </a>
                    )}
                  </div>
                ) : (
                  <a
                    key={attachment.id}
                    href={resolveAteneoAttachmentUrl(attachment.downloadUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-scale-2 font-medium text-[var(--text-primary)] hover:bg-[var(--surface)]"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">{isImageMimeType(attachment.mimeType) ? "🖼" : "📄"}</span>
                      <span className="truncate">{attachment.fileName}</span>
                    </span>
                  </a>
                )
              )}
            </div>
          ) : null}

          <div className={footerClassName}>
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-0.5 font-semibold text-[var(--brand-800)]">
              {topic.tone}
            </span>
            {showRecommendedBadge && topic.isRecommended ? (
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_55%,var(--surface))] px-2.5 py-0.5 font-semibold text-[var(--brand-900)]">
                Recomendado para vos
              </span>
            ) : null}
            <span>💬 {topic.comments}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
