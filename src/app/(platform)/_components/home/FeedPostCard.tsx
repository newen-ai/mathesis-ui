"use client";

import { useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import type { FeedPost } from "../../_lib/types";

type FeedPostCardProps = FeedPost & {
  canManage?: boolean;
  onEdit?: ({ id, contenido }: { id: string; contenido: string }) => void;
  onDelete?: (id: string) => void;
  onShowComingSoon?: () => void;
};

export function FeedPostCard({
  id,
  autor,
  cargo,
  tiempo,
  contenido,
  etiqueta,
  attachment,
  canManage = false,
  onEdit,
  onDelete,
  onShowComingSoon,
}: FeedPostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isRecommended, setIsRecommended] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [draftContent, setDraftContent] = useState(contenido);

  const onSaveEdit = () => {
    const trimmed = draftContent.trim();
    if (!trimmed) return;
    onEdit?.({ id, contenido: trimmed });
    setIsEditing(false);
  };

  const onDeletePost = () => {
    setIsDeleteConfirmOpen(false);
    onDelete?.(id);
  };

  const onRecommend = () => {
    if (isRecommending || isRecommended) return;

    setIsRecommended(true);
    setIsRecommending(true);
    window.setTimeout(() => {
      setIsRecommending(false);
    }, 900);
  };

  const renderAttachment = () => {
    if (!attachment) return null;

    if (attachment.type === "pdf") {
      return (
        <div className="mt-4 border-y border-[var(--line)] bg-[var(--post-file-bg)] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--brand-700)]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M7 3.8h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.8a1 1 0 0 1 1-1Z" />
                  <path d="M14 3.8v4h4" />
                </svg>
              </span>
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{attachment.title}</p>
                <p className="text-sm text-[var(--text-secondary)]">{attachment.subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!attachment.isAvailable) {
                  onShowComingSoon?.();
                  return;
                }

                window.open(attachment.url || "#", "_blank", "noopener,noreferrer");
              }}
              className="mensa-icon-button flex h-10 w-10 items-center justify-center"
              aria-label="Descargar adjunto"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 4v10" />
                <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
                <path d="M6 19h12" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onShowComingSoon?.()}
        className="mt-4 block w-full overflow-hidden border-y border-[var(--line)] text-left"
      >
        <div className="flex h-44 items-center justify-center bg-[var(--post-file-preview-bg)] text-5xl font-semibold text-[var(--brand-500)]">∫</div>
        <div className="bg-[var(--post-file-bg)] px-4 py-3">
          <p className="text-lg font-semibold text-[var(--brand-700)]">{attachment.title}</p>
          <p className="text-sm text-[var(--text-secondary)]">
            {attachment.subtitle}
            {attachment.sourceLabel ? ` · ${attachment.sourceLabel}` : ""}
          </p>
        </div>
      </button>
    );
  };

  return (
    <>
      <AppCard className="rounded-none border-x-0 bg-[var(--post-body-bg)] p-0 md:rounded-2xl md:border-x">
        <div className="px-4 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--navy-900)] text-xl font-bold text-[var(--brand-500)]">
                {autor.charAt(0).toUpperCase()}
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[1.15rem] font-semibold text-[var(--text-primary)]">{autor}</p>
                  {etiqueta ? (
                    <span className="rounded-full border border-[var(--line-strong)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-700)]">
                      {etiqueta}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{cargo}</p>
                <p className="text-sm text-[var(--text-secondary)]">{tiempo}</p>
              </div>
            </div>

            <button type="button" className="mensa-icon-button h-9 w-9" aria-label="Mas acciones">
              ...
            </button>
          </div>

          {isEditing ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--brand-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-100)]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSaveEdit}
                  className="rounded-full bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-[var(--navy-900)] transition hover:brightness-95"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftContent(contenido);
                    setIsEditing(false);
                  }}
                  className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 pb-4 text-[1.05rem] leading-8 text-[var(--text-primary)]">{contenido}</p>
          )}
        </div>

        {renderAttachment()}

        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={onRecommend}
            className={`rounded-lg px-3 py-1 text-[1.05rem] font-semibold transition hover:brightness-95 ${
              isRecommended
                ? "bg-[var(--surface-muted)] text-[var(--brand-700)]"
                : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
            }`}
          >
            ▲ {isRecommended ? "Valorado" : "Recomendar"}
            {isRecommending ? (
              <span className="mensa-spin ml-2 inline-block h-3 w-3 rounded-full border border-current border-r-transparent" aria-hidden="true" />
            ) : null}
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-[var(--text-secondary)]">
            <button type="button" className="transition hover:text-[var(--text-primary)]">Comentar</button>
            <button type="button" className="transition hover:text-[var(--text-primary)]">Compartir</button>
            {canManage && !isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDraftContent(contenido);
                    setIsEditing(true);
                  }}
                  className="transition hover:text-[var(--text-primary)]"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="transition hover:text-[var(--danger-500)]"
                >
                  Eliminar
                </button>
              </>
            ) : null}
          </div>
        </div>
      </AppCard>

      {isDeleteConfirmOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Eliminar publicacion</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">¿Seguro que quieres eliminar esta publicacion?</p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onDeletePost}
                className="rounded-full bg-[var(--danger-500)] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
