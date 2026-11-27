// Edge runtime SDK init (only used if a route opts into the edge runtime).
import * as Sentry from "@sentry/nextjs";
import { buildSentryOptions } from "@/lib/observability/sentry-options";

const options = buildSentryOptions();

if (options) {
  Sentry.init(options);
}
