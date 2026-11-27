import { apiRequest, parseDataResponse } from "@/lib/api/client";

export type BlockedUserSummary = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  blockedAt: string;
  reasonNote: string | null;
};

export type ListMyBlockedUsersData = {
  blockedUsers: BlockedUserSummary[];
};

export type BlockUserData = {
  targetUserId: string;
  blockedAt: string;
  alreadyBlocked: boolean;
};

export type UnblockUserData = {
  targetUserId: string;
  unblockedAt: string;
};

export async function listMyBlockedUsers(signal?: AbortSignal) {
  const response = await apiRequest("/blocks/me", { signal });
  return parseDataResponse<ListMyBlockedUsersData>(response, "Invalid blocked users response");
}

export async function blockUser(targetUserId: string, reasonNote?: string, signal?: AbortSignal) {
  const response = await apiRequest(`/blocks/${encodeURIComponent(targetUserId)}`, {
    method: "POST",
    body: {
      ...(reasonNote ? { reasonNote } : {})
    },
    signal
  });

  return parseDataResponse<BlockUserData>(response, "Invalid block user response");
}

export async function unblockUser(targetUserId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/blocks/${encodeURIComponent(targetUserId)}`, {
    method: "DELETE",
    signal
  });

  return parseDataResponse<UnblockUserData>(response, "Invalid unblock user response");
}
