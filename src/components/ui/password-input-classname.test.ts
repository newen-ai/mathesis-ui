import { describe, expect, it } from "vitest";
import { buildPasswordInputClassName } from "./PasswordInput";

describe("buildPasswordInputClassName", () => {
  it("ensures full width and default toggle spacing", () => {
    expect(buildPasswordInputClassName()).toContain("w-full");
    expect(buildPasswordInputClassName()).toContain("pr-12");
  });

  it("preserves caller classes while enforcing width and spacing", () => {
    const className = buildPasswordInputClassName("rounded-lg border px-3");

    expect(className).toContain("rounded-lg");
    expect(className).toContain("border");
    expect(className).toContain("px-3");
    expect(className).toContain("w-full");
    expect(className).toContain("pr-12");
  });

  it("supports custom right padding class for text toggles", () => {
    const className = buildPasswordInputClassName("rounded-lg", "pr-16");

    expect(className).toContain("rounded-lg");
    expect(className).toContain("w-full");
    expect(className).toContain("pr-16");
    expect(className).not.toContain("pr-12");
  });
});
