import { apiRequest, parseDataResponse } from "@/lib/api/client";

export type ContentReportTargetType = "PROFILE" | "FEED_POST" | "ATENEO_TOPIC" | "ATENEO_COMMENT";
export type ContentReportReason = "SPAM" | "HARASSMENT" | "INAPPROPRIATE" | "IMPERSONATION" | "OTHER";

export const CONTENT_REPORT_REASONS: ContentReportReason[] = ["SPAM", "HARASSMENT", "INAPPROPRIATE", "IMPERSONATION", "OTHER"];
export const CONTENT_REPORT_DETAILS_MAX_LENGTH = 1000;

export type CreateContentReportInput = {
  targetType: ContentReportTargetType;
  targetId: string;
  reason: ContentReportReason;
  details?: string;
};

export type CreateContentReportData = {
  report: {
    id: string;
    targetType: ContentReportTargetType;
    targetId: string;
    reason: ContentReportReason;
    status: "PENDING" | "REVIEWED" | "DISMISSED";
    createdAt: string;
  };
  // True when the user already had a pending report on this target; the backend does not create another one.
  alreadyReported: boolean;
};

export async function createContentReport(input: CreateContentReportInput, signal?: AbortSignal) {
  const details = input.details?.trim();
  const response = await apiRequest("/reports", {
    method: "POST",
    body: {
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      ...(details ? { details } : {})
    },
    signal
  });

  return parseDataResponse<CreateContentReportData>(response, "Invalid content report response");
}
