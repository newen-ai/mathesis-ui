// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toDateLabel } from "@/app/(platform)/_lib/utils/date";
import { withBasePath } from "@/lib/assets";
import {
  applyThemeToDocument,
  normalizeTheme,
  persistTheme,
  readStoredTheme,
  readThemeFromCookieString,
  readThemeFromDocument,
  resolveThemeBootstrapValue,
} from "@/lib/theme/theme-preference";
import {
  BUG_REPORT_MAX_SCREENSHOTS,
  BUG_REPORT_MAX_TITLE_LENGTH,
  clearBugReportDraft,
  createBugReportScreenshot,
  createEmptyBugReportDraft,
  dataUrlToFile,
  isBugReportFeatureEnabled,
  readBugReportButtonCorner,
  readBugReportDraft,
  saveBugReportButtonCorner,
  saveBugReportDraft,
} from "./bug-report";
import { createRenderableImageUrlFromBlob, revokeObjectUrls } from "./image-preview";

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}

beforeEach(() => {
  window.localStorage.clear();
  clearCookies();
  document.documentElement.removeAttribute("data-theme");
});

describe("bug report drafts", () => {
  it("round-trips a draft through localStorage and stamps updatedAt", () => {
    const draft = createEmptyBugReportDraft("https://sophium.social/perfil");
    const saved = saveBugReportDraft({ ...draft, title: "Botón roto" });

    expect(readBugReportDraft()).toEqual(saved);

    clearBugReportDraft();
    expect(readBugReportDraft()).toBeNull();
  });

  it("normalises stored drafts: truncates, drops invalid screenshots and caps their number", () => {
    const valid = { id: "1", name: "a", mimeType: "image/jpeg", dataUrl: "data:," };
    window.localStorage.setItem(
      "sophium.bugReport.draft",
      JSON.stringify({
        title: "x".repeat(BUG_REPORT_MAX_TITLE_LENGTH + 50),
        description: "d",
        pageUrl: "u",
        updatedAt: "2026-01-01",
        screenshots: [valid, { id: 2 }, null, valid, valid, valid],
      })
    );

    const draft = readBugReportDraft();
    expect(draft?.title).toHaveLength(BUG_REPORT_MAX_TITLE_LENGTH);
    expect(draft?.screenshots).toHaveLength(BUG_REPORT_MAX_SCREENSHOTS);
  });

  it("ignores corrupted or incomplete drafts", () => {
    window.localStorage.setItem("sophium.bugReport.draft", "{not json");
    expect(readBugReportDraft()).toBeNull();

    window.localStorage.setItem("sophium.bugReport.draft", JSON.stringify({ title: "solo título" }));
    expect(readBugReportDraft()).toBeNull();

    window.localStorage.setItem("sophium.bugReport.draft", JSON.stringify("texto"));
    expect(readBugReportDraft()).toBeNull();
  });

  it("remembers the floating button corner and falls back to bottom-right", () => {
    expect(readBugReportButtonCorner()).toBe("bottom-right");

    saveBugReportButtonCorner("top-left");
    expect(readBugReportButtonCorner()).toBe("top-left");

    window.localStorage.setItem("sophium.bugReport.buttonCorner", JSON.stringify("middle"));
    expect(readBugReportButtonCorner()).toBe("bottom-right");
  });

  it("is disabled unless the env flag is set", () => {
    expect(isBugReportFeatureEnabled()).toBe(false);
  });

  it("converts data URLs back to files", () => {
    const file = dataUrlToFile("data:image/png;base64,aGVsbG8=", "captura.png", "image/jpeg");
    expect(file.name).toBe("captura.png");
    expect(file.type).toBe("image/png");
    expect(file.size).toBe(5); // "hello"

    expect(dataUrlToFile("data:;base64,aGk=", "x", "image/jpeg").type).toBe("image/jpeg");
    expect(() => dataUrlToFile("broken", "x", "image/png")).toThrow("No se pudo preparar una captura");
  });

  it("rejects non-image screenshots before reading them", async () => {
    await expect(createBugReportScreenshot(new File(["x"], "nota.txt", { type: "text/plain" }))).rejects.toThrow("no es una imagen");
  });

  describe("screenshot compression", () => {
    let toDataUrl: ReturnType<typeof vi.fn>;
    let imageSize = { width: 3200, height: 1600 };

    beforeEach(() => {
      imageSize = { width: 3200, height: 1600 };
      class FakeImage {
        width = imageSize.width;
        height = imageSize.height;
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_value: string) {
          queueMicrotask(() => this.onload?.());
        }
      }
      vi.stubGlobal("Image", FakeImage);
      toDataUrl = vi.fn(() => "data:image/jpeg;base64,AAAA");
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
        fillRect: vi.fn(),
        drawImage: vi.fn(),
        fillStyle: "",
      } as unknown as CanvasRenderingContext2D);
      vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(toDataUrl);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("scales large images down to 1600px and stores them as JPEG", async () => {
      const screenshot = await createBugReportScreenshot(new File(["png"], "pantalla.png", { type: "image/png" }));

      expect(screenshot).toMatchObject({ name: "pantalla.jpg", mimeType: "image/jpeg", dataUrl: "data:image/jpeg;base64,AAAA" });
      expect(toDataUrl).toHaveBeenCalledWith("image/jpeg", 0.82);
    });

    it("refuses screenshots that stay too heavy for localStorage", async () => {
      toDataUrl.mockReturnValue(`data:image/jpeg;base64,${"A".repeat(2_100_000)}`);

      await expect(createBugReportScreenshot(new File(["png"], "enorme.png", { type: "image/png" }))).rejects.toThrow("demasiado pesada");
    });

    it("fails when the canvas is unavailable", async () => {
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

      await expect(createBugReportScreenshot(new File(["png"], "a.png", { type: "image/png" }))).rejects.toThrow("No se pudo preparar");
    });
  });
});

describe("theme preference", () => {
  it("normalises theme values", () => {
    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("neon")).toBeNull();
  });

  it("reads the theme from a cookie header", () => {
    expect(readThemeFromCookieString("a=1; theme=dark; b=2")).toBe("dark");
    expect(readThemeFromCookieString("a=1")).toBeNull();
    expect(readThemeFromCookieString("theme=blue")).toBeNull();
  });

  it("applies, persists and restores the theme", () => {
    applyThemeToDocument("dark");
    expect(readThemeFromDocument()).toBe("dark");

    persistTheme("dark");
    expect(window.localStorage.getItem("theme")).toBe("dark");
    expect(document.cookie).toContain("theme=dark");
    expect(readStoredTheme()).toBe("dark");

    window.localStorage.clear();
    expect(readStoredTheme()).toBe("dark");
  });

  it("bootstraps from storage, then cookie, then the OS preference", () => {
    window.localStorage.setItem("theme", "light");
    expect(resolveThemeBootstrapValue()).toBe("light");

    window.localStorage.clear();
    document.cookie = "theme=dark; Path=/";
    expect(resolveThemeBootstrapValue()).toBe("dark");

    clearCookies();
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    expect(resolveThemeBootstrapValue()).toBe("dark");

    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
    expect(resolveThemeBootstrapValue()).toBe("light");

    vi.stubGlobal("matchMedia", undefined);
    expect(resolveThemeBootstrapValue()).toBe("light");
  });
});

describe("image previews", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:preview"), revokeObjectURL: vi.fn() }));
  });

  it("creates object URLs for regular images", async () => {
    expect(await createRenderableImageUrlFromBlob(new Blob(["x"], { type: "image/png" }))).toBe("blob:preview");
  });

  it("converts HEIC images and falls back to the original blob when conversion fails", async () => {
    vi.doMock("heic2any", () => ({ default: vi.fn(async () => new Blob(["jpg"], { type: "image/jpeg" })) }));
    expect(await createRenderableImageUrlFromBlob(new Blob(["x"], { type: "image/heic" }))).toBe("blob:preview");

    vi.doMock("heic2any", () => ({ default: vi.fn(async () => Promise.reject(new Error("no wasm"))) }));
    vi.resetModules();
    const { createRenderableImageUrlFromBlob: fresh } = await import("./image-preview");
    expect(await fresh(new Blob(["x"], { type: "image/heif" }))).toBe("blob:preview");
    vi.doUnmock("heic2any");
  });

  it("revokes every URL", () => {
    revokeObjectUrls(["blob:a", "blob:b"]);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});

describe("small helpers", () => {
  it("formats year-month and full dates", () => {
    expect(toDateLabel("")).toBe("");
    expect(toDateLabel("2024-03", "en-US")).toBe("Mar 2024");
    expect(toDateLabel("2024-03-15", "en-US")).toBe("Mar 2024");
  });

  it("prefixes asset paths with the base path", () => {
    expect(withBasePath("/logo.png")).toBe("/logo.png");
  });
});
