import { apiRequest, parseDataResponse } from "@/lib/api/client";

export type ChatType = "DIRECT" | "GROUP";
export type ChatMemberRole = "ADMIN" | "MEMBER";

export type ChatUserSummary = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl?: string | null;
  currentJobTitle: string | null;
  currentCompany: string | null;
};

export type ChatMemberSummary = {
  user: ChatUserSummary;
  role: ChatMemberRole;
  joinedAt: string;
};

export type ChatMessageSummary = {
  id: string;
  chatId: string;
  senderUserId: string;
  sender: ChatUserSummary;
  content: string | null;
  isDeleted: boolean;
  editedAt: string | null;
  createdAt: string;
};

export type ChatSummary = {
  id: string;
  type: ChatType;
  title: string | null;
  isAdmin: boolean;
  membersCount: number;
  unreadMessagesCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
};

export type ChatDetail = {
  id: string;
  type: ChatType;
  title: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
  isBlockedByCurrentUser: boolean;
  isBlockedByOtherUser: boolean;
  members: ChatMemberSummary[];
};

export type ListMyChatsData = {
  chats: ChatSummary[];
};

export type CreateDirectChatData = {
  chat: ChatDetail;
  alreadyExisted: boolean;
};

export type CreateGroupChatData = {
  chat: ChatDetail;
};

export type ReadMessagesData = {
  messages: ChatMessageSummary[];
  nextCursor: string | null;
};

export type SendMessageData = {
  message: ChatMessageSummary;
};

export type MarkChatAsReadData = {
  chatId: string;
  lastReadMessageAt: string | null;
  unreadMessagesCount: number;
};

export async function listMyChats(limit = 30, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await apiRequest(`/chats?${query.toString()}`, { signal });

  return parseDataResponse<ListMyChatsData>(
    response,
    "Invalid list chats response"
  );
}

export async function getChatById(chatId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/chats/${encodeURIComponent(chatId)}`, {
    signal,
  });

  return parseDataResponse<ChatDetail>(
    response,
    "Invalid chat detail response"
  );
}

export async function createDirectChat(targetUserId: string, signal?: AbortSignal) {
  const response = await apiRequest("/chats/direct", {
    method: "POST",
    body: {
      targetUserId,
    },
    signal,
  });

  return parseDataResponse<CreateDirectChatData>(
    response,
    "Invalid create direct chat response"
  );
}

export async function createGroupChat(
  title: string,
  userIds: string[],
  signal?: AbortSignal
) {
  const response = await apiRequest("/chats/groups", {
    method: "POST",
    body: {
      title,
      userIds,
    },
    signal,
  });

  return parseDataResponse<CreateGroupChatData>(
    response,
    "Invalid create group chat response"
  );
}

export async function readChatMessages(
  chatId: string,
  options: { limit?: number; cursor?: string; signal?: AbortSignal } = {}
) {
  const query = new URLSearchParams();

  if (options.limit !== undefined) {
    query.set("limit", String(options.limit));
  }

  if (options.cursor) {
    query.set("cursor", options.cursor);
  }

  const response = await apiRequest(
    `/chats/${encodeURIComponent(chatId)}/messages?${query.toString()}`,
    {
      signal: options.signal,
    }
  );

  return parseDataResponse<ReadMessagesData>(
    response,
    "Invalid read messages response"
  );
}

export async function sendChatMessage(
  chatId: string,
  content: string,
  signal?: AbortSignal
) {
  const response = await apiRequest(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: "POST",
    body: {
      content,
    },
    signal,
  });

  return parseDataResponse<SendMessageData>(
    response,
    "Invalid send message response"
  );
}

export async function markChatAsRead(chatId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/chats/${encodeURIComponent(chatId)}/read`, {
    method: "POST",
    signal,
  });

  return parseDataResponse<MarkChatAsReadData>(
    response,
    "Invalid mark as read response"
  );
}
