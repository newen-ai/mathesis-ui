import { describe, expect, it } from "vitest";
import { formatBadgeSlug } from "./badge";
import { getTwoInitials, normalizeImageUrl } from "./name";

describe("badge utils", () => {
  it("formats slug words in title case", () => {
    expect(formatBadgeSlug("mensa_argentina")).toBe("Mensa Argentina");
    expect(formatBadgeSlug("_MATHESIS__empresarios_")).toBe("Mathesis Empresarios");
  });
});

describe("name utils", () => {
  it("derives initials from first and last names", () => {
    expect(getTwoInitials({ firstName: "Ada", lastName: "Lovelace" })).toBe("AL");
    expect(getTwoInitials({ firstName: "Ada", lastName: "" })).toBe("AD");
  });

  it("derives initials from full name or fallback", () => {
    expect(getTwoInitials({ fullName: "Grace Hopper" })).toBe("GH");
    expect(getTwoInitials({ fullName: "Plato" })).toBe("PL");
    expect(getTwoInitials({ fallback: "xy" })).toBe("XY");
  });

  it("normalizes image urls", () => {
    expect(normalizeImageUrl(" https://cdn/img.png ")).toBe("https://cdn/img.png");
    expect(normalizeImageUrl("   ")).toBeNull();
    expect(normalizeImageUrl(undefined)).toBeNull();
  });
});
