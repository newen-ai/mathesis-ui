// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pdfjs = vi.hoisted(() => {
  const render = vi.fn(() => ({ promise: Promise.resolve() }));
  const getViewport = vi.fn(({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }));
  const destroy = vi.fn(async () => undefined);
  return {
    render,
    getViewport,
    destroy,
    GlobalWorkerOptions: { workerSrc: "" },
    getDocument: vi.fn(() => ({
      promise: Promise.resolve({ numPages: 7, getPage: vi.fn(async () => ({ getViewport, render })) }),
      destroy,
    })),
  };
});
vi.mock("pdfjs-dist", () => pdfjs);

import { createPdfPreview, formatFileSize, openLocalFileInNewTab } from "./pdf-preview";

let context: { fillRect: ReturnType<typeof vi.fn>; fillStyle: string } | null;

beforeEach(() => {
  context = { fillRect: vi.fn(), fillStyle: "" };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(function (callback) {
    callback(new Blob(["jpg"], { type: "image/jpeg" }));
  });
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:thumb"), revokeObjectURL: vi.fn() }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function pdfFile() {
  const file = new File(["%PDF-1.4"], "paper.pdf", { type: "application/pdf" });
  // jsdom's File lacks arrayBuffer().
  Object.defineProperty(file, "arrayBuffer", { value: async () => new TextEncoder().encode("%PDF-1.4").buffer });
  return file;
}

describe("createPdfPreview", () => {
  it("renders page 1 at twice the target width and returns the page count", async () => {
    const preview = await createPdfPreview(pdfFile(), 160);

    expect(preview).toEqual({ thumbnailUrl: "blob:thumb", pageCount: 7 });
    expect(pdfjs.GlobalWorkerOptions.workerSrc).toContain("pdf.worker.min.mjs");
    expect(pdfjs.getViewport).toHaveBeenLastCalledWith({ scale: 320 / 600 });
    expect(context?.fillRect).toHaveBeenCalled();
    expect(pdfjs.destroy).toHaveBeenCalled();
  });

  it("cleans up and fails when the canvas is unavailable", async () => {
    context = null;

    await expect(createPdfPreview(pdfFile())).rejects.toThrow("Canvas is not available");
    expect(pdfjs.destroy).toHaveBeenCalled();
  });

  it("fails when the thumbnail cannot be encoded", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(null));

    await expect(createPdfPreview(pdfFile())).rejects.toThrow("PDF thumbnail encoding failed");
  });
});

describe("formatFileSize", () => {
  it("uses KB below 1 MB and one decimal MB above", () => {
    expect(formatFileSize(200)).toBe("1 KB");
    expect(formatFileSize(820 * 1024)).toBe("820 KB");
    expect(formatFileSize(2.44 * 1024 * 1024)).toBe("2,4 MB");
    expect(formatFileSize(2.44 * 1024 * 1024, "en-US")).toBe("2.4 MB");
  });
});

describe("openLocalFileInNewTab", () => {
  it("opens a blob URL and revokes it later", () => {
    vi.useFakeTimers();
    const open = vi.spyOn(window, "open").mockReturnValue({} as Window);

    openLocalFileInNewTab(new Blob(["%PDF"]));

    expect(open).toHaveBeenCalledWith("blob:thumb", "_blank", "noopener,noreferrer");
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:thumb");
  });
});
