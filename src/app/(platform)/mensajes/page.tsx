"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppCard } from "@/components/ui/AppCard";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ModulePage } from "../_components/ModulePage";
import { getMyProfileIdentity, searchProfiles } from "@/lib/api/profile";
import { getTwoInitials } from "@/lib/utils/name";
import {
  ChatDetail,
  ChatMessageSummary,
  ChatSummary,
  ChatUserSummary,
  createDirectChat,
  createGroupChat,
  getChatById,
  listMyChats,
  markChatAsRead,
  readChatMessages,
  sendChatMessage,
} from "@/lib/api/chat";

type Thread = {
  summary: ChatSummary;
  detail: ChatDetail;
  displayName: string;
  roleLine: string;
  profileImageUrl: string | null;
};

type ContactOption = {
  userId: string;
  fullName: string;
  roleLine: string;
  profileImageUrl: string | null;
};

const CHAT_LIST_LIMIT = 30;
const MESSAGE_PAGE_SIZE = 30;
const POLLING_INTERVAL_MS = 10000;

function humanizeTime(isoDate: string | null) {
  if (!isoDate) return "";

  const target = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMinutes = Math.floor((now - target) / 60000);

  if (diffMinutes <= 1) return "Ahora";
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  if (diffHours < 48) return "Ayer";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(isoDate));
}

function formatFullName(user: ChatUserSummary) {
  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return fullName || "Usuario";
}

function formatRoleLine(user: ChatUserSummary) {
  const values = [user.currentJobTitle, user.currentCompany].filter(Boolean);
  return values.length > 0 ? values.join(" · ") : "Sin datos profesionales";
}

function deriveThreadPresentation(
  summary: ChatSummary,
  detail: ChatDetail,
  currentUserId: string | null
): Thread {
  if (detail.type === "GROUP") {
    return {
      summary,
      detail,
      displayName: detail.title?.trim() || "Grupo sin titulo",
      roleLine: `${detail.members.length} miembros`,
      profileImageUrl: null,
    };
  }

  const otherMember = detail.members.find((member) => member.user.userId !== currentUserId);

  return {
    summary,
    detail,
    displayName: otherMember ? formatFullName(otherMember.user) : "Chat directo",
    roleLine: otherMember ? formatRoleLine(otherMember.user) : "Contacto",
    profileImageUrl: otherMember?.user.profileImageUrl ?? null,
  };
}

function mergeAndSortMessages(existing: ChatMessageSummary[], incoming: ChatMessageSummary[]) {
  const map = new Map<string, ChatMessageSummary>();

  for (const message of existing) {
    map.set(message.id, message);
  }

  for (const message of incoming) {
    map.set(message.id, message);
  }

  return [...map.values()].sort((a, b) => {
    if (a.createdAt === b.createdAt) return a.id.localeCompare(b.id);
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export default function MensajesPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [messagesByChatId, setMessagesByChatId] = useState<Record<string, ChatMessageSummary[]>>({});
  const [nextCursorByChatId, setNextCursorByChatId] = useState<Record<string, string | null>>({});
  const [loadingOlderByChatId, setLoadingOlderByChatId] = useState<Record<string, boolean>>({});
  const [loadingMessagesByChatId, setLoadingMessagesByChatId] = useState<Record<string, boolean>>({});

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [recipientContacts, setRecipientContacts] = useState<ContactOption[]>([]);
  const [contactSearchText, setContactSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<ContactOption[]>([]);
  const [isSearchingContacts, setIsSearchingContacts] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupTitleError, setGroupTitleError] = useState<string | null>(null);
  const [pendingGroupMessage, setPendingGroupMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.summary.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  const selectedMessages = useMemo(
    () => (selectedThread ? messagesByChatId[selectedThread.summary.id] ?? [] : []),
    [messagesByChatId, selectedThread]
  );

  const selectedThreadMemberNamesByUserId = useMemo(() => {
    if (!selectedThread) {
      return new Map<string, string>();
    }

    const map = new Map<string, string>();

    for (const member of selectedThread.detail.members) {
      map.set(member.user.userId, formatFullName(member.user));
    }

    return map;
  }, [selectedThread]);

  const selectedThreadBlockedReason = useMemo(() => {
    if (!selectedThread || selectedThread.detail.type !== "DIRECT") {
      return null;
    }

    if (selectedThread.detail.isBlockedByOtherUser) {
      return "Has sido bloqueado por este usuario";
    }

    if (selectedThread.detail.isBlockedByCurrentUser) {
      return "Has bloqueado a este usuario";
    }

    return null;
  }, [selectedThread]);

  const isSelectedThreadComposerBlocked = !isComposerOpen && Boolean(selectedThreadBlockedReason);

  const contactsFromExistingChats = useMemo(() => {
    const map = new Map<string, ContactOption>();

    for (const thread of threads) {
      for (const member of thread.detail.members) {
        if (member.user.userId === currentUserId) continue;

        if (!map.has(member.user.userId)) {
          map.set(member.user.userId, {
            userId: member.user.userId,
            fullName: formatFullName(member.user),
            roleLine: formatRoleLine(member.user),
            profileImageUrl: member.user.profileImageUrl ?? null,
          });
        }
      }
    }

    return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [threads, currentUserId]);

  const recipientUserIds = useMemo(
    () => recipientContacts.map((recipient) => recipient.userId),
    [recipientContacts]
  );

  const displayedContacts = useMemo(() => {
    const search = contactSearchText.trim();
    return search ? searchResults : contactsFromExistingChats;
  }, [contactSearchText, searchResults, contactsFromExistingChats]);

  const refreshThreads = useCallback(
    async (preferredChatId?: string, viewerUserId?: string | null) => {
      const listResponse = await listMyChats(CHAT_LIST_LIMIT);
      const summaries = listResponse.data.chats;

      const detailResults = await Promise.allSettled(
        summaries.map((summary) => getChatById(summary.id))
      );

      const nextThreads: Thread[] = [];

      for (let index = 0; index < summaries.length; index += 1) {
        const detailResult = detailResults[index];
        const summary = summaries[index];

        if (!detailResult || detailResult.status !== "fulfilled") {
          continue;
        }

        nextThreads.push(
          deriveThreadPresentation(
            summary,
            detailResult.value.data,
            viewerUserId ?? currentUserId
          )
        );
      }

      setThreads(nextThreads);

      let nextSelected = "";

      if (preferredChatId && nextThreads.some((thread) => thread.summary.id === preferredChatId)) {
        nextSelected = preferredChatId;
      } else if (selectedThreadId && nextThreads.some((thread) => thread.summary.id === selectedThreadId)) {
        nextSelected = selectedThreadId;
      } else {
        nextSelected = nextThreads[0]?.summary.id ?? "";
      }

      setSelectedThreadId(nextSelected);

      return nextSelected;
    },
    [currentUserId, selectedThreadId]
  );

  const loadLatestMessages = useCallback(async (chatId: string, markAsRead = false) => {
    setLoadingMessagesByChatId((current) => ({
      ...current,
      [chatId]: true,
    }));

    try {
      const messagesResponse = await readChatMessages(chatId, {
        limit: MESSAGE_PAGE_SIZE,
      });

      const latestMessagesAscending = [...messagesResponse.data.messages].reverse();

      setMessagesByChatId((current) => ({
        ...current,
        [chatId]: mergeAndSortMessages(current[chatId] ?? [], latestMessagesAscending),
      }));

      setNextCursorByChatId((current) => ({
        ...current,
        [chatId]: messagesResponse.data.nextCursor,
      }));

      if (markAsRead) {
        await markChatAsRead(chatId);
        setThreads((current) =>
          current.map((thread) =>
            thread.summary.id === chatId
              ? {
                  ...thread,
                  summary: {
                    ...thread.summary,
                    unreadMessagesCount: 0,
                  },
                }
              : thread
          )
        );

        requestAnimationFrame(() => {
          const viewport = messageViewportRef.current;
          if (!viewport) return;
          viewport.scrollTop = viewport.scrollHeight;
        });
      }
    } finally {
      setLoadingMessagesByChatId((current) => ({
        ...current,
        [chatId]: false,
      }));
    }
  }, []);

  const loadOlderMessages = useCallback(async (chatId: string) => {
    const nextCursor = nextCursorByChatId[chatId];

    if (!nextCursor || loadingOlderByChatId[chatId]) {
      return;
    }

    setLoadingOlderByChatId((current) => ({
      ...current,
      [chatId]: true,
    }));

    const viewport = messageViewportRef.current;
    const previousScrollHeight = viewport?.scrollHeight ?? 0;
    const previousScrollTop = viewport?.scrollTop ?? 0;

    try {
      const response = await readChatMessages(chatId, {
        limit: MESSAGE_PAGE_SIZE,
        cursor: nextCursor,
      });

      const olderAscending = [...response.data.messages].reverse();

      setMessagesByChatId((current) => ({
        ...current,
        [chatId]: mergeAndSortMessages(olderAscending, current[chatId] ?? []),
      }));

      setNextCursorByChatId((current) => ({
        ...current,
        [chatId]: response.data.nextCursor,
      }));

      requestAnimationFrame(() => {
        if (!viewport) return;
        const nextScrollHeight = viewport.scrollHeight;
        viewport.scrollTop = nextScrollHeight - previousScrollHeight + previousScrollTop;
      });
    } finally {
      setLoadingOlderByChatId((current) => ({
        ...current,
        [chatId]: false,
      }));
    }
  }, [loadingOlderByChatId, nextCursorByChatId]);

  const runGroupCreationAndSend = useCallback(
    async (title: string, initialMessage: string) => {
      const sanitizedTitle = title.trim();

      if (!sanitizedTitle) {
        setGroupTitleError("El titulo del grupo es obligatorio.");
        return;
      }

      setIsSending(true);
      setComposerError(null);

      try {
        const creation = await createGroupChat(sanitizedTitle, recipientUserIds);
        const chatId = creation.data.chat.id;

        await sendChatMessage(chatId, initialMessage);
        await refreshThreads(chatId);
        await loadLatestMessages(chatId, true);

        setSelectedThreadId(chatId);
        setIsComposerOpen(false);
        setRecipientContacts([]);
        setContactSearchText("");
        setSearchResults([]);
        setDraftMessage("");
        setIsTitleModalOpen(false);
        setGroupTitle("");
        setPendingGroupMessage("");
      } catch {
        setComposerError("No se pudo crear el grupo o enviar el mensaje.");
      } finally {
        setIsSending(false);
      }
    },
    [loadLatestMessages, recipientUserIds, refreshThreads]
  );

  const runGroupCreationOnly = useCallback(
    async (title: string) => {
      const sanitizedTitle = title.trim();

      if (!sanitizedTitle) {
        setGroupTitleError("El titulo del grupo es obligatorio.");
        return;
      }

      setIsSending(true);
      setComposerError(null);

      try {
        const creation = await createGroupChat(sanitizedTitle, recipientUserIds);
        const chatId = creation.data.chat.id;

        await refreshThreads(chatId);
        await loadLatestMessages(chatId, true);

        setSelectedThreadId(chatId);
        setIsComposerOpen(false);
        setRecipientContacts([]);
        setContactSearchText("");
        setSearchResults([]);
        setDraftMessage("");
        setIsTitleModalOpen(false);
        setGroupTitle("");
        setPendingGroupMessage("");
      } catch {
        setComposerError("No se pudo crear el grupo.");
      } finally {
        setIsSending(false);
      }
    },
    [loadLatestMessages, recipientUserIds, refreshThreads]
  );

  const onConfirmChatCreation = useCallback(async () => {
    if (!isComposerOpen || isSending) {
      return;
    }

    setComposerError(null);

    if (recipientUserIds.length === 0) {
      setComposerError("Selecciona al menos un contacto para crear el chat.");
      return;
    }

    if (recipientUserIds.length === 1) {
      setIsSending(true);

      try {
        const direct = await createDirectChat(recipientUserIds[0]);
        const chatId = direct.data.chat.id;

        await refreshThreads(chatId);
        await loadLatestMessages(chatId, true);

        setSelectedThreadId(chatId);
        setIsComposerOpen(false);
        setRecipientContacts([]);
        setContactSearchText("");
        setSearchResults([]);
      } catch {
        setComposerError("No se pudo crear el chat directo.");
      } finally {
        setIsSending(false);
      }

      return;
    }

    setGroupTitleError(null);
    setIsTitleModalOpen(true);
  }, [isComposerOpen, isSending, loadLatestMessages, recipientUserIds, refreshThreads]);

  const onSend = useCallback(async () => {
    const trimmedMessage = draftMessage.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setComposerError(null);

    if (isComposerOpen) {
      if (recipientUserIds.length === 0) {
        setComposerError("Selecciona al menos un contacto para iniciar la conversacion.");
        return;
      }

      if (recipientUserIds.length === 1) {
        setIsSending(true);

        try {
          const direct = await createDirectChat(recipientUserIds[0]);
          const chatId = direct.data.chat.id;

          await sendChatMessage(chatId, trimmedMessage);
          await refreshThreads(chatId);
          await loadLatestMessages(chatId, true);

          setSelectedThreadId(chatId);
          setDraftMessage("");
          setIsComposerOpen(false);
          setRecipientContacts([]);
          setContactSearchText("");
          setSearchResults([]);
        } catch {
          setComposerError("No se pudo abrir el chat directo o enviar el mensaje.");
        } finally {
          setIsSending(false);
        }

        return;
      }

      setPendingGroupMessage(trimmedMessage);
      setGroupTitleError(null);
      setIsTitleModalOpen(true);
      return;
    }

    if (!selectedThreadId) {
      setComposerError("Selecciona una conversacion.");
      return;
    }

    if (selectedThreadBlockedReason) {
      setComposerError(selectedThreadBlockedReason);
      return;
    }

    setIsSending(true);

    try {
      const response = await sendChatMessage(selectedThreadId, trimmedMessage);

      setMessagesByChatId((current) => ({
        ...current,
        [selectedThreadId]: mergeAndSortMessages(current[selectedThreadId] ?? [], [response.data.message]),
      }));

      setThreads((current) =>
        current.map((thread) =>
          thread.summary.id === selectedThreadId
            ? {
                ...thread,
                summary: {
                  ...thread.summary,
                  lastMessageAt: response.data.message.createdAt,
                  lastMessagePreview: response.data.message.content,
                },
              }
            : thread
        )
      );

      setDraftMessage("");
      await refreshThreads(selectedThreadId);
    } catch {
      setComposerError("No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  }, [
    draftMessage,
    isComposerOpen,
    isSending,
    loadLatestMessages,
    recipientUserIds,
    refreshThreads,
    selectedThreadBlockedReason,
    selectedThreadId,
  ]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      setIsLoadingThreads(true);
      setGlobalError(null);

      try {
        const identity = await getMyProfileIdentity();

        if (!cancelled) {
          setCurrentUserId(identity);
        }

        const selectedChatId = await refreshThreads(undefined, identity);

        if (!cancelled && selectedChatId) {
          await loadLatestMessages(selectedChatId, true);
        }
      } catch {
        if (!cancelled) {
          setGlobalError("No pudimos cargar tus conversaciones.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingThreads(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [loadLatestMessages, refreshThreads]);

  useEffect(() => {
    if (!selectedThreadId || isComposerOpen) return;

    const intervalId = window.setInterval(() => {
      refreshThreads(selectedThreadId)
        .then((resolvedSelectedId) => {
          const chatIdToLoad = resolvedSelectedId || selectedThreadId;
          return loadLatestMessages(chatIdToLoad, false);
        })
        .catch(() => {
          setGlobalError("No pudimos actualizar las conversaciones.");
        });
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isComposerOpen, loadLatestMessages, refreshThreads, selectedThreadId]);

  useEffect(() => {
    const search = contactSearchText.trim();

    if (!isComposerOpen || !search) {
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingContacts(true);

      try {
        const result = await searchProfiles(search);

        if (!cancelled) {
          setSearchResults(
            result.data
              .filter((item) => item.userId !== currentUserId)
              .map((item) => ({
                userId: item.userId,
                fullName: `${item.firstName} ${item.lastName}`.trim(),
                roleLine: "Resultado de busqueda",
                profileImageUrl: item.profileImageUrl ?? null,
              }))
          );
        }
      } finally {
        if (!cancelled) {
          setIsSearchingContacts(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [contactSearchText, currentUserId, isComposerOpen]);

  useEffect(() => {
    if (isComposerOpen) return;

    requestAnimationFrame(() => {
      const viewport = messageViewportRef.current;
      if (!viewport) return;
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [isComposerOpen, selectedThreadId]);

  return (
    <ModulePage
      title="Mensajes"
      subtitle="Conversaciones privadas para colaboraciones de alto impacto."
      subtitleClassName="mt-1 text-sm text-white"
    >
      <AppCard className="overflow-hidden p-0">
        <div className="grid min-h-[650px] border-[var(--line)] lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="border-r border-[var(--line)] bg-[var(--surface)]">
            <div className="border-b border-[var(--line)] p-4">
              <button
                type="button"
                onClick={() => {
                  setIsComposerOpen(true);
                  setComposerError(null);
                  setDraftMessage("");
                }}
                className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand-500)] px-4 py-2.5 text-sm font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-300)]"
              >
                Nuevo mensaje
              </button>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {isLoadingThreads ? (
                <div className="p-4 text-sm text-[var(--text-secondary)]">Cargando conversaciones...</div>
              ) : null}

              {threads.map((thread) => {
                const initials = getTwoInitials({ fullName: thread.displayName });
                const isActive = !isComposerOpen && selectedThreadId === thread.summary.id;
                const lastPreview = thread.summary.lastMessagePreview || "Sin mensajes por ahora";

                return (
                  <button
                    key={thread.summary.id}
                    type="button"
                    onClick={() => {
                      setIsComposerOpen(false);
                      setSelectedThreadId(thread.summary.id);
                      setComposerError(null);

                      loadLatestMessages(thread.summary.id, true).catch(() => {
                        setComposerError("No se pudo cargar el historial del chat.");
                      });
                    }}
                    className={`w-full border-b border-[var(--line)] px-4 py-3 text-left transition ${
                      isActive
                        ? "bg-[var(--brand-50)]"
                        : "hover:bg-[color-mix(in_srgb,var(--surface-muted)_70%,transparent)]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar
                        imageUrl={thread.profileImageUrl}
                        initials={initials}
                        label={`Foto de perfil de ${thread.displayName}`}
                        className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-900)]"
                        initialsClassName="text-xs font-bold text-[var(--brand-300)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[1rem] font-semibold text-[var(--text-primary)]">
                            {thread.displayName}
                          </p>
                          <span className="text-xs text-[var(--text-soft)]">
                            {humanizeTime(thread.summary.lastMessageAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-[var(--text-secondary)]">{thread.roleLine}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-[var(--text-secondary)]">{lastPreview}</p>
                          {thread.summary.unreadMessagesCount > 0 ? (
                            <span className="rounded-full bg-[var(--brand-500)] px-2 py-0.5 text-[0.68rem] font-bold text-[var(--navy-900)]">
                              {thread.summary.unreadMessagesCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {!isLoadingThreads && threads.length === 0 ? (
                <div className="p-4 text-sm text-[var(--text-secondary)]">
                  Aun no tienes conversaciones.
                </div>
              ) : null}
            </div>
          </aside>

          <section className="flex min-h-[650px] flex-col bg-[var(--surface)]">
            {isComposerOpen ? (
              <>
                <header className="border-b border-[var(--line)] px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nuevo mensaje</h2>
                    <button
                      type="button"
                      onClick={() => {
                        onConfirmChatCreation().catch(() => {
                          setComposerError("No se pudo confirmar la creacion del chat.");
                        });
                      }}
                      disabled={isSending}
                      className="rounded-full bg-[var(--brand-500)] px-3.5 py-2 text-xs font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-300)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSending ? "Confirmando..." : "Confirmar chat/grupo"}
                    </button>
                  </div>
                </header>

                <div className="border-b border-[var(--line)] px-5 py-4">
                  <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]" htmlFor="contact-search">
                    Para
                  </label>
                  <input
                    id="contact-search"
                    value={contactSearchText}
                    onChange={(event) => {
                      const value = event.target.value;
                      setContactSearchText(value);

                      if (!value.trim()) {
                        setSearchResults([]);
                      }
                    }}
                    placeholder="Buscar miembros..."
                    className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-300)_35%,transparent)]"
                  />

                  {recipientContacts.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recipientContacts.map((recipient) => (
                        <button
                          key={recipient.userId}
                          type="button"
                          onClick={() => {
                            setRecipientContacts((current) =>
                              current.filter((item) => item.userId !== recipient.userId)
                            );
                          }}
                          className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand-300)]"
                        >
                          {recipient.fullName} x
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
                    {contactSearchText.trim() ? "Resultados de busqueda" : "Contactos"}
                  </p>

                  {isSearchingContacts ? (
                    <p className="text-sm text-[var(--text-secondary)]">Buscando contactos...</p>
                  ) : null}

                  <div className="space-y-2">
                    {displayedContacts.map((contact) => {
                      const selected = recipientUserIds.includes(contact.userId);
                      const initials = getTwoInitials({ fullName: contact.fullName });

                      return (
                        <div
                          key={contact.userId}
                          className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar
                              imageUrl={contact.profileImageUrl}
                              initials={initials}
                              label={`Foto de perfil de ${contact.fullName}`}
                              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-800)]"
                              initialsClassName="text-xs font-bold text-[var(--brand-300)]"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-lg font-semibold text-[var(--text-primary)]">
                                {contact.fullName}
                              </p>
                              <p className="truncate text-sm text-[var(--text-secondary)]">{contact.roleLine}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setRecipientContacts((current) => {
                                if (current.some((item) => item.userId === contact.userId)) {
                                  return current.filter((item) => item.userId !== contact.userId);
                                }

                                return [...current, contact];
                              });
                            }}
                            className={`h-8 w-8 rounded-full border text-lg font-medium transition ${
                              selected
                                ? "border-[var(--brand-700)] bg-[var(--brand-100)] text-[var(--brand-900)]"
                                : "border-[var(--line)] text-[var(--text-secondary)] hover:border-[var(--brand-300)]"
                            }`}
                            aria-label={selected ? "Quitar contacto" : "Agregar contacto"}
                          >
                            {selected ? "-" : "+"}
                          </button>
                        </div>
                      );
                    })}

                    {!isSearchingContacts && displayedContacts.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">
                        {contactSearchText.trim()
                          ? "No encontramos contactos para esa busqueda."
                          : "No hay contactos disponibles todavia."}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : selectedThread ? (
              <>
                <header className="border-b border-[var(--line)] px-5 py-4">
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">{selectedThread.displayName}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedThread.roleLine}</p>
                </header>

                <div
                  ref={messageViewportRef}
                  onScroll={(event) => {
                    const viewport = event.currentTarget;
                    if (viewport.scrollTop <= 80) {
                      loadOlderMessages(selectedThread.summary.id).catch(() => {
                        setComposerError("No se pudo cargar el historial anterior.");
                      });
                    }
                  }}
                  className="flex-1 overflow-y-auto px-5 py-4"
                >
                  {loadingOlderByChatId[selectedThread.summary.id] ? (
                    <div className="mb-3 text-center text-xs text-[var(--text-soft)]">Cargando mensajes anteriores...</div>
                  ) : null}

                  <div className="space-y-3">
                    {selectedMessages.map((message) => {
                      const isMine = message.senderUserId === currentUserId;
                      const showSenderName = selectedThread.detail.type === "GROUP";
                      const senderName = isMine
                        ? "Tú"
                        : (selectedThreadMemberNamesByUserId.get(message.senderUserId) ?? "Usuario");
                      const messageTime = new Intl.DateTimeFormat("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      }).format(new Date(message.createdAt));

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 sm:max-w-[72%] ${
                              isMine
                                ? "rounded-br-md bg-[var(--navy-900)] text-white"
                                : "rounded-bl-md bg-[var(--surface-2)] text-[var(--text-primary)]"
                            }`}
                          >
                            {showSenderName ? (
                              <p
                                className={`mb-1 text-[0.68rem] font-semibold leading-4 ${
                                  isMine ? "text-white/85" : "text-[var(--text-secondary)]"
                                }`}
                              >
                                {senderName}
                              </p>
                            ) : null}
                            <p>{message.isDeleted ? "Mensaje eliminado" : message.content}</p>
                            <p
                              className={`mt-1 text-[0.65rem] font-medium ${
                                isMine ? "text-white/80" : "text-[var(--text-soft)]"
                              }`}
                            >
                              {messageTime}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {!loadingMessagesByChatId[selectedThread.summary.id] &&
                    selectedMessages.length === 0 ? (
                      <p className="text-sm text-[var(--text-secondary)]">Sin mensajes todavia.</p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center px-5 text-sm text-[var(--text-secondary)]">
                Selecciona una conversacion para empezar.
              </div>
            )}

            <footer className="border-t border-[var(--line)] p-3 sm:p-4">
              {composerError ? (
                <p className="mb-2 text-xs font-medium text-[var(--danger-500)]">{composerError}</p>
              ) : null}

              <div
                className="flex gap-2"
                title={isSelectedThreadComposerBlocked ? selectedThreadBlockedReason ?? undefined : undefined}
              >
                <input
                  disabled={isSelectedThreadComposerBlocked}
                  value={draftMessage}
                  onChange={(event) => setDraftMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onSend();
                    }
                  }}
                  title={isSelectedThreadComposerBlocked ? selectedThreadBlockedReason ?? undefined : undefined}
                  placeholder={selectedThreadBlockedReason ?? "Escribir un mensaje..."}
                  className="w-full rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-300)_35%,transparent)]"
                />
                <button
                  type="button"
                  onClick={() => {
                    onSend().catch(() => {
                      setComposerError("No se pudo completar el envio.");
                    });
                  }}
                  disabled={isSending || isSelectedThreadComposerBlocked}
                  title={isSelectedThreadComposerBlocked ? selectedThreadBlockedReason ?? undefined : undefined}
                  className="rounded-full bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-300)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSending ? "Enviando..." : "Enviar"}
                </button>
              </div>
            </footer>
          </section>
        </div>

        {isTitleModalOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[color-mix(in_srgb,var(--navy-900)_45%,transparent)] px-4">
            <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-xl">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Titulo del grupo</h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Ingresa un titulo para crear el chat grupal.
              </p>

              <input
                value={groupTitle}
                onChange={(event) => {
                  setGroupTitle(event.target.value);
                  if (groupTitleError) {
                    setGroupTitleError(null);
                  }
                }}
                placeholder="Ej: Equipo Fundador"
                className="mt-4 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-300)_35%,transparent)]"
              />

              {groupTitleError ? (
                <p className="mt-2 text-xs font-medium text-[var(--danger-500)]">{groupTitleError}</p>
              ) : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsTitleModalOpen(false);
                    setPendingGroupMessage("");
                    setGroupTitleError(null);
                  }}
                  className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--line-strong)]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pendingGroupMessage.trim()) {
                      runGroupCreationAndSend(groupTitle, pendingGroupMessage).catch(() => {
                        setComposerError("No se pudo crear el grupo.");
                      });
                      return;
                    }

                    runGroupCreationOnly(groupTitle).catch(() => {
                      setComposerError("No se pudo crear el grupo.");
                    });
                  }}
                  disabled={isSending}
                  className="rounded-full bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-[var(--navy-900)] transition hover:bg-[var(--brand-300)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSending ? "Creando..." : "Crear y enviar"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AppCard>

      {globalError ? (
        <AppCard className="p-4">
          <p className="text-sm font-medium text-[var(--danger-500)]">{globalError}</p>
        </AppCard>
      ) : null}
    </ModulePage>
  );
}
