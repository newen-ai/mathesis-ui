"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AteneoGroup } from "../_lib/mock-data";
import type { AteneoGroupTopic } from "./AteneoGroupFeed";

type AteneoTopicDiscussionProps = {
  group: AteneoGroup;
  topic: AteneoGroupTopic;
};

const topicComments = [
  {
    id: "c1",
    author: "Micaela",
    initials: "MI",
    text: "Me gustó mucho la parte de la moderación: especialmente el punto de mantener el foco del grupo. Eso hace una gran diferencia.",
    time: "hace 28 min",
  },
  {
    id: "c2",
    author: "Gonzalo",
    initials: "GO",
    text: "Estoy de acuerdo. En mi grupo lo que más cuesta es que aparezcan temas demasiado amplios. Limitar el enfoque ayuda mucho.",
    time: "hace 1 h",
  },
  {
    id: "c3",
    author: "Ana",
    initials: "AN",
    text: "Yo usé una regla parecida en el equipo. Al principio se sentía estricto, pero después se volvió mucho más productivo.",
    time: "hace 2 h",
  },
];

export function AteneoTopicDiscussion({ group, topic }: AteneoTopicDiscussionProps) {
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);
  const [isPostValued, setIsPostValued] = useState(false);
  const [valuedComments, setValuedComments] = useState<Record<string, boolean>>({});
  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);

  const handleReplySubmit = (commentId: string) => {
    const value = (replyDraft[commentId] ?? "").trim();

    if (!value) {
      toast.info("Escribe tu comentario antes de publicar.");
      return;
    }

    toast.success("Comentario enviado");
    setReplyDraft((current) => ({ ...current, [commentId]: "" }));
    setOpenReplyFor(null);
  };

  const toggleCommentValue = (commentId: string) => {
    setValuedComments((current) => ({
      ...current,
      [commentId]: !current[commentId],
    }));
  };

  return (
    <div className="space-y-5">
      <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy-900)] text-[var(--brand-500)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                <path d="M4 18.5c1.5-2.3 4.1-3.5 7-3.5s5.5 1.2 7 3.5" />
                <circle cx="12" cy="8" r="3.4" />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="truncate text-scale-3 font-medium text-[var(--text-secondary)]">{group.name}</p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Guardar tema"
            onClick={() => toast.info("Coming soon")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M6 4.5h12a1 1 0 0 1 1 1v14l-7-5-7 5v-14a1 1 0 0 1 1-1Z" />
            </svg>
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--navy-900)] text-lg font-bold text-[var(--surface)]">
            {topic.authorInitial}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
              {topic.authorName}
            </h2>
          </div>

          <span className="text-scale-2 text-[var(--text-secondary)]">{topic.timeLabel}</span>
        </div>

        <h3 className="mt-5 text-[1.3rem] font-semibold leading-snug text-[var(--heading-primary)] sm:text-[1.6rem]">
          {topic.title}
        </h3>

        <p className="mt-4 text-scale-3 leading-8 text-[var(--text-primary)]">{topic.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--brand-700)]">
            {topic.tone}
          </span>
          <span className="text-scale-2 text-[var(--text-secondary)]">{topic.comments} comentarios</span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--text-secondary)]"
          >
            <span aria-hidden="true">💬</span>
            <span>{topic.comments}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPostValued((current) => !current)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-scale-2 font-semibold ${
              isPostValued
                ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-[var(--surface)]"
                : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--brand-700)]"
            }`}
          >
            <span aria-hidden="true">▲</span>
            <span>{isPostValued ? "Valorado" : "Valorar"}</span>
          </button>
        </div>
      </article>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
            Comentarios
          </h4>
          <button
            type="button"
            onClick={() => setOpenReplyFor("new-comment")}
            className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--text-secondary)]"
          >
            Comentar
          </button>
        </div>

        {openReplyFor === "new-comment" && (
          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
            <textarea
              value={replyDraft["new-comment"] ?? ""}
              onChange={(event) =>
                setReplyDraft((current) => ({
                  ...current,
                  "new-comment": event.target.value,
                }))
              }
              rows={3}
              placeholder="Escribe tu comentario…"
              className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-scale-3 text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleReplySubmit("new-comment")}
                className="rounded-full bg-[var(--brand-700)] px-4 py-2 text-scale-2 font-semibold text-[var(--surface)]"
              >
                Publicar
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {topicComments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpenReplyFor((current) => (current === comment.id ? null : comment.id))}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--navy-900)] text-xs font-bold text-[var(--surface)]">
                      {comment.initials}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--heading-primary)]">{comment.author}</p>
                        <span className="text-scale-1 text-[var(--text-secondary)]">{comment.time}</span>
                      </div>
                      <p className="mt-1 text-scale-3 leading-7 text-[var(--text-primary)]">{comment.text}</p>
                    </div>
                  </div>
                </button>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="Más opciones para comentario"
                    onClick={() => setReportOpenFor((current) => (current === comment.id ? null : comment.id))}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-lg text-[var(--text-secondary)]"
                  >
                    ⋯
                  </button>

                  {reportOpenFor === comment.id && (
                    <div className="absolute right-0 top-10 z-10 min-w-[120px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          toast.info("Comentario reportado");
                          setReportOpenFor(null);
                        }}
                        className="w-full rounded-lg px-2 py-1.5 text-left text-scale-2 font-medium text-[var(--danger-600)] hover:bg-[var(--danger-50)]"
                      >
                        Denunciar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenReplyFor((current) => (current === comment.id ? null : comment.id))}
                  className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--text-secondary)]"
                >
                  Responder
                </button>

                <button
                  type="button"
                  onClick={() => toggleCommentValue(comment.id)}
                  className={`rounded-full border px-3 py-1.5 text-scale-2 font-semibold ${
                    valuedComments[comment.id]
                      ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-[var(--surface)]"
                      : "border-[var(--line)] bg-[var(--surface)] text-[var(--brand-700)]"
                  }`}
                >
                  {valuedComments[comment.id] ? "Valorado" : "Valorar"}
                </button>
              </div>

              {openReplyFor === comment.id && (
                <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  <textarea
                    value={replyDraft[comment.id] ?? ""}
                    onChange={(event) =>
                      setReplyDraft((current) => ({
                        ...current,
                        [comment.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Responder a este comentario…"
                    className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-scale-3 text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(comment.id)}
                      className="rounded-full bg-[var(--brand-700)] px-4 py-2 text-scale-2 font-semibold text-[var(--surface)]"
                    >
                      Publicar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
