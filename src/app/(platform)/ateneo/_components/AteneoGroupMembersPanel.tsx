"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
import { resolveDateLocale } from "@/lib/utils/relative-time";
import { AteneoKickMemberModal } from "./AteneoKickMemberModal";
import { AteneoRemovedTopicPreviewModal } from "./AteneoRemovedTopicPreviewModal";
import { AteneoGroupMeta } from "./AteneoLocalizedLabels";

type AteneoGroupMembersPanelProps = {
  groupId: string;
};

type PanelTab = "members" | "moderation";
type ModerationTab = "users" | "topics" | "comments";

type ModerationData = {
  expulsions: AteneoGroupExpulsion[];
  removedTopics: AteneoRemovedTopic[];
  removedComments: AteneoRemovedComment[];
};

const MEMBERS_PAGE_SIZE = 20;
const EMPTY_MODERATION: ModerationData = { expulsions: [], removedTopics: [], removedComments: [] };

async function fetchModeration(groupId: string): Promise<ModerationData> {
  const [expulsionsResponse, removedContentResponse] = await Promise.all([
    listAteneoGroupExpulsions(groupId),
    listAteneoRemovedContent(groupId)
  ]);

  return {
    expulsions: expulsionsResponse.data.expulsions,
    removedTopics: removedContentResponse.data.topics,
    removedComments: removedContentResponse.data.comments
  };
}

function displayName(person: { firstName?: string | null; lastName?: string | null }, fallback: string) {
  return [person.firstName, person.lastName].filter(Boolean).join(" ").trim() || fallback;
}

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

function GroupHeader({ group }: { group: AteneoGroup }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <GroupHeaderIcon />
      <div>
        <h1 className="font-[family-name:var(--font-spectral)] text-scale-5 font-semibold text-[var(--heading-primary)]">
          {group.name}
        </h1>
        <p className="mt-1 text-scale-3 text-[var(--text-secondary)]">
          <AteneoGroupMeta group={group} />
        </p>
      </div>
    </div>
  );
}

function PanelTabButton({
  isActive,
  onSelect,
  label,
  count,
  highlightCount = false
}: {
  isActive: boolean;
  onSelect: () => void;
  label: string;
  count: number;
  highlightCount?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onSelect}
      className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-scale-3 font-semibold transition ${
        isActive
          ? "border-[var(--brand-500)] text-[var(--heading-primary)]"
          : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-scale-1 font-semibold ${
          highlightCount && count > 0
            ? "bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] text-[var(--brand-900)]"
            : "bg-[var(--surface-2)] text-[var(--text-secondary)]"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function FilterChip({ isActive, onSelect, children }: { isActive: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onSelect}
      className={`rounded-full border px-3 py-1.5 text-scale-2 font-semibold ${
        isActive
          ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-[var(--surface)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}

const ROW_CLASS_NAME = "flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3";
const SECONDARY_ACTION_CLASS_NAME =
  "rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--brand-700)] hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60";

export function AteneoGroupMembersPanel({ groupId }: AteneoGroupMembersPanelProps) {
  const { t, i18n } = useTranslation("ateneo");
  const [panelTab, setPanelTab] = useState<PanelTab>("members");
  const [moderationTab, setModerationTab] = useState<ModerationTab>("users");
  const [group, setGroup] = useState<AteneoGroup | null>(null);
  const [members, setMembers] = useState<AteneoGroupMember[]>([]);
  const [membersNextCursor, setMembersNextCursor] = useState<string | null>(null);
  const [isLoadingMoreMembers, setIsLoadingMoreMembers] = useState(false);
  const [moderation, setModeration] = useState<ModerationData>(EMPTY_MODERATION);
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

  const dateLocale = resolveDateLocale(i18n.language);
  const formatDate = useCallback((value: string) => new Date(value).toLocaleDateString(dateLocale), [dateLocale]);
  const userFallback = t("membersPanel.userFallback");

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

  // Group, first page of members and (for admins) moderation lists. Used on mount and after joining.
  const fetchPanelData = useCallback(async () => {
    const groupResponse = await getAteneoGroup(groupId);
    const nextGroup = groupResponse.data.group;

    if (!nextGroup.isMember) {
      return { group: nextGroup, members: [], nextCursor: null, moderation: EMPTY_MODERATION };
    }

    const [membersResponse, nextModeration] = await Promise.all([
      listAteneoGroupMembers(groupId, { limit: MEMBERS_PAGE_SIZE }),
      nextGroup.isAdmin ? fetchModeration(groupId) : Promise.resolve(EMPTY_MODERATION)
    ]);

    return {
      group: nextGroup,
      members: membersResponse.data.members,
      nextCursor: membersResponse.data.nextCursor ?? null,
      moderation: nextModeration
    };
  }, [groupId]);

  const applyPanelData = useCallback((data: Awaited<ReturnType<typeof fetchPanelData>>) => {
    setGroup(data.group);
    setMembers(data.members);
    setMembersNextCursor(data.nextCursor);
    setModeration(data.moderation);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPanelData();
        if (!cancelled) applyPanelData(data);
      } catch {
        if (cancelled) return;
        setGroup(null);
        setMembers([]);
        setMembersNextCursor(null);
        setModeration(EMPTY_MODERATION);
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
  }, [applyPanelData, fetchPanelData]);

  const onJoin = async () => {
    if (isJoining) return;

    setIsJoining(true);
    try {
      await joinAteneoGroup(groupId);
      applyPanelData(await fetchPanelData());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("membersPanel.joinError"));
    } finally {
      setIsJoining(false);
    }
  };

  const loadMoreMembers = async () => {
    if (isLoadingMoreMembers || !membersNextCursor) return;

    setIsLoadingMoreMembers(true);
    try {
      const response = await listAteneoGroupMembers(groupId, { limit: MEMBERS_PAGE_SIZE, cursor: membersNextCursor });
      setMembers((current) => {
        const seen = new Set(current.map((member) => member.userId));
        return [...current, ...response.data.members.filter((member) => !seen.has(member.userId))];
      });
      setMembersNextCursor(response.data.nextCursor ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("membersPanel.loadMoreError"));
    } finally {
      setIsLoadingMoreMembers(false);
    }
  };

  // After a moderation action: refresh the group (member count), moderation lists, and optionally the
  // members list from its first page (a readmitted user rejoins, so pagination restarts).
  const refreshAfterModeration = async ({ reloadMembers }: { reloadMembers: boolean }) => {
    const [groupResponse, nextModeration, membersResponse] = await Promise.all([
      getAteneoGroup(groupId),
      fetchModeration(groupId),
      reloadMembers ? listAteneoGroupMembers(groupId, { limit: MEMBERS_PAGE_SIZE }) : Promise.resolve(null)
    ]);

    setGroup(groupResponse.data.group);
    setModeration(nextModeration);
    if (membersResponse) {
      setMembers(membersResponse.data.members);
      setMembersNextCursor(membersResponse.data.nextCursor ?? null);
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

      // Drop the row locally so the pages already loaded stay in place.
      setMembers((current) => current.filter((member) => member.userId !== kickTarget.userId));
      await refreshAfterModeration({ reloadMembers: false });
      setKickTarget(null);
      setMemberMenuOpenFor(null);
      toast.success(t("membersPanel.kicked"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("membersPanel.kickError"));
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
      await refreshAfterModeration({ reloadMembers: true });
      toast.success(t("membersPanel.moderation.readmitted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("membersPanel.moderation.readmitError"));
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
      await refreshAfterModeration({ reloadMembers: false });
      toast.success(t("membersPanel.moderation.topicRestored"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("membersPanel.moderation.restoreTopicError"));
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
      await refreshAfterModeration({ reloadMembers: false });
      toast.success(t("membersPanel.moderation.commentRestored"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("membersPanel.moderation.restoreCommentError"));
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
      toast.error(error instanceof Error ? error.message : t("membersPanel.moderation.previewError"));
    } finally {
      setIsLoadingRemovedTopicPreviewId(null);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">{t("membersPanel.loading")}</p>
      </section>
    );
  }

  if (!group) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="text-scale-3 text-[var(--text-secondary)]">{t("membersPanel.loadError")}</p>
      </section>
    );
  }

  if (!group.isMember) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
        <GroupHeader group={group} />

        <p className="mt-5 text-scale-3 text-[var(--text-secondary)]">{t("membersPanel.joinToSee")}</p>

        <div className="mt-5">
          <span
            className="inline-flex"
            title={group.isJoinBlockedByExpulsion ? t("membersPanel.joinBlockedHint") : undefined}
          >
            <button
              type="button"
              onClick={() => {
                void onJoin();
              }}
              disabled={isJoining || group.isJoinBlockedByExpulsion}
              className="rounded-full bg-[var(--brand-500)] px-6 py-2.5 text-scale-3 font-semibold sophium-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isJoining ? t("membersPanel.joining") : t("membersPanel.join")}
            </button>
          </span>
        </div>

        {group.isJoinBlockedByExpulsion ? (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">{t("membersPanel.joinBlocked")}</p>
        ) : null}
      </section>
    );
  }

  // memberCount comes from the backend since the pagination release; older responses fall back to what is loaded.
  const totalMembers = group.memberCount ?? members.length;
  const pendingModerationCount =
    moderation.expulsions.length + moderation.removedTopics.length + moderation.removedComments.length;
  const activeTab: PanelTab = group.isAdmin ? panelTab : "members";

  const membersList = (
    <>
      <div className="space-y-3">
        {members.map((member) => {
          const fullName = displayName(member, userFallback);

          return (
            <article key={member.userId} className={ROW_CLASS_NAME}>
              <UserAvatar
                imageUrl={member.profileImageUrl}
                initials={member.initials}
                label={t("membersPanel.avatar", { name: fullName })}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                initialsClassName="text-sm font-semibold text-[var(--surface)]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{fullName}</h2>
                  {member.isOwner ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--text-secondary)]">
                      {t("membersPanel.badges.owner")}
                    </span>
                  ) : null}
                  {member.isAdmin ? (
                    <span className="rounded-full border border-[color:color-mix(in_srgb,var(--brand-500)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--brand-100)_62%,var(--surface))] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--brand-900)]">
                      {t("membersPanel.badges.admin")}
                    </span>
                  ) : null}
                  {member.isPinned ? (
                    <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-scale-1 font-semibold text-[var(--text-secondary)]">
                      {t("membersPanel.badges.pinned")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
                  {t("membersPanel.memberSince", { date: formatDate(member.joinedAt) })}
                </p>
              </div>

              {group.isAdmin ? (
                <div className="relative shrink-0" data-ateneo-overflow-root="true">
                  <button
                    type="button"
                    aria-label={t("membersPanel.moreOptions", { name: fullName })}
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
                            toast.info(t("membersPanel.kickNotAllowed"));
                            setMemberMenuOpenFor(null);
                            return;
                          }

                          setKickTarget(member);
                        }}
                        disabled={!canManageTarget(member.userId)}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-scale-2 font-medium text-[var(--danger-500)] hover:bg-[color:color-mix(in_srgb,var(--danger-500)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {t("membersPanel.kick")}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-scale-2 text-[var(--text-secondary)]">
          {membersNextCursor
            ? t("membersPanel.showing", { shown: members.length, total: totalMembers })
            : t("membersPanel.total", { count: totalMembers })}
        </p>
        {membersNextCursor ? (
          <button
            type="button"
            onClick={() => {
              void loadMoreMembers();
            }}
            disabled={isLoadingMoreMembers}
            className={SECONDARY_ACTION_CLASS_NAME}
          >
            {isLoadingMoreMembers ? t("membersPanel.loadingMore") : t("membersPanel.loadMore")}
          </button>
        ) : null}
      </div>
    </>
  );

  const moderationSection = (
    <div>
      <p className="text-scale-2 text-[var(--text-secondary)]">{t("membersPanel.moderation.intro")}</p>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t("membersPanel.moderation.filtersAria")}>
        <FilterChip isActive={moderationTab === "users"} onSelect={() => setModerationTab("users")}>
          {t("membersPanel.moderation.users", { count: moderation.expulsions.length })}
        </FilterChip>
        <FilterChip isActive={moderationTab === "topics"} onSelect={() => setModerationTab("topics")}>
          {t("membersPanel.moderation.topics", { count: moderation.removedTopics.length })}
        </FilterChip>
        <FilterChip isActive={moderationTab === "comments"} onSelect={() => setModerationTab("comments")}>
          {t("membersPanel.moderation.comments", { count: moderation.removedComments.length })}
        </FilterChip>
      </div>

      {moderationTab === "users" ? (
        moderation.expulsions.length === 0 ? (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">{t("membersPanel.moderation.noUsers")}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {moderation.expulsions.map((expulsion) => {
              const expelledName = displayName(expulsion, userFallback);
              const kickedByName = displayName(expulsion.kickedBy, t("membersPanel.adminFallback"));

              return (
                <article key={expulsion.userId} className={ROW_CLASS_NAME}>
                  <UserAvatar
                    imageUrl={expulsion.profileImageUrl}
                    initials={expulsion.initials}
                    label={t("membersPanel.avatar", { name: expelledName })}
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                    initialsClassName="text-sm font-semibold text-[var(--surface)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-scale-3 font-semibold text-[var(--heading-primary)]">{expelledName}</p>
                    <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
                      {t("membersPanel.moderation.kickedBy", { name: kickedByName, date: formatDate(expulsion.kickedAt) })}
                    </p>
                    {expulsion.reason ? (
                      <p className="mt-1 line-clamp-2 text-scale-2 text-[var(--text-secondary)]">
                        {t("membersPanel.moderation.reason", { reason: expulsion.reason })}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleRestore(expulsion.userId);
                    }}
                    disabled={isRestoringUserId === expulsion.userId}
                    className={SECONDARY_ACTION_CLASS_NAME}
                  >
                    {isRestoringUserId === expulsion.userId
                      ? t("membersPanel.moderation.readmitting")
                      : t("membersPanel.moderation.readmit")}
                  </button>
                </article>
              );
            })}
          </div>
        )
      ) : null}

      {moderationTab === "topics" ? (
        moderation.removedTopics.length === 0 ? (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">{t("membersPanel.moderation.noTopics")}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {moderation.removedTopics.map((topic) => {
              const authorName = displayName(topic.author, userFallback);

              return (
                <article
                  key={topic.topicId}
                  onClick={() => {
                    void handleOpenRemovedTopicPreview(topic.topicId);
                  }}
                  className={`${ROW_CLASS_NAME} cursor-pointer`}
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
                      {t("membersPanel.moderation.topicBy", { name: authorName, date: formatDate(topic.deletedAt) })}
                    </p>
                    <p className="mt-1 text-scale-1 text-[var(--text-secondary)]">
                      {isLoadingRemovedTopicPreviewId === topic.topicId
                        ? t("membersPanel.moderation.opening")
                        : t("membersPanel.moderation.clickToView")}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleRestoreTopic(topic.topicId);
                    }}
                    disabled={isRestoringTopicId === topic.topicId}
                    className={SECONDARY_ACTION_CLASS_NAME}
                  >
                    {isRestoringTopicId === topic.topicId
                      ? t("membersPanel.moderation.restoring")
                      : t("membersPanel.moderation.restoreTopic")}
                  </button>
                </article>
              );
            })}
          </div>
        )
      ) : null}

      {moderationTab === "comments" ? (
        moderation.removedComments.length === 0 ? (
          <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">{t("membersPanel.moderation.noComments")}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {moderation.removedComments.map((comment) => {
              const authorName = displayName(comment.author, userFallback);

              return (
                <article key={comment.commentId} className={ROW_CLASS_NAME}>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-scale-3 font-medium text-[var(--heading-primary)]">
                      {comment.contentPreview || t("membersPanel.moderation.emptyComment")}
                    </p>
                    <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">
                      {t("membersPanel.moderation.commentBy", { name: authorName, date: formatDate(comment.deletedAt) })}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleRestoreComment(comment.topicId, comment.commentId);
                    }}
                    disabled={isRestoringCommentId === comment.commentId}
                    className={SECONDARY_ACTION_CLASS_NAME}
                  >
                    {isRestoringCommentId === comment.commentId
                      ? t("membersPanel.moderation.restoring")
                      : t("membersPanel.moderation.restoreComment")}
                  </button>
                </article>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
      <GroupHeader group={group} />

      {group.isAdmin ? (
        <div role="tablist" aria-label={t("membersPanel.tabsAria")} className="mt-5 flex gap-1 border-b border-[var(--line)]">
          <PanelTabButton
            isActive={activeTab === "members"}
            onSelect={() => setPanelTab("members")}
            label={t("membersPanel.tabs.members")}
            count={totalMembers}
          />
          <PanelTabButton
            isActive={activeTab === "moderation"}
            onSelect={() => setPanelTab("moderation")}
            label={t("membersPanel.tabs.moderation")}
            count={pendingModerationCount}
            highlightCount
          />
        </div>
      ) : null}

      <div className="mt-5" role={group.isAdmin ? "tabpanel" : undefined}>
        {activeTab === "members" ? membersList : moderationSection}
      </div>

      {kickTarget ? (
        <AteneoKickMemberModal
          isOpen
          userName={displayName(kickTarget, userFallback)}
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
