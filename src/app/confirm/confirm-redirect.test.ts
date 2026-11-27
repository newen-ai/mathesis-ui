import { describe, expect, it } from "vitest";
import { resolveConfirmAuthenticatedRedirect } from "./confirm-redirect";
import { HOME_PATH, WELCOME_ENTRY_PATH } from "@/lib/routes";

describe("resolveConfirmAuthenticatedRedirect", () => {
  it("returns null when session is not authenticated", () => {
    const redirectTarget = resolveConfirmAuthenticatedRedirect({
      sessionState: "unauthenticated",
      isWhitelisted: false,
      hasVerifiedEmail: true,
      hasCompletedWelcomeOnboarding: true,
    });

    expect(redirectTarget).toBeNull();
  });

  it("redirects authenticated users without onboarding completion to bienvenida", () => {
    const redirectTarget = resolveConfirmAuthenticatedRedirect({
      sessionState: "authenticated",
      role: "user",
      isWhitelisted: true,
      hasVerifiedEmail: true,
      hasCompletedWelcomeOnboarding: false,
    });

    expect(redirectTarget).toBe(WELCOME_ENTRY_PATH);
  });

  it("redirects authenticated users with completed onboarding to ateneo", () => {
    const redirectTarget = resolveConfirmAuthenticatedRedirect({
      sessionState: "authenticated",
      role: "user",
      isWhitelisted: true,
      hasVerifiedEmail: true,
      hasCompletedWelcomeOnboarding: true,
    });

    expect(redirectTarget).toBe(HOME_PATH);
  });
});
