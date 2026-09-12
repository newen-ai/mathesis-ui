"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AteneoRemovedComment,
  AteneoRemovedTopic,
  AteneoTopic,
  getAteneoGroup,
  getAteneoRemovedTopicPreview,
  joinAteneoGroup,
  kickAteneoGroupMember,
  listAteneoGroupExpulsions,
  listAteneoGroupMembers,
  listAteneoRemovedContent,
  moderateRestoreAteneoComment,
  moderateRestoreAteneoTopic,
  restoreAteneoGroupMember,
  type AteneoGroup,
  type AteneoGroupExpulsion,
  type AteneoGroupMember
} from "@/lib/api/ateneo";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { getSessionUserId } from "@/lib/api/auth";
import { AteneoKickMemberModal } from "./AteneoKickMemberModal";
import { AteneoRemovedTopicPreviewModal } from "./AteneoRemovedTopicPreviewModal";

type AteneoGroupMembersPanelProps = {
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

export function AteneoGroupMembersPanel({ groupId }: AteneoGroupMembersPanelProps) {
  const [moderationTab, setModerationTab] = useState<"users" | "topics" | "comments">("users");
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [members, setMembers] = useState<AteneoGroupMember[]>([]);
  const [expulsions, setExpulsions] = useState<AteneoGroupExpulsion[]>([]);
  const [removedTopics, setRemovedTopics] = useState<AteneoRemovedTopic[]>([]);
  const [removedComments, setRemovedComments] = useState<AteneoRemovedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [memberMenuOpenFor, setMemberMenuOpenFor] = useState<string | null>(null);
  const [kickTarget, setKickTarget] = useState<AteneoGroupMember | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [isRestoringUserId, setIsRestoringUserId] = useState<string | null>(null);
  const [isRestoringTopicId, setIsRestoringTopicId] = useState<string | null>(null);
  const [isRestoringCommentId, setIsRestoringCommentId] = useState<string | null>(null);
  const [isLoadingRemovedTopicPreviewId, setIsLoadingRemovedTopicPreviewId] = useState<string | null>(null);
  const [removedTopicPreview, setRemovedTopicPreview] = useState<{ topic: AteneoTopic; deletedAt: string } | null>(null);

  useEffect(() => {
    if (!memberMenuOpenFor) {
      return;
    }

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (target instanceof Element && target.closest("[data-ateneo-overflow-root='true']")) {
        return;
      }

      setMemberMenuOpenFor(null);
    };

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMemberMenuOpenFor(null);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);
    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, [memberMenuOpenFor]);

  useEffect(() => {
    let cancelled = false;

    void getSessionUserId().then((userId) => {
      if (!cancelled) {
        setSessionUserId(userId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const groupResponse = await getAteneoGroup(groupId);
        if (cancelled) return;
        setGroup(groupResponse.data.group);

        if (!groupResponse.data.group.isMember) {
          setMembers([]);
          setExpulsions([]);
          setRemovedTopics([]);
          setRemovedComments([]);
          return;
        }

        const [membersResponse, expulsionsResponse, removedContentResponse] = await Promise.all([
          listAteneoGroupMembers(groupId),
          groupResponse.data.group.isAdmin ? listAteneoGroupExpulsions(groupId) : Promise.resolve({ data: { expulsions: [] } }),
          groupResponse.data.group.isAdmin
            ? listAteneoRemovedContent(groupId)
            : Promise.resolve({ data: { topics: [] as AteneoRemovedTopic[], comments: [] as AteneoRemovedComment[] } })
        ]);
        if (cancelled) return;
        setMembers(membersResponse.data.members);
        setExpulsions(expulsionsResponse.data.expulsions);
        setRemovedTopics(removedContentResponse.data.topics);
        setRemovedComments(removedContentResponse.data.comments);
      } catch {
        if (cancelled) return;
        setGroup(null);
        setMembers([]);
        setExpulsions([]);
        setRemovedTopics([]);
        setRemovedComments([]);
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
      const [groupResponse, membersResponse] = await Promise.all([
        getAteneoGroup(groupId),
        listAteneoGroupMembers(groupId)
      ]);
      const expulsionsResponse = groupResponse.data.group.isAdmin
        ? await listAteneoGroupExpulsions(groupId)
        : { data: { expulsions: [] as AteneoGroupExpulsion[] } };
      const removedContentResponse = groupResponse.data.group.isAdmin
        ? await listAteneoRemovedContent(groupId)
        : { data: { topics: [] as AteneoRemovedTopic[], comments: [] as AteneoRemovedComment[] } };
      setGroup(groupResponse.data.group);
      setMembers(membersResponse.data.members);
      setExpulsions(expulsionsResponse.data.expulsions);
      setRemovedTopics(removedContentResponse.data.topics);
      setRemovedComments(removedContentResponse.data.comments);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos unirte al grupo.");
    } finally {
      setIsJoining(false);
    }
  };

  const memberByUserId = useMemo(() => {
    const next = new Map<string, AteneoGroupMember>();
    members.forEach((member) => {
      next.set(member.userId, member);
    });
    return next;
  }, [members]);

  const canManageTarget = (targetUserId: string) => {
    if (!group?.isAdmin || !sessionUserId) {
      return false;
    }

    if (targetUserId === sessionUserId) {
      return false;
    }

    const target = memberByUserId.get(targetUserId);
    if (!target) {
      return false;
    }

    if (target.isOwner) {
      return false;
    }

    if (target.isAdmin && !group.isOwner) {
      return false;
    }

    return true;
  };

  const refreshMembersAndExpulsions = async () => {
    const [membersResponse, expulsionsResponse, removedContentResponse] = await Promise.all([
      listAteneoGroupMembers(groupId),
      group?.isAdmin ? listAteneoGroupExpulsions(groupId) : Promise.resolve({ data: { expulsions: [] } }),
      group?.isAdmin
        ? listAteneoRemovedContent(groupId)
        : Promise.resolve({ data: { topics: [] as AteneoRemovedTopic[], comments: [] as AteneoRemovedComment[] } })
    ]);

    setMembers(membersResponse.data.members);
    setExpulsions(expulsionsResponse.data.expulsions);
    setRemovedTopics(removedContentResponse.data.topics);
    setRemovedComments(removedContentResponse.data.comments);
  };

  const handleKickConfirm = async (reason: string | undefined) => {
    if (!kickTarget) {
      return;
    }

    setIsKicking(true);
    try {
      await kickAteneoGroupMember(groupId, kickTarget.userId, {
        sourceContext: "MEMBERS_LIST",
        ...(reason ? { reason } : {})
      });

      await refreshMembersAndExpulsions();
      setKickTarget(null);
      setMemberMenuOpenFor(null);
      toast.success("Usuario expulsado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos expulsar al usuario.");
    } finally {
      setIsKicking(false);
    }
  };

  const handleRestore = async (targetUserId: string) => {
    if (isRestoringUserId) {
      return;
    }

    setIsRestoringUserId(targetUserId);
    try {
      await restoreAteneoGroupMember(groupId, targetUserId);
      await refreshMembersAndExpulsions();
      toast.success("Usuario readmitido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos readmitir al usuario.");
    } finally {
      setIsRestoringUserId(null);
    }
  };

  const handleRestoreTopic = async (topicId: string) => {
    if (isRestoringTopicId) {
      return;
    }

    setIsRestoringTopicId(topicId);
    try {
      await moderateRestoreAteneoTopic(groupId, topicId, {});
      await refreshMembersAndExpulsions();
      toast.success("Publicación restaurada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos restaurar la publicación.");
    } finally {
      setIsRestoringTopicId(null);
    }
  };

  const handleRestoreComment = async (topicId: string, commentId: string) => {
    if (isRestoringCommentId) {
      return;
    }

    setIsRestoringCommentId(commentId);
    try {
      await moderateRestoreAteneoComment(groupId, topicId, commentId, {});
      await refreshMembersAndExpulsions();
      toast.success("Comentario restaurado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos restaurar el comentario.");
    } finally {
      setIsRestoringCommentId(null);
    }
  };

  const handleOpenRemovedTopicPreview = async (topicId: string) => {
    if (isLoadingRemovedTopicPreviewId) {
      return;
    }

    setIsLoadingRemovedTopicPreviewId(topicId);
    try {
      const response = await getAteneoRemovedTopicPreview(groupId, topicId);
      setRemovedTopicPreview(response.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos abrir la vista previa de la publicación eliminada.");
    } finally {
      setIsLoadingRemovedTopicPreviewId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">Cargando miembros...</p>
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

        <p className="mt-5 text-scale-3 text-[var(--text-secondary)]">
          Unite al grupo para ver el listado completo de miembros.
        </p>

        <div className="mt-5">
          <span
            className="inline-flex"
            title={
              group.isJoinBlockedByExpulsion
                ? "No podés unirte porque fuiste expulsado de este grupo."
                : undefined
            }
          >
            <button
              type="button"
              onClick={() => {
                void onJoin();
              }}
              disabled={isJoining || group.isJoinBlockedByExpulsion}
              className="rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold mathesis-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isJoining ? "Uniéndote..." : "Unirse al grupo"}
            </button>
          </span>
        </div>

        {group.isJoinBlockedByExpulsion ? (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">
            Esta cuenta fue expulsada del grupo y no puede volver a unirse.
          </p>
        ) : null}
      </section>
    );
  }

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

      <div className="mt-5 space-y-3">
        {members.map((member) => {
          const fullName = [member.firstName, member.lastName].filter(Boolean).join(" ").trim() || "Usuario";

          return (
            <article key={member.userId} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
              <UserAvatar
                imageUrl={member.profileImageUrl}
                initials={member.initials}
                label={`Foto de perfil de ${fullName}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                initialsClassName="text-sm font-semibold text-[var(--surface)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{fullName}</h2>
                  {member.isOwner ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--text-secondary)]">
                      OWNER
                    </span>
                  ) : null}
                  {member.isAdmin ? (
                    <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--brand-900)]">
                      ADMIN
                    </span>
                  ) : null}
                  {member.isPinned ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--text-secondary)]">
                      FIJADO
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">Miembro desde {new Date(member.joinedAt).toLocaleDateString("es-AR")}</p>
              </div>

              {group.isAdmin ? (
                <div className="relative shrink-0" data-ateneo-overflow-root="true">
                  <button
                    type="button"
                    aria-label={`Más opciones para ${fullName}`}
                    onClick={() => setMemberMenuOpenFor((current) => (current === member.userId ? null : member.userId))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-lg text-[var(--text-secondary)] hover:bg-[var(--surface)]"
                  >
                    ⋯
                  </button>

                  {memberMenuOpenFor === member.userId ? (
                    <div className="absolute right-0 top-10 z-10 min-w-[180px] rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          if (!canManageTarget(member.userId)) {
                            toast.info("No tenés permisos para expulsar a este usuario.");
                            setMemberMenuOpenFor(null);
                            return;
                          }

                          setKickTarget(member);
                        }}
                        disabled={!canManageTarget(member.userId)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-scale-2 font-medium text-[var(--danger-500)] hover:bg-[color:color-mix(in_srgb,var(--danger-500)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Expulsar usuario
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-scale-2 text-[var(--text-secondary)]">{members.length} miembros en total.</p>

      {group.isAdmin ? (
        <div className="mt-6">
          <h3 className="font-[family-name:var(--font-spectral)] text-scale-4 font-semibold text-[var(--heading-primary)]">
            Moderación
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setModerationTab("users")}
              className={`rounded-full border px-3 py-1.5 text-scale-2 font-semibold ${
                moderationTab === "users"
                  ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-[var(--surface)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
              }`}
            >
              Usuarios ({expulsions.length})
            </button>
            <button
              type="button"
              onClick={() => setModerationTab("topics")}
              className={`rounded-full border px-3 py-1.5 text-scale-2 font-semibold ${
                moderationTab === "topics"
                  ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-[var(--surface)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
              }`}
            >
              Temas ({removedTopics.length})
            </button>
            <button
              type="button"
              onClick={() => setModerationTab("comments")}
              className={`rounded-full border px-3 py-1.5 text-scale-2 font-semibold ${
                moderationTab === "comments"
                  ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-[var(--surface)]"
                  : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
              }`}
            >
              Comentarios ({removedComments.length})
            </button>
          </div>

          {moderationTab === "users" ? (
            expulsions.length === 0 ? (
              <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">No hay usuarios expulsados actualmente.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {expulsions.map((expulsion) => {
                  const expelledName = [expulsion.firstName, expulsion.lastName].filter(Boolean).join(" ").trim() || "Usuario";
                  const kickedByName = [expulsion.kickedBy.firstName, expulsion.kickedBy.lastName].filter(Boolean).join(" ").trim() || "Admin";

                  return (
                    <article key={expulsion.userId} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                      <UserAvatar
                        imageUrl={expulsion.profileImageUrl}
                        initials={expulsion.initials}
                        label={`Foto de perfil de ${expelledName}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                        initialsClassName="text-sm font-semibold text-[var(--surface)]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{expelledName}</p>
                        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
                          Expulsado por {kickedByName} · {new Date(expulsion.kickedAt).toLocaleDateString("es-AR")}
                        </p>
                        {expulsion.reason ? (
                          <p className="mt-1 line-clamp-2 text-scale-2 text-[var(--text-secondary)]">Motivo: {expulsion.reason}</p>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleRestore(expulsion.userId);
                        }}
                        disabled={isRestoringUserId === expulsion.userId}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--brand-700)] hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRestoringUserId === expulsion.userId ? "Readmitiendo..." : "Readmitir"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )
          ) : null}

          {moderationTab === "topics" ? (
            removedTopics.length === 0 ? (
              <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">No hay publicaciones eliminadas por moderación.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {removedTopics.map((topic) => {
                  const authorName = [topic.author.firstName, topic.author.lastName].filter(Boolean).join(" ").trim() || "Usuario";

                  return (
                    <article
                      key={topic.topicId}
                      onClick={() => {
                        void handleOpenRemovedTopicPreview(topic.topicId);
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3"
                    >
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleOpenRemovedTopicPreview(topic.topicId);
                        }}
                        disabled={isLoadingRemovedTopicPreviewId === topic.topicId}
                        className="min-w-0 flex-1 rounded-xl px-1 py-1 text-left transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <p className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{topic.title}</p>
                        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
                          Publicación de {authorName} · {new Date(topic.deletedAt).toLocaleDateString("es-AR")}
                        </p>
                        <p className="mt-1 text-scale-1 text-[var(--text-secondary)]">
                          {isLoadingRemovedTopicPreviewId === topic.topicId ? "Abriendo..." : "Click para ver contenido"}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleRestoreTopic(topic.topicId);
                        }}
                        disabled={isRestoringTopicId === topic.topicId}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--brand-700)] hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRestoringTopicId === topic.topicId ? "Restaurando..." : "Restaurar publicación"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )
          ) : null}

          {moderationTab === "comments" ? (
            removedComments.length === 0 ? (
              <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">No hay comentarios eliminados por moderación.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {removedComments.map((comment) => {
                  const authorName = [comment.author.firstName, comment.author.lastName].filter(Boolean).join(" ").trim() || "Usuario";

                  return (
                    <article key={comment.commentId} className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-scale-3 font-medium text-[var(--heading-primary)]">{comment.contentPreview || "Comentario sin contenido"}</p>
                        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
                          Comentario de {authorName} · {new Date(comment.deletedAt).toLocaleDateString("es-AR")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleRestoreComment(comment.topicId, comment.commentId);
                        }}
                        disabled={isRestoringCommentId === comment.commentId}
                        className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--brand-700)] hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isRestoringCommentId === comment.commentId ? "Restaurando..." : "Restaurar comentario"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      ) : null}

      {kickTarget ? (
        <AteneoKickMemberModal
          isOpen
          userName={[kickTarget.firstName, kickTarget.lastName].filter(Boolean).join(" ").trim() || "Usuario"}
          isSubmitting={isKicking}
          onClose={() => {
            if (!isKicking) {
              setKickTarget(null);
            }
          }}
          onConfirm={handleKickConfirm}
        />
      ) : null}

      {removedTopicPreview ? (
        <AteneoRemovedTopicPreviewModal
          isOpen
          topic={removedTopicPreview.topic}
          deletedAt={removedTopicPreview.deletedAt}
          onClose={() => setRemovedTopicPreview(null)}
        />
      ) : null}
    </section>
  );
}
