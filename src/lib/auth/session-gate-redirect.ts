import type { SessionAccessDecision } from "@/lib/api/auth";
import { HOME_PATH, WELCOME_ENTRY_PATH, WELCOME_FUTURE_PATH } from "@/lib/routes";

export const FALLBACK_WHITELIST_PATH = "/whitelist-access";

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function buildLoginPath(pathname: string): string {
  const loginPath = new URLSearchParams();
  if (pathname && pathname !== "/") {
    loginPath.set("next", pathname);
  }

  const queryString = loginPath.toString();
  return queryString ? `/login?${queryString}` : "/login";
}

export function isWelcomePath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return (
    normalizedPathname === WELCOME_ENTRY_PATH ||
    normalizedPathname === WELCOME_FUTURE_PATH
  );
}

export function resolveSessionGateRedirect(
  accessDecision: SessionAccessDecision,
  pathname: string,
  loginPath: string
): string | null {
  if (accessDecision.sessionState === "unauthenticated") {
    return loginPath;
  }

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
    !accessDecision.hasCompletedWelcomeOnboarding &&
    !isWelcomePath(pathname)
  ) {
    return WELCOME_ENTRY_PATH;
  }

  if (
    accessDecision.sessionState === "authenticated" &&
    accessDecision.hasCompletedWelcomeOnboarding &&
    isWelcomePath(pathname)
  ) {
    return HOME_PATH;
  }

  return null;
}