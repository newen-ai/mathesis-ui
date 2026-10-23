import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/app/(platform)/_lib/topbar-active.ts",
        "src/app/(platform)/ateneo/_lib/reply-prefill.ts",
        "src/app/login/login-password-field.ts",
        "src/lib/utils/email.ts",
        "src/lib/utils/badge.ts",
        "src/lib/utils/name.ts",
        "src/lib/utils/password.ts",
        "src/lib/utils/link-preview.ts",
        "src/lib/i18n/auth-errors.ts",
        "src/lib/i18n/ateneo-errors.ts",
        "src/lib/i18n/bug-report-errors.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});
