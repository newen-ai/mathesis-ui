import { describe, expect, it } from "vitest";
import { getTwoInitials, normalizeImageUrl } from "./name";

describe("getTwoInitials", () => {
  it("uses first and last name initials when both are provided", () => {
    expect(getTwoInitials({ firstName: "Ada", lastName: "Lovelace" })).toBe("AL");
  });

  it("uses fullName tokens when first/last names are not available", () => {
    expect(getTwoInitials({ fullName: "Grace Hopper" })).toBe("GH");
  });

  it("uses fallback when no names are available", () => {
    expect(getTwoInitials({ fallback: "m" })).toBe("M");
  });
});

describe("normalizeImageUrl", () => {
  it("returns null for blank values", () => {
    expect(normalizeImageUrl("   ")).toBeNull();
  });

  it("returns trimmed URL values", () => {
    expect(normalizeImageUrl(" https://cdn.example.com/a.png ")).toBe("https://cdn.example.com/a.png");
  });
});
