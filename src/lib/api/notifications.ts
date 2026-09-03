import { apiRequest, parseDataResponse } from "@/lib/api/client";

export type NotificationLeadKind = "INITIALS" | "SYMBOL";
export type NotificationLeadTone = "NAVY" | "GOLD" | "GREEN" | "RED" | "GRAY" | "TEAL";

export type NotificationSegment = {
  text: string;
  href?: string;
  isBold?: boolean;
};

export type NotificationAction = {
  label: string;
  href: string;
};

export type NotificationSummary = {
  id: string;
  type: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  timeLabelOverride: string | null;
  lead: {
    kind: NotificationLeadKind;
    value: string;
    tone: NotificationLeadTone;
  };
  body: NotificationSegment[];
  action: NotificationAction | null;
};

export type ListNotificationsData = {
  notifications: NotificationSummary[];
  unreadCount: number;
};

export type MarkNotificationAsReadData = {
  notification: NotificationSummary;
};

export type MarkAllNotificationsAsReadData = {
  updatedCount: number;
};

export async function listNotifications(limit = 50, signal?: AbortSignal) {
  const query = new URLSearchParams({ limit: String(limit) });
  const response = await apiRequest(`/notifications?${query.toString()}`, { signal });

  return parseDataResponse<ListNotificationsData>(response, "Invalid notifications response");
}

export async function markNotificationAsRead(notificationId: string, signal?: AbortSignal) {
  const response = await apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    signal,
  });

  return parseDataResponse<MarkNotificationAsReadData>(response, "Invalid mark notification response");
}

export async function markAllNotificationsAsRead(signal?: AbortSignal) {
  const response = await apiRequest("/notifications/read-all", {
    method: "POST",
    signal,
  });

  return parseDataResponse<MarkAllNotificationsAsReadData>(response, "Invalid mark all notifications response");
}
