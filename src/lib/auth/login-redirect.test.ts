import { describe, expect, it } from "vitest";
import {
  resolveLoginSuccessRedirect,
  sanitizeLoginNextPath,
} from "./login-redirect";
import { WELCOME_ENTRY_PATH } from "@/lib/routes";

describe("sanitizeLoginNextPath", () => {
  it("returns root when next path is null", () => {
    expect(sanitizeLoginNextPath(null)).toBe("/");
  });

  it("returns root when next path is not internal", () => {
    expect(sanitizeLoginNextPath("https://example.com")).toBe("/");
    expect(sanitizeLoginNextPath("//evil.example/path")).toBe("/");
    expect(sanitizeLoginNextPath("ateneo")).toBe("/");
  });

  it("keeps safe internal paths", () => {
    expect(sanitizeLoginNextPath("/")).toBe("/");
    expect(sanitizeLoginNextPath("/ateneo")).toBe("/ateneo");
    expect(sanitizeLoginNextPath("/bienvenida/futuro")).toBe("/bienvenida/futuro");
  });
});

describe("resolveLoginSuccessRedirect", () => {
  it("redirects pending onboarding users to bienvenida", () => {
    const target = resolveLoginSuccessRedirect(
      {
        sessionState: "authenticated",
        role: "user",
        isWhitelisted: true,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: false,
      },
      "/ateneo"
    );

    expect(target).toBe(WELCOME_ENTRY_PATH);
  });

  it("keeps requested next path when onboarding is complete", () => {
    const target = resolveLoginSuccessRedirect(
      {
        sessionState: "authenticated",
        role: "user",
        isWhitelisted: true,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: true,
      },
      "/ateneo/groups"
    );

    expect(target).toBe("/ateneo/groups");
  });

  it("keeps requested next path when session decision is unknown", () => {
    const target = resolveLoginSuccessRedirect(
      {
        sessionState: "unknown",
        isWhitelisted: false,
        hasVerifiedEmail: true,
        hasCompletedWelcomeOnboarding: false,
      },
      "/"
    );

    expect(target).toBe("/");
  });
});