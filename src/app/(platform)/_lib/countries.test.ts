import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, getCountryOptions, resolveCountryCode } from "./countries";

describe("countries", () => {
  it("lists 197 unique countries", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(197);
    expect(COUNTRY_CODES).toHaveLength(197);
  });

  it("sorts Spanish labels so that typing 'arg' lands on Argelia, then Argentina", () => {
    const labels = getCountryOptions("es").map((option) => option.label);
    const firstArg = labels.findIndex((label) => label.toLowerCase().startsWith("arg"));
    expect(labels[firstArg]).toBe("Argelia");
    expect(labels[firstArg + 1]).toBe("Argentina");
  });

  it("uses readable labels and follows the UI language", () => {
    const es = getCountryOptions("es-AR");
    expect(es.find((option) => option.code === "CI")?.label).toBe("Costa de Marfil");
    expect(getCountryOptions("en").find((option) => option.code === "DE")?.label).toBe("Germany");
  });

  it("resolves codes and legacy free-text names, ignoring case and accents", () => {
    expect(resolveCountryCode("ar")).toBe("AR");
    expect(resolveCountryCode("  argentina ")).toBe("AR");
    expect(resolveCountryCode("Mexico")).toBe("MX");
    expect(resolveCountryCode("Perú")).toBe("PE");
    expect(resolveCountryCode("Germany")).toBe("DE");
    expect(resolveCountryCode("argentino")).toBeNull();
    expect(resolveCountryCode("")).toBeNull();
  });
});
