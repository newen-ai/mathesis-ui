import type { SessionAccessDecision } from "@/lib/api/auth";
import { HOME_PATH, WELCOME_ENTRY_PATH } from "@/lib/routes";

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
  if (
    accessDecision.sessionState === "authenticated" &&
    accessDecision.hasVerifiedEmail &&
    !accessDecision.hasCompletedWelcomeOnboarding
  ) {
    return WELCOME_ENTRY_PATH;
  }

  return nextPath;
}