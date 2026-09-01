import { NextResponse } from "next/server";

type LinkPreviewData = {
  url: string;
  hostname: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  faviconUrl: string | null;
};

const REQUEST_TIMEOUT_MS = 7000;
const MAX_HTML_LENGTH = 250_000;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const VIMEO_HOSTS = new Set(["vimeo.com", "www.vimeo.com", "player.vimeo.com"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com"]);
const X_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeText(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = decodeHtmlEntities(value).replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(html: string, key: string, attr: "name" | "property" | "itemprop") {
  const escapedKey = escapeRegex(key);
  const regex = new RegExp(
    `<meta\\s+[^>]*${attr}=["']${escapedKey}["'][^>]*content=["']([^"']+)["'][^>]*>|<meta\\s+[^>]*content=["']([^"']+)["'][^>]*${attr}=["']${escapedKey}["'][^>]*>`,
    "i"
  );

  const match = html.match(regex);
  return normalizeText(match?.[1] ?? match?.[2] ?? null);
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return normalizeText(titleMatch?.[1] ?? null);
}

function isPrivateIp(hostname: string) {
  const ipv4 = hostname.match(/^(\d{1,3})(?:\.(\d{1,3})){3}$/);
  if (!ipv4) {
    return false;
  }

  const octets = hostname.split(".").map((part) => Number(part));
  if (octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return true;
  }

  if (octets[0] === 10 || octets[0] === 127) {
    return true;
  }

  if (octets[0] === 169 && octets[1] === 254) {
    return true;
  }

  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
    return true;
  }

  if (octets[0] === 192 && octets[1] === 168) {
    return true;
  }

  return false;
}

function isBlockedHostname(hostname: string) {
  const lowered = hostname.toLowerCase();

  if (
    lowered === "localhost" ||
    lowered.endsWith(".localhost") ||
    lowered === "0.0.0.0" ||
    lowered === "::1" ||
    lowered.endsWith(".local")
  ) {
    return true;
  }

  return isPrivateIp(lowered);
}

function resolveMaybeRelativeUrl(source: string | null, baseUrl: string): string | null {
  if (!source) {
    return null;
  }

  try {
    const resolved = new URL(source, baseUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }

    return resolved.toString();
  } catch {
    return null;
  }
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": "MathesisLinkPreviewBot/1.0 (+https://mathesis.app)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function extractYouTubeVideoId(targetUrl: URL): string | null {
  const hostname = targetUrl.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname)) {
    return null;
  }

  if (hostname.endsWith("youtu.be")) {
    const id = targetUrl.pathname.split("/").filter(Boolean)[0] ?? "";
    return id.trim() || null;
  }

  const pathSegments = targetUrl.pathname.split("/").filter(Boolean);
  if (pathSegments[0] === "watch") {
    const id = targetUrl.searchParams.get("v")?.trim() ?? "";
    return id || null;
  }

  if (pathSegments[0] === "shorts" || pathSegments[0] === "embed") {
    const id = pathSegments[1]?.trim() ?? "";
    return id || null;
  }

  return null;
}

async function resolveYouTubePreview(targetUrl: URL): Promise<LinkPreviewData | null> {
  const videoId = extractYouTubeVideoId(targetUrl);
  if (!videoId) {
    return null;
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
  const fallbackImage = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  const fallbackPayload: LinkPreviewData = {
    url: canonicalUrl,
    hostname: "www.youtube.com",
    title: "YouTube",
    description: "www.youtube.com",
    imageUrl: fallbackImage,
    faviconUrl: "https://www.youtube.com/favicon.ico",
  };

  const payload = await fetchJsonWithTimeout<{
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  }>(`https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`);

  if (!payload) {
    return fallbackPayload;
  }

  const resolvedImage = resolveMaybeRelativeUrl(normalizeText(payload.thumbnail_url ?? null), canonicalUrl);

  return {
    ...fallbackPayload,
    title: normalizeText(payload.title ?? null) ?? fallbackPayload.title,
    description: normalizeText(payload.author_name ?? null) ?? fallbackPayload.description,
    imageUrl: resolvedImage ?? fallbackImage,
  };
}

async function resolveVimeoPreview(targetUrl: URL): Promise<LinkPreviewData | null> {
  if (!VIMEO_HOSTS.has(targetUrl.hostname.toLowerCase())) {
    return null;
  }

  const canonicalUrl = targetUrl.toString();
  const payload = await fetchJsonWithTimeout<{
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  }>(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(canonicalUrl)}`);

  if (!payload) {
    return {
      url: canonicalUrl,
      hostname: targetUrl.hostname,
      title: targetUrl.hostname,
      description: null,
      imageUrl: null,
      faviconUrl: "https://vimeo.com/favicon.ico",
    };
  }

  return {
    url: canonicalUrl,
    hostname: targetUrl.hostname,
    title: normalizeText(payload.title ?? null) ?? targetUrl.hostname,
    description: normalizeText(payload.author_name ?? null),
    imageUrl: resolveMaybeRelativeUrl(normalizeText(payload.thumbnail_url ?? null), canonicalUrl),
    faviconUrl: "https://vimeo.com/favicon.ico",
  };
}

async function resolveTikTokPreview(targetUrl: URL): Promise<LinkPreviewData | null> {
  if (!TIKTOK_HOSTS.has(targetUrl.hostname.toLowerCase())) {
    return null;
  }

  const canonicalUrl = targetUrl.toString();
  const payload = await fetchJsonWithTimeout<{
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  }>(`https://www.tiktok.com/oembed?url=${encodeURIComponent(canonicalUrl)}`);

  if (!payload) {
    return {
      url: canonicalUrl,
      hostname: targetUrl.hostname,
      title: targetUrl.hostname,
      description: null,
      imageUrl: null,
      faviconUrl: "https://www.tiktok.com/favicon.ico",
    };
  }

  return {
    url: canonicalUrl,
    hostname: targetUrl.hostname,
    title: normalizeText(payload.title ?? null) ?? targetUrl.hostname,
    description: normalizeText(payload.author_name ?? null),
    imageUrl: resolveMaybeRelativeUrl(normalizeText(payload.thumbnail_url ?? null), canonicalUrl),
    faviconUrl: "https://www.tiktok.com/favicon.ico",
  };
}

function extractXStatusId(targetUrl: URL): string | null {
  const hostname = targetUrl.hostname.toLowerCase();
  if (!X_HOSTS.has(hostname)) {
    return null;
  }

  const segments = targetUrl.pathname.split("/").filter(Boolean);
  const statusIndex = segments.findIndex((segment) => segment === "status");
  if (statusIndex < 0) {
    return null;
  }

  const id = segments[statusIndex + 1] ?? "";
  return /^\d+$/.test(id) ? id : null;
}

async function resolveXPreview(targetUrl: URL): Promise<LinkPreviewData | null> {
  const statusId = extractXStatusId(targetUrl);
  if (!statusId) {
    return null;
  }

  const canonicalUrl = targetUrl.toString();
  const fallback: LinkPreviewData = {
    url: canonicalUrl,
    hostname: targetUrl.hostname,
    title: "X",
    description: targetUrl.hostname,
    imageUrl: null,
    faviconUrl: "https://x.com/favicon.ico",
  };

  const payload = await fetchJsonWithTimeout<{
    user?: { name?: string };
    text?: string;
    photos?: Array<{ url?: string }>;
    video?: { poster?: string };
  }>(`https://cdn.syndication.twimg.com/tweet-result?id=${encodeURIComponent(statusId)}&lang=en`);

  if (!payload) {
    return fallback;
  }

  const authorName = normalizeText(payload.user?.name ?? null);
  const description = normalizeText(payload.text ?? null);
  const imageUrl =
    resolveMaybeRelativeUrl(normalizeText(payload.photos?.[0]?.url ?? null), canonicalUrl) ??
    resolveMaybeRelativeUrl(normalizeText(payload.video?.poster ?? null), canonicalUrl);

  return {
    ...fallback,
    title: authorName ? `${authorName} en X` : fallback.title,
    description,
    imageUrl,
  };
}

function buildPreviewPayload(targetUrl: URL, finalUrl: string, html: string): LinkPreviewData {
  const title =
    extractMetaContent(html, "og:title", "property") ??
    extractMetaContent(html, "twitter:title", "name") ??
    extractTitle(html) ??
    targetUrl.hostname;

  const description =
    extractMetaContent(html, "og:description", "property") ??
    extractMetaContent(html, "twitter:description", "name") ??
    extractMetaContent(html, "description", "name");

  const imageUrl = resolveMaybeRelativeUrl(
    extractMetaContent(html, "og:image", "property") ??
      extractMetaContent(html, "twitter:image", "name") ??
      extractMetaContent(html, "image", "itemprop"),
    finalUrl
  );

  return {
    url: finalUrl,
    hostname: new URL(finalUrl).hostname,
    title,
    description,
    imageUrl,
    faviconUrl: resolveMaybeRelativeUrl("/favicon.ico", finalUrl),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url")?.trim();

  if (!rawUrl) {
    return NextResponse.json({ message: "Missing url" }, { status: 400 });
  }

  let targetUrl: URL;

  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ message: "Invalid url" }, { status: 400 });
  }

  if (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") {
    return NextResponse.json({ message: "Only http/https urls are supported" }, { status: 400 });
  }

  if (isBlockedHostname(targetUrl.hostname)) {
    return NextResponse.json({ message: "Blocked host" }, { status: 400 });
  }

  const providerPreview =
    (await resolveYouTubePreview(targetUrl)) ??
    (await resolveVimeoPreview(targetUrl)) ??
    (await resolveTikTokPreview(targetUrl)) ??
    (await resolveXPreview(targetUrl));

  if (providerPreview) {
    return NextResponse.json(
      { data: providerPreview },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  }

  let response: Response;

  try {
    response = await fetch(targetUrl.toString(), {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        "User-Agent": "MathesisLinkPreviewBot/1.0 (+https://mathesis.app)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: "Unable to fetch url" }, { status: 502 });
  }

  const finalUrl = response.url || targetUrl.toString();
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (!response.ok) {
    return NextResponse.json({ message: "Preview unavailable" }, { status: 502 });
  }

  if (!contentType.includes("text/html")) {
    const payload: LinkPreviewData = {
      url: finalUrl,
      hostname: new URL(finalUrl).hostname,
      title: new URL(finalUrl).hostname,
      description: null,
      imageUrl: null,
      faviconUrl: resolveMaybeRelativeUrl("/favicon.ico", finalUrl),
    };

    return NextResponse.json(
      { data: payload },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=600",
        },
      }
    );
  }

  let html: string;

  try {
    html = (await response.text()).slice(0, MAX_HTML_LENGTH);
  } catch {
    return NextResponse.json({ message: "Unable to parse response" }, { status: 502 });
  }

  const data = buildPreviewPayload(targetUrl, finalUrl, html);

  return NextResponse.json(
    { data },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=600",
      },
    }
  );
}
