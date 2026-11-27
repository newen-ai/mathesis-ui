import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { HOME_PATH } from "./src/lib/routes";
import { assertObservabilityBuildEnv } from "./src/lib/observability/build-env";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Vercel builds must have the Sentry DSN, environment and source map upload credentials.
assertObservabilityBuildEnv(process.env);

const nextConfig: NextConfig = {
  trailingSlash: true,
  transpilePackages: ["@kenrou/shared-ui"],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  basePath,
  assetPrefix: basePath || undefined,
  async redirects() {
    return [{ source: "/", destination: `${HOME_PATH}/`, permanent: false }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Source maps are uploaded only when the token is present (Vercel builds); local/CI builds skip it.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Release = commit SHA: the SDK reads VERCEL_GIT_COMMIT_SHA on Vercel automatically.
  widenClientFileUpload: true,
  sourcemaps: {
    // Do not serve source maps publicly after uploading them.
    deleteSourcemapsAfterUpload: true,
  },
  silent: !process.env.CI,
  telemetry: false,
});
