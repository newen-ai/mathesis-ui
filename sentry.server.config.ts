// Node.js runtime SDK init (server components such as /verificar and route handlers).
import * as Sentry from "@sentry/nextjs";
import { buildSentryOptions } from "@/lib/observability/sentry-options";

const options = buildSentryOptions();

if (options) {
  Sentry.init(options);
}
