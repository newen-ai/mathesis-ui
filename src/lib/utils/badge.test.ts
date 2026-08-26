import { describe, expect, it } from "vitest";
import { formatBadgeSlug } from "./badge";

describe("formatBadgeSlug", () => {
  it("converts snake_case into title cased words", () => {
    expect(formatBadgeSlug("mensa_empresarios_admin")).toBe("Mensa Empresarios Admin");
  });

  it("ignores extra separators and whitespace-only chunks", () => {
    expect(formatBadgeSlug("_mensa__empresarios_")).toBe("Mensa Empresarios");
  });
});
