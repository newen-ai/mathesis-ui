import { apiRequest, getApiBaseUrl, parseDataResponse } from "@/lib/api/client";

export type AteneoTabKey = "mine" | "discover" | "admin";
export type AteneoTone = "LIBRE" | "SERIO" | "RECOMENDADO";
export type AteneoReactionValue = "value";

export type AteneoUserSummary = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  initials: string;
};

export type AteneoGroup = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  createTopicsMode: "free" | "admins";
  commentsMode: "free" | "admins";
  subtitle: string;
  activity: string;
  icon: string;
  isOfficial: boolean;
  isMember: boolean;
  isAdmin: boolean;
  isPinned: boolean;
};

export type AteneoGroupDetail = {
  group: AteneoGroup;
  rules: string[];
};

export type AteneoGroupMember = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  initials: string;
  isAdmin: boolean;
  isPinned: boolean;
  joinedAt: string;
};

export type AteneoTopic = {
  id: string;
  groupId: string;
  groupLabel: string;
  author: AteneoUserSummary;
  timeLabel: string;
  title: string;
  description: string;
  tone: AteneoTone;
  reactions: number;
  comments: number;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
  currentUserReactionValue: AteneoReactionValue | null;
  attachments: AteneoTopicAttachment[];
};

export type AteneoTopicAttachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
};

export type AteneoComment = {
  id: string;
  topicId: string;
  author: AteneoUserSummary;
  content: string;
  isDeletedPlaceholder: boolean;
  timeLabel: string;
  createdAt: string;
  parentCommentId: string | null;
  mentionUserId: string | null;
  reactions: number;
  currentUserReactionValue: AteneoReactionValue | null;
};

export type ListAteneoGroupsData = {
  tab: AteneoTabKey;
  groups: AteneoGroup[];
};

export type CreateAteneoGroupData = {
  group: AteneoGroup;
};

export type UpdateAteneoGroupData = {
  group: AteneoGroup;
};

export type ListAteneoGroupMembersData = {
  members: AteneoGroupMember[];
};

export type ListAteneoFeedData = {
  topics: AteneoTopic[];
};

export type ListAteneoTopicsData = {
  topics: AteneoTopic[];
};

export type GetAteneoTopicData = {
  topic: AteneoTopic;
};

export type AteneoTopicAttachmentDownloadData = {
  blob: Blob;
  fileName: string | null;
};

export function resolveAteneoAttachmentUrl(path: string): string {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return path;
  }

  return new URL(path, apiBaseUrl).toString();
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export type CreateAteneoTopicData = {
  topic: AteneoTopic;
};

export type ListAteneoTopicCommentsData = {
  comments: AteneoComment[];
};

export async function listAteneoGroups(tab: AteneoTabKey, limit = 20, signal?: AbortSignal) {
  const query = new URLSearchParams({ tab, limit: String(limit) });
  const response = await apiRequest(`/ateneo/groups?${query.toString()}`, { signal });
  return parseDataResponse<ListAteneoGroupsData>(response, "Invalid Ateneo groups response");
}

export async function createAteneoGroup(
  payload: {
    name: string;
    description?: string;
    icon: string;
    isOfficial?: boolean;
    rules?: string[];
    createTopicsMode?: "free" | "admins";
    commentsMode?: "free" | "admins";
  },
  signal?: AbortSignal
) {
  const response = await apiRequest("/ateneo/groups", {
    method: "POST",
    body: payload,
    signal
  });

  return parseDataResponse<CreateAteneoGroupData>(response, "Invalid Ateneo group create response");
}

export async function getAteneoGroup(groupId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/ateneo/groups/${encodeURIComponent(groupId)}`, { signal });
  return parseDataResponse<AteneoGroupDetail>(response, "Invalid Ateneo group response");
}

export async function listAteneoGroupMembers(groupId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/ateneo/groups/${encodeURIComponent(groupId)}/members`, { signal });
  return parseDataResponse<ListAteneoGroupMembersData>(response, "Invalid Ateneo group members response");
}

export async function updateAteneoGroup(
  groupId: string,
  payload: {
    name: string;
    description?: string;
    icon: string;
    isOfficial?: boolean;
    rules?: string[];
    createTopicsMode?: "free" | "admins";
    commentsMode?: "free" | "admins";
  },
  signal?: AbortSignal
) {
  const response = await apiRequest(`/ateneo/groups/${encodeURIComponent(groupId)}`, {
    method: "PATCH",
    body: payload,
    signal
  });

  return parseDataResponse<UpdateAteneoGroupData>(response, "Invalid Ateneo group update response");
}

export async function joinAteneoGroup(groupId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/ateneo/groups/${encodeURIComponent(groupId)}/join`, {
    method: "POST",
    signal
  });

  return parseDataResponse<{ group: AteneoGroup }>(response, "Invalid Ateneo group join response");
}

export async function listAteneoFeed(limit = 20, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await apiRequest(`/ateneo/feed?${query.toString()}`, { signal });
  return parseDataResponse<ListAteneoFeedData>(response, "Invalid Ateneo feed response");
}

export async function listAteneoTopics(groupId: string, limit = 20, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await apiRequest(`/ateneo/groups/${encodeURIComponent(groupId)}/topics?${query.toString()}`, { signal });
  return parseDataResponse<ListAteneoTopicsData>(response, "Invalid Ateneo topics response");
}

export async function getAteneoTopic(groupId: string, topicId: string, signal?: AbortSignal) {
  const response = await apiRequest(
    `/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}`,
    { signal }
  );
  return parseDataResponse<GetAteneoTopicData>(response, "Invalid Ateneo topic response");
}

export async function createAteneoTopic(
  groupId: string,
  payload: { title: string; description: string; tone: AteneoTone; attachments?: File[] },
  signal?: AbortSignal
) {
  const formData = new FormData();

  formData.set("title", payload.title);
  formData.set("description", payload.description);
  formData.set("tone", payload.tone);

  payload.attachments?.forEach((file) => {
    formData.append("attachments", file, file.name);
  });

  const response = await apiRequest(`/ateneo/groups/${encodeURIComponent(groupId)}/topics`, {
    method: "POST",
    body: formData,
    signal
  });

  return parseDataResponse<CreateAteneoTopicData>(response, "Invalid Ateneo topic create response");
}

function parseFileNameFromContentDisposition(value: string | null) {
  if (!value) return null;

  const filenameStarMatch = value.match(/filename\*\s*=\s*([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    const rawValue = filenameStarMatch[1].trim().replace(/^"|"$/g, "");
    const encodedPart = rawValue.includes("''") ? rawValue.split("''").slice(1).join("''") : rawValue;

    try {
      return decodeURIComponent(encodedPart);
    } catch {
      return encodedPart;
    }
  }

  const filenameMatch = value.match(/filename\s*=\s*([^;]+)/i);
  if (!filenameMatch?.[1]) {
    return null;
  }

  return filenameMatch[1].trim().replace(/^"|"$/g, "");
}

export async function downloadAteneoTopicAttachment(
  groupId: string,
  topicId: string,
  attachmentId: string,
  signal?: AbortSignal
): Promise<AteneoTopicAttachmentDownloadData> {
  const response = await apiRequest(
    `/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}/attachments/${encodeURIComponent(attachmentId)}`,
    { signal }
  );

  const blob = await response.blob();
  const fileName = parseFileNameFromContentDisposition(response.headers.get("content-disposition"));

  return { blob, fileName };
}

export async function listAteneoTopicComments(groupId: string, topicId: string, signal?: AbortSignal) {
  const response = await apiRequest(
    `/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}/comments`,
    { signal }
  );
  return parseDataResponse<ListAteneoTopicCommentsData>(response, "Invalid Ateneo comments response");
}

export async function createAteneoTopicComment(
  groupId: string,
  topicId: string,
  payload: { content: string; parentCommentId?: string; mentionUserId?: string },
  signal?: AbortSignal
) {
  const response = await apiRequest(
    `/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}/comments`,
    {
      method: "POST",
      body: payload,
      signal
    }
  );

  return parseDataResponse<{ comment: AteneoComment }>(response, "Invalid Ateneo comment create response");
}

export async function toggleAteneoTopicReaction(groupId: string, topicId: string, signal?: AbortSignal) {
  const response = await apiRequest(
    `/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}/reactions`,
    {
      method: "POST",
      body: {
        reactionValue: "value"
      },
      signal
    }
  );

  return parseDataResponse<{ topic: AteneoTopic }>(response, "Invalid Ateneo topic reaction response");
}

export async function toggleAteneoCommentReaction(
  groupId: string,
  topicId: string,
  commentId: string,
  signal?: AbortSignal
) {
  const response = await apiRequest(
    `/ateneo/groups/${encodeURIComponent(groupId)}/topics/${encodeURIComponent(topicId)}/comments/${encodeURIComponent(commentId)}/reactions`,
    {
      method: "POST",
      body: {
        reactionValue: "value"
      },
      signal
    }
  );

  return parseDataResponse<{ comment: AteneoComment }>(response, "Invalid Ateneo comment reaction response");
}
