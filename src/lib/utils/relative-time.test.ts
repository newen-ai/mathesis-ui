import i18next from "@/lib/i18n";
import { afterAll, describe, expect, it } from "vitest";
import { formatRelativeTime } from "./relative-time";

const NOW = new Date("2026-11-16T12:00:00Z").getTime();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const MIN = 60_000;

describe("formatRelativeTime", () => {
  afterAll(async () => {
    await i18next.changeLanguage("es");
  });

  it("formats minutes, hours and days in Spanish", async () => {
    await i18next.changeLanguage("es");
    const t = i18next.t.bind(i18next);
    expect(formatRelativeTime(ago(10 * 1000), t, "es", NOW)).toBe("ahora");
    expect(formatRelativeTime(ago(5 * MIN), t, "es", NOW)).toBe("hace 5 min");
    expect(formatRelativeTime(ago(3 * 60 * MIN), t, "es", NOW)).toBe("hace 3 h");
    expect(formatRelativeTime(ago(2 * 24 * 60 * MIN), t, "es", NOW)).toBe("hace 2 d");
  });

  it("formats in English and falls back to a short date after a week", async () => {
    await i18next.changeLanguage("en");
    const t = i18next.t.bind(i18next);
    expect(formatRelativeTime(ago(5 * MIN), t, "en", NOW)).toBe("5 min ago");
    expect(formatRelativeTime(ago(30 * 24 * 60 * MIN), t, "en", NOW)).toMatch(/Oct/);
    expect(formatRelativeTime(null, t, "en", NOW)).toBe("");
    expect(formatRelativeTime("not a date", t, "en", NOW)).toBe("");
  });
});
