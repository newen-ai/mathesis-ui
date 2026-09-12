"use client";

import { useEffect } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { LinkifiedText } from "@/components/ui/LinkifiedText";
import { LinkPreviewList } from "@/components/ui/LinkPreviewList";
import { type AteneoTopic } from "@/lib/api/ateneo";

type AteneoRemovedTopicPreviewModalProps = {
  isOpen: boolean;
  topic: AteneoTopic;
  deletedAt: string;
  onClose: () => void;
};

export function AteneoRemovedTopicPreviewModal({ isOpen, topic, deletedAt, onClose }: AteneoRemovedTopicPreviewModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const authorName = [topic.author.firstName, topic.author.lastName].filter(Boolean).join(" ").trim() || "Usuario";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color:color-mix(in_srgb,var(--navy-950)_80%,transparent)] backdrop-blur-[1px] px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
              Publicación eliminada
            </h3>
            <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
              Eliminada el {new Date(deletedAt).toLocaleDateString("es-AR")}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text-secondary)]"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              imageUrl={topic.author.profileImageUrl}
              initials={topic.author.initials}
              label={`Foto de perfil de ${authorName}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
              initialsClassName="text-sm font-semibold text-[var(--surface)]"
            />
            <div className="min-w-0">
              <p className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{authorName}</p>
              <p className="text-scale-2 text-[var(--text-secondary)]">{topic.timeLabel}</p>
            </div>
          </div>

          <h4 className="mt-4 text-[1.2rem] font-semibold text-[var(--heading-primary)] sm:text-[1.35rem]">{topic.title}</h4>

          <LinkifiedText
            text={topic.description}
            className="mt-3 whitespace-pre-wrap text-scale-3 leading-8 text-[var(--text-primary)]"
            linkClassName="mathesis-link-accent underline underline-offset-2"
          />
          <LinkPreviewList text={topic.description} className="mt-3 grid gap-2 sm:grid-cols-2" />

          {topic.attachments.length > 0 ? (
            <div className="mt-4 space-y-2">
              {topic.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-scale-2 text-[var(--text-secondary)]"
                >
                  {attachment.fileName}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
