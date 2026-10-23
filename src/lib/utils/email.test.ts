import { describe, expect, it } from "vitest";
import {
  maskEmailForDisplay,
  normalizeEmailInput,
  resolveEmailParam,
} from "./email";

describe("email utils", () => {
  it("normalizes email input", () => {
    expect(normalizeEmailInput("  User@Mail.Com  ")).toBe("user@mail.com");
    expect(normalizeEmailInput(undefined)).toBe("");
  });

  it("resolves email param from string and array", () => {
    expect(resolveEmailParam("  USER@MAIL.COM ")).toBe("user@mail.com");
    expect(resolveEmailParam([" first@mail.com ", "second@mail.com"])).toBe("first@mail.com");
    expect(resolveEmailParam("   ")).toBeNull();
  });

  it("masks email for display", () => {
    expect(maskEmailForDisplay("someone@example.com")).toBe("so*****@example.com");
    expect(maskEmailForDisplay("ab@example.com", 1)).toBe("a*@example.com");
    expect(maskEmailForDisplay("invalid-email")).toBe("tu correo");
  });
});
