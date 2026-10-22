import { describe, expect, it, vi } from "vitest";
import { evaluatePasswordStrength } from "./password";
import {
  buildLinkifiedSegments,
  extractUniqueUrlsFromText,
  fetchLinkPreview,
  normalizeUrlCandidate,
} from "./link-preview";

describe("password utils", () => {
  it("evaluates weak password", () => {
    const result = evaluatePasswordStrength("abc");
    expect(result.strength).toBe("weak");
    expect(result.meetsPolicy).toBe(false);
  });

  it("evaluates normal password", () => {
    const result = evaluatePasswordStrength("Abcdefg1");
    expect(result.strength).toBe("normal");
    expect(result.meetsPolicy).toBe(false);
  });

  it("evaluates strong password", () => {
    const result = evaluatePasswordStrength("Abcd1234!");
    expect(result.strength).toBe("strong");
    expect(result.meetsPolicy).toBe(true);
  });
});

describe("link preview utils", () => {
  it("normalizes url candidates", () => {
    expect(normalizeUrlCandidate("www.example.com...")).toBe("https://www.example.com/");
    expect(normalizeUrlCandidate("javascript:alert(1)")).toBeNull();
  });

  it("extracts unique urls with a limit", () => {
    const text = "Visit https://a.com and https://a.com then www.b.com";
    const urls = extractUniqueUrlsFromText(text, 2);
    expect(urls).toEqual(["https://a.com/", "https://www.b.com/"]);
  });

  it("builds linkified segments preserving punctuation", () => {
    const segments = buildLinkifiedSegments("Go to https://example.com, now");
    expect(segments).toEqual([
      { type: "text", value: "Go to " },
      { type: "link", value: "https://example.com", href: "https://example.com/" },
      { type: "text", value: "," },
      { type: "text", value: " now" },
    ]);
  });

  it("fetches link preview payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          url: "https://example.com/",
          hostname: "example.com",
          title: "Example",
          description: null,
          imageUrl: null,
          faviconUrl: null,
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const preview = await fetchLinkPreview("https://example.com");
    expect(preview?.hostname).toBe("example.com");
  });

  it("returns null on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    await expect(fetchLinkPreview("https://example.com")).resolves.toBeNull();
  });
});
