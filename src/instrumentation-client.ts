// Browser SDK init. Next.js loads this file before the app hydrates.
import * as Sentry from "@sentry/nextjs";
import { buildSentryOptions } from "@/lib/observability/sentry-options";

const options = buildSentryOptions();

if (options) {
  Sentry.init({
    ...options,
    // Page loads, client navigations and fetches, plus Web Vitals (LCP, INP, CLS, FCP, TTFB).
    // No Session Replay and no user feedback widget, on purpose.
    integrations: [Sentry.browserTracingIntegration()],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
