import type { TFunction } from "i18next";

function resolveDateLocale(language: string) {
  return language.toLowerCase().startsWith("en") ? "en-US" : "es-AR";
}

// "now", "5 min ago", "3 h ago", "2 d ago", then a short date. Copy lives in common.json (relativeTime.*).
export function formatRelativeTime(value: string | null | undefined, t: TFunction, language: string, now = Date.now()): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((now - date.getTime()) / 60_000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return t("relativeTime.now", { ns: "common" });
  if (diffMinutes < 60) return t("relativeTime.minutesAgo", { ns: "common", count: diffMinutes });
  if (diffHours < 24) return t("relativeTime.hoursAgo", { ns: "common", count: diffHours });
  if (diffDays < 7) return t("relativeTime.daysAgo", { ns: "common", count: diffDays });

  return date.toLocaleDateString(resolveDateLocale(language), { day: "2-digit", month: "short" });
}
