import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/i18n", () => ({
  default: {
    t: (key: string, opts?: { defaultValue?: string; [key: string]: unknown }) =>
      opts?.defaultValue ? `${key}|${String(opts.defaultValue)}` : key,
  },
}));

import {
  extractAuthErrorCode,
  getAuthErrorTranslation,
  normalizeAuthErrorCode,
  normalizeMessageKey,
} from "./auth-errors";
import { getAteneoTopicPublishErrorTranslation } from "./ateneo-errors";
import { getBugReportErrorTranslation } from "./bug-report-errors";

describe("auth-errors helpers", () => {
  it("normalizes auth error codes", () => {
    expect(normalizeAuthErrorCode(" email_not_verified ")).toBe("EMAIL_NOT_VERIFIED");
    expect(normalizeAuthErrorCode("")).toBeUndefined();
  });

  it("normalizes message keys", () => {
    expect(normalizeMessageKey("Invalid email or password")).toBe("INVALID_EMAIL_OR_PASSWORD");
    expect(normalizeMessageKey("   ")).toBeUndefined();
  });

  it("extracts auth error code from object and string", () => {
    expect(extractAuthErrorCode({ code: "user_not_whitelisted" })).toBe("USER_NOT_WHITELISTED");
    expect(extractAuthErrorCode("verification_email_rate_limited")).toBe("VERIFICATION_EMAIL_RATE_LIMITED");
  });

  it("maps known auth errors to translation keys", () => {
    const translated = getAuthErrorTranslation("invalid_email_or_password", "fallback");
    expect(translated.startsWith("auth:invalidCredentials")).toBe(true);
  });

  it("falls back to default auth message", () => {
    const translated = getAuthErrorTranslation("some unknown message", "fallback");
    expect(translated.startsWith("auth:default")).toBe(true);
  });
});

describe("ateneo-errors helpers", () => {
  it("maps missing api base url error", () => {
    const error = new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
    const translated = getAteneoTopicPublishErrorTranslation(error);
    expect(translated.startsWith("common:ateneo.errors.missingApiBaseUrl")).toBe(true);
  });

  it("maps validation failed issue", () => {
    const error = new Error("VALIDATION_FAILED") as Error & {
      status: number;
      details: unknown;
    };
    error.status = 400;
    error.details = [{ code: "too_big", path: ["body", "description"], maximum: 500 }];

    const translated = getAteneoTopicPublishErrorTranslation(error);
    expect(translated.startsWith("common:ateneo.errors.descriptionTooLong")).toBe(true);
  });

  it("maps connection errors", () => {
    const translated = getAteneoTopicPublishErrorTranslation(new TypeError("Failed to fetch"));
    expect(translated.startsWith("common:ateneo.errors.connectionFailed")).toBe(true);
  });
});

describe("bug-report-errors helpers", () => {
  it("maps known bug-report message keys", () => {
    const translated = getBugReportErrorTranslation("BUG_REPORT_IMAGE_IS_TOO_LARGE", "fallback");
    expect(translated.startsWith("common:bugReport.errors.imageTooLarge")).toBe(true);
  });

  it("falls back to default bug-report message", () => {
    const translated = getBugReportErrorTranslation("unknown issue", "fallback");
    expect(translated.startsWith("common:bugReport.errors.default")).toBe(true);
  });
});
