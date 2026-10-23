import { describe, expect, it } from "vitest";
import { isTopbarItemActive, normalizeTopbarPathname } from "./topbar-active";

describe("normalizeTopbarPathname", () => {
  it("keeps root path untouched", () => {
    expect(normalizeTopbarPathname("/")).toBe("/");
  });

  it("removes trailing slash for non-root paths", () => {
    expect(normalizeTopbarPathname("/perfil/")).toBe("/perfil");
  });
});

describe("isTopbarItemActive", () => {
  it("activates only perfil for /perfil", () => {
    expect(isTopbarItemActive("/perfil", "/perfil")).toBe(true);
    expect(isTopbarItemActive("/perfil", "/perfil/credencial")).toBe(false);
  });

  it("activates only credencial for /perfil/credencial", () => {
    expect(isTopbarItemActive("/perfil/credencial", "/perfil")).toBe(false);
    expect(isTopbarItemActive("/perfil/credencial", "/perfil/credencial")).toBe(true);
  });

  it("supports trailing slash normalization", () => {
    expect(isTopbarItemActive("/perfil/", "/perfil")).toBe(true);
    expect(isTopbarItemActive("/perfil/", "/perfil/credencial")).toBe(false);
  });
});
