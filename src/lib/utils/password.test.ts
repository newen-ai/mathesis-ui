import { describe, expect, it } from "vitest";
import { evaluatePasswordStrength } from "./password";

describe("evaluatePasswordStrength", () => {
  it("classifies weak passwords when minimum policy is not met", () => {
    const result = evaluatePasswordStrength("short");

    expect(result.strength).toBe("weak");
    expect(result.meetsPolicy).toBe(false);
  });

  it("classifies normal passwords with length and letters but only one symbol class", () => {
    const result = evaluatePasswordStrength("Password1");

    expect(result.hasMinLength).toBe(true);
    expect(result.hasUpper).toBe(true);
    expect(result.hasLower).toBe(true);
    expect(result.hasNumber).toBe(true);
    expect(result.hasSpecial).toBe(false);
    expect(result.strength).toBe("normal");
    expect(result.meetsPolicy).toBe(false);
  });

  it("classifies strong passwords and meets policy", () => {
    const result = evaluatePasswordStrength("Password1!");

    expect(result.strength).toBe("strong");
    expect(result.meetsPolicy).toBe(true);
  });
});
