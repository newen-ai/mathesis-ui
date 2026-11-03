import type { SessionAccessDecision } from "@/lib/api/auth";
import { WELCOME_ENTRY_PATH } from "@/lib/routes";

export function sanitizeLoginNextPath(path: string | null): string {
  if (!path) {
    return "/";
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
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