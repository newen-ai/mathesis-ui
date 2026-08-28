import i18next from "@/lib/i18n";

export type SupportedLocale = "es";

export type AuthErrorDetails = {
  code?: string;
  reason?: string;
  [key: string]: unknown;
};

export const authErrorCodeToKey: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "auth:emailNotVerified",
  USER_NOT_WHITELISTED: "auth:userNotWhitelisted",
  INVALID_EMAIL_OR_PASSWORD: "auth:invalidCredentials",
};

export function normalizeAuthErrorCode(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized.toUpperCase() : undefined;
}

export function normalizeMessageKey(value?: string): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function extractAuthErrorCode(details?: unknown): string | undefined {
  if (!details) {
    return undefined;
  }

  if (typeof details === "string") {
    return normalizeAuthErrorCode(details);
  }

  if (typeof details === "object") {
    const maybeCode = (details as { code?: unknown }).code;
    if (typeof maybeCode === "string") {
      return normalizeAuthErrorCode(maybeCode);
    }
  }

  return undefined;
}

export function getAuthErrorTranslation(
  codeOrMessage?: string | unknown,
  fallback = "No pudimos iniciar sesión."
): string {
  const code =
    typeof codeOrMessage === "string"
      ? normalizeAuthErrorCode(codeOrMessage)
      : extractAuthErrorCode(codeOrMessage);

  if (code && authErrorCodeToKey[code]) {
    return i18next.t(authErrorCodeToKey[code], { defaultValue: fallback });
  }

  if (typeof codeOrMessage === "string") {
    const aliasKey = normalizeMessageKey(codeOrMessage);
    const mappedCode = aliasKey
      ? {
          EMAIL_ADDRESS_IS_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
          EMAIL_IS_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
          ACCOUNT_PENDING_WHITELIST_APPROVAL: "USER_NOT_WHITELISTED",
          INVALID_EMAIL_OR_PASSWORD: "INVALID_EMAIL_OR_PASSWORD",
        }[aliasKey]
      : undefined;

    if (mappedCode && authErrorCodeToKey[mappedCode]) {
      return i18next.t(authErrorCodeToKey[mappedCode], { defaultValue: fallback });
    }
  }

  return i18next.t("auth:default", { defaultValue: fallback });
}

export default i18next;
