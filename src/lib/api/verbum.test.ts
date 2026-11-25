import { describe, expect, it } from "vitest";
import { getVerbumErrorCode, isVerbumSessionExpired } from "./verbum";

describe("verbum api errors", () => {
  it("reads the backend error code from the details", () => {
    expect(getVerbumErrorCode({ details: { code: "VERBUM_NOT_A_WORD" } })).toBe("VERBUM_NOT_A_WORD");
    expect(getVerbumErrorCode({ details: "nope" })).toBeUndefined();
    expect(getVerbumErrorCode(null)).toBeUndefined();
  });

  it("detects an expired session from a 401 status", () => {
    expect(isVerbumSessionExpired({ status: 401 })).toBe(true);
    expect(isVerbumSessionExpired({ status: 422 })).toBe(false);
    expect(isVerbumSessionExpired(null)).toBe(false);
  });
});
