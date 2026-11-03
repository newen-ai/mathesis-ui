import { describe, expect, it } from "vitest";
import {
  buildLoginPath,
  FALLBACK_WHITELIST_PATH,
  isWelcomePath,
  normalizePathname,
  resolveSessionGateRedirect,
} from "./session-gate-redirect";
import { HOME_PATH, WELCOME_ENTRY_PATH } from "@/lib/routes";

describe("normalizePathname", () => {
  it("normalizes empty and trailing slash pathnames", () => {
    expect(normalizePathname("")).toBe("/");
    expect(normalizePathname("/")).toBe("/");
    expect(normalizePathname("/ateneo/")).toBe("/ateneo");
  });
});

describe("buildLoginPath", () => {
  it("builds login path with next for non-root pages", () => {
    expect(buildLoginPath("/ateneo/groups")).toBe(
      "/login?next=%2Fateneo%2Fgroups"
    );
  });

  it("keeps plain login path for root", () => {
    expect(buildLoginPath("/")).toBe("/login");
  });
});

describe("isWelcomePath", () => {
  it("detects welcome paths with and without trailing slash", () => {
    expect(isWelcomePath("/bienvenida")).toBe(true);
    expect(isWelcomePath("/bienvenida/")).toBe(true);
    expect(isWelcomePath("/bienvenida/futuro")).toBe(true);
    expect(isWelcomePath("/ateneo")).toBe(false);
  });
});

describe("resolveSessionGateRedirect", () => {
  it("redirects unauthenticated sessions to login path", () => {
    const target = resolveSessionGateRedirect(
      {
        sessionState: "unauthenticated",
        isWhitelisted: false,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: true,
      },
      "/ateneo",
      "/login?next=%2Fateneo"
    );

    expect(target).toBe("/login?next=%2Fateneo");
  });

  it("redirects non-admin non-whitelisted users to whitelist page", () => {
    const target = resolveSessionGateRedirect(
      {
        sessionState: "authenticated",
        role: "user",
        isWhitelisted: false,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: true,
      },
      "/ateneo",
      "/login?next=%2Fateneo"
    );

    expect(target).toBe(FALLBACK_WHITELIST_PATH);
  });

  it("redirects pending onboarding users to bienvenida", () => {
    const target = resolveSessionGateRedirect(
      {
        sessionState: "authenticated",
        role: "user",
        isWhitelisted: true,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: false,
      },
      "/ateneo",
      "/login?next=%2Fateneo"
    );

    expect(target).toBe(WELCOME_ENTRY_PATH);
  });

  it("redirects completed onboarding users out of welcome routes", () => {
    const target = resolveSessionGateRedirect(
      {
        sessionState: "authenticated",
        role: "user",
        isWhitelisted: true,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: true,
      },
      "/bienvenida",
      "/login"
    );

    expect(target).toBe(HOME_PATH);
  });

  it("keeps current route when no redirect is needed", () => {
    const target = resolveSessionGateRedirect(
      {
        sessionState: "authenticated",
        role: "user",
        isWhitelisted: true,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: true,
      },
      "/ateneo",
      "/login?next=%2Fateneo"
    );

    expect(target).toBeNull();
  });
});