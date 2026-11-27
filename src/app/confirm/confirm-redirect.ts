import type { SessionAccessDecision } from "@/lib/api/auth";
import { HOME_PATH, WELCOME_ENTRY_PATH } from "@/lib/routes";

export function resolveConfirmAuthenticatedRedirect(
  accessDecision: SessionAccessDecision
): string | null {
  if (accessDecision.sessionState !== "authenticated") {
    return null;
  }

  return accessDecision.hasCompletedWelcomeOnboarding ? HOME_PATH : WELCOME_ENTRY_PATH;
}
