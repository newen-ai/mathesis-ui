"use client";

import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { AteneoGroup } from "@/lib/api/ateneo";
import { formatRelativeTime } from "@/lib/utils/relative-time";

// Localized "N members · Active today". Falls back to the backend's Spanish labels when talking to an
// older backend that does not send memberCount / activityStatus yet.
export function useGroupMetaLabel() {
  const { t } = useTranslation("ateneo");

  return useCallback(
    (group: Pick<AteneoGroup, "subtitle" | "activity" | "memberCount" | "activityStatus">) => {
      const members = typeof group.memberCount === "number" ? t("groupMeta.members", { count: group.memberCount }) : group.subtitle;
      const activity = group.activityStatus ? t(`groupMeta.activity.${group.activityStatus}`) : group.activity;
      return { members, activity };
    },
    [t]
  );
}

export function AteneoGroupMeta({ group }: { group: Pick<AteneoGroup, "subtitle" | "activity" | "memberCount" | "activityStatus"> }) {
  const { members, activity } = useGroupMetaLabel()(group);

  return (
    <>
      {members} <span className="mx-1">·</span> {activity}
    </>
  );
}

// Relative time from the ISO date, in the user's language. `fallback` is the backend's Spanish label.
export function AteneoRelativeTime({ value, fallback = "" }: { value?: string | null; fallback?: string }) {
  const { t, i18n } = useTranslation("ateneo");
  const label = value ? formatRelativeTime(value, t, i18n.language) : "";

  return <>{label || fallback}</>;
}
