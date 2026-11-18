import { scrubBreadcrumb, scrubEvent, scrubSpan } from "./scrub";

export type PublicSentryEnv = {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: string;
  apiBaseUrl?: string;
};

// NEXT_PUBLIC_* values must be read with static property access so Next.js inlines them in the
// browser bundle; that is why they are collected here instead of reading process.env dynamically.
export function readPublicSentryEnv(): PublicSentryEnv {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  };
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveTracesSampleRate(raw: string | undefined, environment: string): number {
  const fallback = environment === "production" ? 0.1 : 1;
  const value = blankToUndefined(raw);
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE must be a number between 0 and 1 (got "${value}")`);
  }
  return parsed;
}

// Origin of the backend API, so browser fetches to it carry sentry-trace/baggage and the UI trace
// continues into the backend trace. Requests to any other host get no tracing headers.
export function resolveTracePropagationTargets(apiBaseUrl: string | undefined): Array<string | RegExp> {
  const value = blankToUndefined(apiBaseUrl);
  if (!value) {
    return [];
  }

  try {
    const origin = new URL(value).origin;
    return [new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`)];
  } catch {
    return [];
  }
}

// Options shared by the browser, Node.js and Edge SDK inits. Returns null when Sentry must stay off
// (no DSN: local development). Deployed builds cannot get here without a DSN (see build-env.ts).
export function buildSentryOptions(env: PublicSentryEnv = readPublicSentryEnv()) {
  const dsn = blankToUndefined(env.dsn);
  if (!dsn) {
    return null;
  }

  const environment = blankToUndefined(env.environment) ?? "local";

  return {
    dsn,
    environment,
    tracesSampleRate: resolveTracesSampleRate(env.tracesSampleRate, environment),
    tracePropagationTargets: resolveTracePropagationTargets(env.apiBaseUrl),
    // Privacy. SDK v11 replaced `sendDefaultPii` with `dataCollection`, whose defaults collect headers,
    // cookies, query params and bodies. This is the strict equivalent of `sendDefaultPii: false`.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { allow: ["user-agent", "content-type", "content-length"] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
    },
    beforeSend: <T extends Parameters<typeof scrubEvent>[0]>(event: T) => scrubEvent(event),
    beforeSendSpan: <T extends Parameters<typeof scrubSpan>[0]>(span: T) => scrubSpan(span),
    beforeBreadcrumb: <T extends Parameters<typeof scrubBreadcrumb>[0]>(breadcrumb: T) => scrubBreadcrumb(breadcrumb),
  };
}
