// Strips sensitive data before anything is sent to Sentry. Same rules as the backend
// (mathesis-backend/src/common/observability/scrub.ts): no emails, no credential/reset tokens,
// no auth headers or cookies, no request bodies (post/comment content) and no user identity.

const FILTERED = "[Filtered]";

const SENSITIVE_KEY_PARTS = ["token", "password", "secret", "email", "code", "key", "auth", "cookie", "session", "bypass"];
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

const DROPPED_ATTRIBUTE_PREFIXES = [
  "user.",
  "client.address",
  "http.client_ip",
  "http.request.header.",
  "http.response.header.",
  "http.request.body",
  "url.query",
];

const URL_ATTRIBUTE_KEYS = new Set(["url.full", "http.url", "http.target", "url.path", "http.route", "url.template", "url"]);

export function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => normalized.includes(part));
}

export function scrubText(value: string): string {
  return value.replace(JWT_PATTERN, FILTERED).replace(EMAIL_PATTERN, FILTERED);
}

export function scrubQueryString(query: string): string {
  const hasLeadingQuestionMark = query.startsWith("?");
  const raw = hasLeadingQuestionMark ? query.slice(1) : query;
  if (raw.length === 0) {
    return query;
  }

  const scrubbed = raw
    .split("&")
    .map((pair) => {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex === -1) {
        return pair;
      }

      const key = pair.slice(0, separatorIndex);
      let decodedKey = key;
      try {
        decodedKey = decodeURIComponent(key);
      } catch {
        // Keep the raw key when it is not valid percent-encoding.
      }

      return isSensitiveKey(decodedKey) ? `${key}=${FILTERED}` : scrubText(pair);
    })
    .join("&");

  return hasLeadingQuestionMark ? `?${scrubbed}` : scrubbed;
}

export function scrubUrl(value: string): string {
  const queryIndex = value.indexOf("?");
  if (queryIndex === -1) {
    return scrubText(value);
  }

  const base = value.slice(0, queryIndex);
  const rest = value.slice(queryIndex);
  const hashIndex = rest.indexOf("#");
  const query = hashIndex === -1 ? rest : rest.slice(0, hashIndex);
  const hash = hashIndex === -1 ? "" : `#${FILTERED}`;

  return `${scrubText(base)}${scrubQueryString(query)}${hash}`;
}

function scrubAttributeValue(key: string, value: unknown): unknown {
  if (typeof value === "string") {
    return URL_ATTRIBUTE_KEYS.has(key) ? scrubUrl(value) : scrubText(value);
  }

  if (value && typeof value === "object" && !Array.isArray(value) && "value" in value) {
    const attribute = value as { value: unknown };
    return { ...attribute, value: scrubAttributeValue(key, attribute.value) };
  }

  return value;
}

export function scrubAttributes<T extends Record<string, unknown>>(attributes: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(attributes)) {
    if (DROPPED_ATTRIBUTE_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix))) {
      continue;
    }
    result[key] = scrubAttributeValue(key, value);
  }

  return result as T;
}

export function scrubSpan<T extends { name: string; attributes?: Record<string, unknown> }>(span: T): T {
  return {
    ...span,
    name: scrubUrl(span.name),
    ...(span.attributes ? { attributes: scrubAttributes(span.attributes) } : {}),
  };
}

type ScrubbableBreadcrumb = { message?: string; data?: Record<string, unknown> };

type ScrubbableEvent = {
  message?: string;
  transaction?: string;
  user?: unknown;
  request?: {
    url?: string;
    query_string?: unknown;
    data?: unknown;
    cookies?: unknown;
    headers?: Record<string, string>;
    env?: unknown;
  };
  exception?: { values?: Array<{ value?: string }> };
  breadcrumbs?: ScrubbableBreadcrumb[];
  contexts?: Record<string, unknown> & { trace?: { data?: Record<string, unknown> } };
};

const ALLOWED_REQUEST_HEADERS = new Set(["user-agent", "content-type", "content-length", "accept", "host", "referer"]);

export function scrubBreadcrumb<T extends ScrubbableBreadcrumb>(breadcrumb: T): T {
  const next: T = { ...breadcrumb };
  if (typeof next.message === "string") {
    next.message = scrubText(next.message);
  }
  if (next.data) {
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(next.data)) {
      data[key] = typeof value === "string" ? (["url", "from", "to"].includes(key) ? scrubUrl(value) : scrubText(value)) : value;
    }
    next.data = data;
  }
  return next;
}

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  const next: T = { ...event };
  delete next.user;

  if (typeof next.message === "string") {
    next.message = scrubText(next.message);
  }
  if (typeof next.transaction === "string") {
    next.transaction = scrubUrl(next.transaction);
  }

  if (next.request) {
    const request = { ...next.request };
    delete request.data;
    delete request.cookies;
    delete request.env;
    if (typeof request.url === "string") {
      request.url = scrubUrl(request.url);
    }
    if (typeof request.query_string === "string") {
      request.query_string = scrubQueryString(request.query_string);
    } else if (request.query_string !== undefined) {
      delete request.query_string;
    }
    if (request.headers) {
      const headers: Record<string, string> = {};
      for (const [name, value] of Object.entries(request.headers)) {
        if (ALLOWED_REQUEST_HEADERS.has(name.toLowerCase())) {
          headers[name] = name.toLowerCase() === "referer" ? scrubUrl(value) : value;
        }
      }
      request.headers = headers;
    }
    next.request = request;
  }

  if (next.exception?.values) {
    next.exception = {
      ...next.exception,
      values: next.exception.values.map((value) =>
        typeof value.value === "string" ? { ...value, value: scrubText(value.value) } : value
      ),
    };
  }

  if (next.breadcrumbs) {
    next.breadcrumbs = next.breadcrumbs.map(scrubBreadcrumb);
  }

  if (next.contexts?.trace?.data) {
    next.contexts = {
      ...next.contexts,
      trace: { ...next.contexts.trace, data: scrubAttributes(next.contexts.trace.data) },
    };
  }

  return next;
}
