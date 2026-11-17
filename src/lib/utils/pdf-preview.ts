/**
 * First-page thumbnails for local PDF files (before upload), rendered in the browser with PDF.js.
 * PDF.js is imported on demand, so pages without PDFs never download it.
 */
export type PdfPreview = {
  /** Object URL of a JPEG thumbnail of page 1. Revoke it with URL.revokeObjectURL when done. */
  thumbnailUrl: string;
  pageCount: number;
};

type PdfJsModule = typeof import("pdfjs-dist");

let pdfJsPromise: Promise<PdfJsModule> | null = null;

function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    pdfJsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
      return pdfjs;
    });
    // A failed import (offline, blocked chunk) must not poison later attempts.
    pdfJsPromise.catch(() => {
      pdfJsPromise = null;
    });
  }

  return pdfJsPromise;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PDF thumbnail encoding failed"))), "image/jpeg", 0.85);
  });
}

/** Renders page 1 scaled to `targetWidth` CSS pixels (doubled for sharp HiDPI thumbnails). */
export async function createPdfPreview(file: Blob, targetWidth = 160): Promise<PdfPreview> {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });

  try {
    const document = await loadingTask.promise;
    const page = await document.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = (targetWidth * 2) / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = window.document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas is not available");
    }

    // JPEG has no alpha: paint white so transparent PDFs do not render black.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;

    const blob = await canvasToBlob(canvas);
    return { thumbnailUrl: URL.createObjectURL(blob), pageCount: document.numPages };
  } finally {
    void loadingTask.destroy();
  }
}

/** "820 KB", "2,4 MB" in the given locale. */
export function formatFileSize(bytes: number, locale = "es-AR"): string {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString(locale)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toLocaleString(locale, { maximumFractionDigits: 1 })} MB`;
}

/** Opens a local file in a new tab (for checking a PDF before publishing). */
export function openLocalFileInNewTab(file: Blob): void {
  const url = URL.createObjectURL(file);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  // Give the new tab time to load the blob before releasing it.
  window.setTimeout(() => URL.revokeObjectURL(url), opened ? 60_000 : 0);
}
