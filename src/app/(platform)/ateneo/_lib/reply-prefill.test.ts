import { describe, expect, it } from "vitest";
import { buildReplyMentionPrefill } from "./reply-prefill";

describe("buildReplyMentionPrefill", () => {
  it("builds mention with trailing space", () => {
    expect(buildReplyMentionPrefill("Ada Lovelace")).toBe("@Ada Lovelace ");
  });

  it("trims author to avoid duplicated spaces in mention", () => {
    expect(buildReplyMentionPrefill("  Grace Hopper  ")).toBe("@Grace Hopper ");
  });
});
