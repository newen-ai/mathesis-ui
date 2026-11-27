import type { SessionAccessDecision } from "@/lib/api/auth";
import { HOME_PATH, WELCOME_ENTRY_PATH } from "@/lib/routes";
import { FALLBACK_WHITELIST_PATH } from "./session-gate-redirect";

export function sanitizeLoginNextPath(path: string | null): string {
  if (!path) {
    return HOME_PATH;
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return HOME_PATH;
  }

  return path;
}

export function resolveLoginSuccessRedirect(
  accessDecision: SessionAccessDecision,
  nextPath: string
): string {
  // Accounts pending whitelist approval can log in, but only to see the beta sign-up screen.
  if (
    accessDecision.sessionState === "authenticated" &&
    accessDecision.role !== "admin" &&
    !accessDecision.isWhitelisted
  ) {
    return FALLBACK_WHITELIST_PATH;
  }

  if (
    accessDecision.sessionState === "authenticated" &&
    accessDecision.hasVerifiedEmail &&
    !accessDecision.hasCompletedWelcomeOnboarding
  ) {
    return WELCOME_ENTRY_PATH;
  }

  return nextPath;
}