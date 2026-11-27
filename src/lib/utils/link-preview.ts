const URL_CANDIDATE_REGEX = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

const TRAILING_PUNCTUATION = /[.,!?;:)}\]]+$/;

export type LinkifiedSegment =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "link";
      value: string;
      href: string;
    };

export type LinkPreviewData = {
  url: string;
  hostname: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
};

function trimTrailingPunctuation(value: string) {
  return value.replace(TRAILING_PUNCTUATION, "");
}

export function normalizeUrlCandidate(value: string): string | null {
  const trimmed = trimTrailingPunctuation(value.trim());
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function extractUniqueUrlsFromText(text: string, limit = 4): string[] {
  if (!text.trim()) {
    return [];
  }

  const urls: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(URL_CANDIDATE_REGEX)) {
    const raw = match[0] ?? "";
    const normalized = normalizeUrlCandidate(raw);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    urls.push(normalized);

    if (urls.length >= limit) {
      break;
    }
  }

  return urls;
}

export function buildLinkifiedSegments(text: string): LinkifiedSegment[] {
  if (!text) {
    return [{ type: "text", value: "" }];
  }

  const segments: LinkifiedSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(URL_CANDIDATE_REGEX)) {
    const value = match[0] ?? "";
    const index = match.index ?? -1;

    if (index < 0) {
      continue;
    }

    const normalized = normalizeUrlCandidate(value);
    const cleanedValue = trimTrailingPunctuation(value);
    const suffix = value.slice(cleanedValue.length);

    if (index > cursor) {
      segments.push({ type: "text", value: text.slice(cursor, index) });
    }

    if (normalized && cleanedValue.length > 0) {
      segments.push({ type: "link", value: cleanedValue, href: normalized });
    } else {
      segments.push({ type: "text", value });
    }

    if (suffix) {
      segments.push({ type: "text", value: suffix });
    }

    cursor = index + value.length;
  }

  if (cursor < text.length) {
    segments.push({ type: "text", value: text.slice(cursor) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

export async function fetchLinkPreview(url: string, signal?: AbortSignal): Promise<LinkPreviewData | null> {
  try {
    const query = new URLSearchParams({ url, v: "2" });
    const response = await fetch(`/api/link-preview?${query.toString()}`, { signal, cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { data?: LinkPreviewData };
    if (!payload?.data || typeof payload.data.url !== "string") {
      return null;
    }

    return payload.data;
  } catch {
    return null;
  }
}
