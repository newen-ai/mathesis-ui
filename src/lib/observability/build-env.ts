// Fail-fast check for deployed builds, called from next.config.ts. On Vercel (VERCEL=1) every
// variable Sentry needs must be set; local and CI builds (no VERCEL) run without Sentry.
const REQUIRED_ON_VERCEL = [
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_ENVIRONMENT",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
] as const;

export function assertObservabilityBuildEnv(env: Record<string, string | undefined>): void {
  if (env.VERCEL !== "1") {
    return;
  }

  const missing = REQUIRED_ON_VERCEL.filter((key) => !env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `[observability] Missing environment variables for this Vercel build: ${missing.join(", ")}. ` +
        "Set them in Vercel > Project > Settings > Environment Variables (see sophium-backend/docs/PERFORMANCE.md)."
    );
  }
}
