"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/UserAvatar";
import {
  createAteneoTopicComment,
  getAteneoGroup,
  getAteneoTopic,
  listAteneoTopicComments,
  toggleAteneoCommentReaction,
  toggleAteneoTopicReaction,
  type AteneoComment,
  type AteneoGroup,
  type AteneoTopic
} from "@/lib/api/ateneo";

type AteneoTopicDiscussionProps = {
  groupId: string;
  topicId: string;
};

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M6 4.5v15" />
      <path d="M6 5.5h9l-1.2 3 1.2 3H6" />
    </svg>
  );
}

function fullName(comment: AteneoComment): string {
  return [comment.author.firstName, comment.author.lastName].filter(Boolean).join(" ").trim() || "Usuario";
}

function mentionFromContent(content: string): string | null {
  const match = content.match(/^@(\S+)/);
  return match?.[1] ?? null;
}

export function AteneoTopicDiscussion({ groupId, topicId }: AteneoTopicDiscussionProps) {
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [topic, setTopic] = useState<AteneoTopic | null>(null);
  const [topicComments, setTopicComments] = useState<AteneoComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [openReplyFor, setOpenReplyFor] = useState<string | null>(null);
  const [reportOpenFor, setReportOpenFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const [groupRes, topicRes, commentsRes] = await Promise.all([
          getAteneoGroup(groupId),
          getAteneoTopic(groupId, topicId),
          listAteneoTopicComments(groupId, topicId)
        ]);

        if (cancelled) return;

        setGroup(groupRes.data.group);
        setTopic(topicRes.data.topic);
        setTopicComments(commentsRes.data.comments);
      } catch {
        if (cancelled) return;
        setGroup(null);
        setTopic(null);
        setTopicComments([]);
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
  }, [groupId, topicId]);

  const isPostValued = topic?.currentUserReactionValue === "value";
  const topicAuthorName = [topic?.author.firstName, topic?.author.lastName].filter(Boolean).join(" ").trim() || "Usuario";
  const canComment = group?.commentsMode !== "admins" || Boolean(group?.isAdmin);
  const valuedComments = useMemo(
    () =>
      topicComments.reduce<Record<string, boolean>>((acc, comment) => {
        acc[comment.id] = comment.currentUserReactionValue === "value";
        return acc;
      }, {}),
    [topicComments]
  );

  const commentsById = useMemo(() => {
    const map = new Map<string, AteneoComment>();
    topicComments.forEach((comment) => {
      map.set(comment.id, comment);
    });
    return map;
  }, [topicComments]);

  const orderedComments = useMemo(() => {
    const roots = topicComments.filter((comment) => !comment.parentCommentId);
    const byParent = new Map<string, AteneoComment[]>();

    topicComments.forEach((comment) => {
      if (!comment.parentCommentId) {
        return;
      }

      const topLevelParentId = commentsById.get(comment.parentCommentId)?.parentCommentId ?? comment.parentCommentId;
      const current = byParent.get(topLevelParentId) ?? [];
      current.push(comment);
      byParent.set(topLevelParentId, current);
    });

    const result: AteneoComment[] = [];

    roots.forEach((root) => {
      result.push(root);
      const replies = byParent.get(root.id) ?? [];
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      result.push(...replies);
    });

    return result;
  }, [commentsById, topicComments]);

  const resolveReplyParentId = (commentId: string): string | undefined => {
    if (commentId === "new-comment") {
      return undefined;
    }

    const target = commentsById.get(commentId);
    if (!target) {
      return commentId;
    }

    return target.parentCommentId ?? target.id;
  };

  const handleReplySubmit = async (commentId: string) => {
    if (!topic) {
      return;
    }

    const value = (replyDraft[commentId] ?? "").trim();

    if (!value) {
      toast.info("Escribe tu comentario antes de publicar.");
      return;
    }

    const targetComment = topicComments.find((comment) => comment.id === commentId);

    try {
      const response = await createAteneoTopicComment(groupId, topic.id, {
        content: value,
        parentCommentId: resolveReplyParentId(commentId),
        mentionUserId: targetComment?.author.userId
      });

      setTopicComments((current) => [...current, response.data.comment]);
      setTopic((current) => (current ? { ...current, comments: current.comments + 1 } : current));
    } catch {
      toast.error("No pudimos publicar tu comentario.");
      return;
    }

    const mentioned = mentionFromContent(value);
    if (mentioned) {
      toast.success(`Comentario enviado. Se notificará a @${mentioned}.`);
    } else {
      toast.success("Comentario enviado");
    }

    setReplyDraft((current) => ({ ...current, [commentId]: "" }));
    setOpenReplyFor(null);
  };

  const toggleCommentValue = async (commentId: string) => {
    if (!topic) {
      return;
    }

    try {
      const response = await toggleAteneoCommentReaction(groupId, topic.id, commentId);
      setTopicComments((current) =>
        current.map((comment) => (comment.id === commentId ? response.data.comment : comment))
      );
    } catch {
      toast.error("No pudimos actualizar la valoración.");
    }
  };

  const startReplyFor = (commentId: string, author: string) => {
    setOpenReplyFor(commentId);
    setReplyDraft((current) => ({
      ...current,
      [commentId]: `@${author} `,
    }));
  };

  const toggleTopicValue = async () => {
    if (!topic) {
      return;
    }

    try {
      const response = await toggleAteneoTopicReaction(groupId, topic.id);
      setTopic(response.data.topic);
    } catch {
      toast.error("No pudimos actualizar la valoración.");
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <p className="text-scale-3 text-[var(--text-secondary)]">Cargando tema...</p>
      </section>
    );
  }

  if (!group || !topic) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <p className="text-scale-3 text-[var(--text-secondary)]">No pudimos cargar este tema.</p>
      </section>
    );
  }

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

          <div className="flex items-center gap-2">
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

            <div className="relative">
              <button
                type="button"
                aria-label="Más opciones del tema"
                onClick={() => setReportOpenFor((current) => (current === "post" ? null : "post"))}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-xl leading-none text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)]"
              >
                ⋯
              </button>

              {reportOpenFor === "post" && (
                <div className="absolute right-0 top-12 z-10 min-w-[140px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Tema reportado");
                      setReportOpenFor(null);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-scale-2 font-medium text-[var(--danger-600)] hover:bg-[var(--danger-50)]"
                  >
                    <span className="text-[var(--danger-600)]">
                      <FlagIcon />
                    </span>
                    <span>Denunciar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <UserAvatar
            imageUrl={topic.author.profileImageUrl}
            initials={topic.author.initials}
            label={`Foto de perfil de ${topicAuthorName}`}
            className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
            initialsClassName="text-lg font-bold text-[var(--surface)]"
          />

          <div className="min-w-0 flex-1">
            <h2 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
              {topicAuthorName}
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
            onClick={toggleTopicValue}
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
          {canComment ? (
            <button
              type="button"
              onClick={() => setOpenReplyFor("new-comment")}
              className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--text-secondary)]"
            >
              Comentar
            </button>
          ) : null}
        </div>

        {canComment && openReplyFor === "new-comment" && (
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
          {orderedComments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 ${comment.parentCommentId ? "ml-6" : ""}`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpenReplyFor((current) => (current === comment.id ? null : comment.id))}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      imageUrl={comment.author.profileImageUrl}
                      initials={comment.author.initials}
                      label={`Foto de perfil de ${fullName(comment)}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                      initialsClassName="text-xs font-bold text-[var(--surface)]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-[var(--heading-primary)]">{fullName(comment)}</p>
                        <span className="text-scale-1 text-[var(--text-secondary)]">{comment.timeLabel}</span>
                      </div>
                      <p className="mt-1 text-scale-3 leading-7 text-[var(--text-primary)]">{comment.content}</p>
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
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-scale-2 font-medium text-[var(--danger-600)] hover:bg-[var(--danger-50)]"
                      >
                        <span className="text-[var(--danger-600)]">
                          <FlagIcon />
                        </span>
                        <span>Denunciar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {canComment ? (
                  <button
                    type="button"
                    onClick={() => startReplyFor(comment.id, fullName(comment))}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-scale-2 font-semibold text-[var(--text-secondary)]"
                  >
                    Responder
                  </button>
                ) : null}

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

              {canComment && openReplyFor === comment.id && (
                <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                  <textarea
                    autoFocus
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
