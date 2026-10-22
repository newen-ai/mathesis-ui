import { describe, expect, it } from "vitest";
import { buildLoginPasswordInputClassName } from "./login-password-field";

describe("buildLoginPasswordInputClassName", () => {
  it("adds width and toggle spacing classes", () => {
    expect(buildLoginPasswordInputClassName()).toContain("w-full");
    expect(buildLoginPasswordInputClassName()).toContain("pr-16");
  });

  it("preserves existing classes while adding required ones", () => {
    const className = buildLoginPasswordInputClassName("rounded-lg px-3");

    expect(className).toContain("rounded-lg");
    expect(className).toContain("px-3");
    expect(className).toContain("w-full");
    expect(className).toContain("pr-16");
  });
});
