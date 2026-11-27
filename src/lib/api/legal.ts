import { apiRequest, parseDataResponse } from "@/lib/api/client";

// Terms and Privacy Policy (backend: legal/README.md). The backend serves the current version of each text and
// records who accepted which version.

export type LegalDocumentSlug = "terms" | "privacy";
export type LegalDocumentType = "TERMS" | "PRIVACY";

export type LegalDocument = {
  type: LegalDocumentType;
  slug: LegalDocumentSlug;
  // Publication date, YYYY-MM-DD.
  version: string;
  title: string;
  markdown: string;
};

export type LegalAcceptanceResult = {
  hasAcceptedCurrentLegalDocuments: boolean;
  pendingLegalDocuments: LegalDocumentType[];
};

export const LEGAL_PAGE_PATHS: Record<LegalDocumentSlug, string> = {
  terms: "/legal/terms",
  privacy: "/legal/privacy",
};

export async function getLegalDocument(slug: LegalDocumentSlug, signal?: AbortSignal) {
  const response = await apiRequest(`/legal/documents/${encodeURIComponent(slug)}`, { signal });
  return parseDataResponse<LegalDocument>(response, "Invalid legal document response");
}

/** Current versions of both texts, or null when they cannot be loaded (register then skips sending them). */
export async function getCurrentLegalVersions(
  signal?: AbortSignal
): Promise<{ termsVersion: string; privacyVersion: string } | null> {
  try {
    const [terms, privacy] = await Promise.all([getLegalDocument("terms", signal), getLegalDocument("privacy", signal)]);
    return { termsVersion: terms.data.version, privacyVersion: privacy.data.version };
  } catch {
    return null;
  }
}

export async function acceptLegalDocuments(versions: { termsVersion: string; privacyVersion: string }) {
  const response = await apiRequest("/legal/acceptances", { method: "POST", body: versions });
  return parseDataResponse<LegalAcceptanceResult>(response, "Invalid legal acceptance response");
}

/** "2026-11-27" -> "27 de noviembre de 2026" (or the English form), without time zone shifts. */
export function formatLegalVersionDate(version: string, language: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(version);
  if (!match) {
    return version;
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat(language.startsWith("en") ? "en-US" : "es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
