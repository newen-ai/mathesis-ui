import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export const TEST_API_BASE_URL = "http://api.test/api/v1";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    // Component tests render in a DOM; pure logic tests stay on node.
    environmentMatchGlobs: [["src/**/*.test.tsx", "jsdom"]],
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
    env: {
      NEXT_PUBLIC_API_BASE_URL: TEST_API_BASE_URL,
    },
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "text", "json-summary", "html"],
      // Logic layer: API clients, auth/session helpers, utils, i18n mapping and route-level helpers.
      // Pages and most JSX are covered by build + manual QA, not by coverage numbers.
      include: [
        "src/lib/**/*.ts",
        "src/app/**/_lib/**/*.ts",
        "src/app/(platform)/_components/home/ProfileAboutCard.tsx",
        "src/app/(platform)/_components/home/ProfileCollapsibleText.tsx",
        "src/app/(platform)/_components/home/ProfileEditModal.tsx",
      ],
      exclude: [
        "**/*.test.*",
        "src/test/**",
        "src/app/**/_lib/mock-data.ts",
        "src/app/**/_lib/types.ts",
        "src/app/**/_lib/constants.ts",
        "src/app/**/_lib/group-topics.ts",
        // Not used by any page today (dead code); remove or cover it when it comes back.
        "src/app/(platform)/_lib/hooks/useHomeFeed.ts",
        "src/lib/i18n/index.ts",
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
    },
  },
});
