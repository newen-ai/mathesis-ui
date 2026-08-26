import { describe, expect, it } from "vitest";
import { maskEmailForDisplay, normalizeEmailInput, resolveEmailParam } from "./email";

describe("normalizeEmailInput", () => {
  it("normalizes whitespace and casing", () => {
    expect(normalizeEmailInput("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("returns empty string for nullish values", () => {
    expect(normalizeEmailInput(undefined)).toBe("");
    expect(normalizeEmailInput(null)).toBe("");
  });
});

describe("resolveEmailParam", () => {
  it("uses the first item when param is an array", () => {
    expect(resolveEmailParam(["  First@Example.com  ", "second@example.com"]))
      .toBe("first@example.com");
  });

  it("returns null for empty input", () => {
    expect(resolveEmailParam("   ")).toBeNull();
  });
});

describe("maskEmailForDisplay", () => {
  it("masks local part while keeping domain visible", () => {
    expect(maskEmailForDisplay("person@example.com")).toBe("pe****@example.com");
  });

  it("returns fallback text for invalid email format", () => {
    expect(maskEmailForDisplay("not-an-email")).toBe("tu correo");
  });

  it("always keeps at least one masked character", () => {
    expect(maskEmailForDisplay("ab@example.com", 5)).toBe("ab*@example.com");
  });
});
