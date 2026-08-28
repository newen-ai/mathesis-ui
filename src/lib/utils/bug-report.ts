export const BUG_REPORT_MAX_TITLE_LENGTH = 120;
export const BUG_REPORT_MAX_DESCRIPTION_LENGTH = 2000;
export const BUG_REPORT_MAX_SCREENSHOTS = 3;
export const BUG_REPORT_MAX_STORED_SCREENSHOT_BYTES = 1_500_000;
export const BUG_REPORT_MAX_UPLOAD_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const BUG_REPORT_DRAFT_KEY = "mathesis.bugReport.draft";
const BUG_REPORT_BUTTON_CORNER_KEY = "mathesis.bugReport.buttonCorner";
const BUG_REPORT_FEATURE_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_BUG_REPORTS === "true";

export type BugReportButtonCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export type BugReportScreenshot = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

export type BugReportDraft = {
  title: string;
  description: string;
  pageUrl: string;
  screenshots: BugReportScreenshot[];
  updatedAt: string;
};

function isBugReportScreenshot(value: unknown): value is BugReportScreenshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.mimeType === "string" &&
    typeof candidate.dataUrl === "string"
  );
}

function normalizeDraft(value: unknown): BugReportDraft | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.title !== "string" ||
    typeof candidate.description !== "string" ||
    typeof candidate.pageUrl !== "string" ||
    typeof candidate.updatedAt !== "string" ||
    !Array.isArray(candidate.screenshots)
  ) {
    return null;
  }

  const screenshots = candidate.screenshots.filter(isBugReportScreenshot);
  return {
    title: candidate.title.slice(0, BUG_REPORT_MAX_TITLE_LENGTH),
    description: candidate.description.slice(0, BUG_REPORT_MAX_DESCRIPTION_LENGTH),
    pageUrl: candidate.pageUrl,
    screenshots: screenshots.slice(0, BUG_REPORT_MAX_SCREENSHOTS),
    updatedAt: candidate.updatedAt,
  };
}

function readJsonFromStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la captura."));
    image.src = src;
  });
}

function estimateDataUrlBytes(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
}

function createStorageTimestamp() {
  return new Date().toISOString();
}

function normalizeButtonCorner(value: unknown): BugReportButtonCorner {
  if (
    value === "top-left" ||
    value === "top-right" ||
    value === "bottom-left" ||
    value === "bottom-right"
  ) {
    return value;
  }

  return "bottom-right";
}

export function isBugReportFeatureEnabled() {
  return BUG_REPORT_FEATURE_ENABLED;
}

export function createEmptyBugReportDraft(pageUrl = ""): BugReportDraft {
  return {
    title: "",
    description: "",
    pageUrl,
    screenshots: [],
    updatedAt: createStorageTimestamp(),
  };
}

export function readBugReportDraft(): BugReportDraft | null {
  const parsed = readJsonFromStorage<unknown>(BUG_REPORT_DRAFT_KEY);
  return normalizeDraft(parsed);
}

export function saveBugReportDraft(draft: BugReportDraft) {
  const nextDraft = {
    ...draft,
    updatedAt: createStorageTimestamp(),
  };

  window.localStorage.setItem(BUG_REPORT_DRAFT_KEY, JSON.stringify(nextDraft));
  return nextDraft;
}

export function clearBugReportDraft() {
  window.localStorage.removeItem(BUG_REPORT_DRAFT_KEY);
}

export function readBugReportButtonCorner(): BugReportButtonCorner {
  return normalizeButtonCorner(readJsonFromStorage<unknown>(BUG_REPORT_BUTTON_CORNER_KEY));
}

export function saveBugReportButtonCorner(corner: BugReportButtonCorner) {
  window.localStorage.setItem(
    BUG_REPORT_BUTTON_CORNER_KEY,
    JSON.stringify(normalizeButtonCorner(corner))
  );
}

export async function createBugReportScreenshot(
  file: File
): Promise<BugReportScreenshot> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`El archivo ${file.name} no es una imagen válida.`);
  }

  const sourceDataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(sourceDataUrl);
  const longestSide = Math.max(image.width, image.height);
  const scale = longestSide > 1600 ? 1600 / longestSide : 1;
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo preparar la captura para guardarla.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  if (estimateDataUrlBytes(dataUrl) > BUG_REPORT_MAX_STORED_SCREENSHOT_BYTES) {
    throw new Error(
      `La captura ${file.name} es demasiado pesada para guardarla en este navegador.`
    );
  }

  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${file.name}-${Date.now()}`,
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    dataUrl,
  };
}

export function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): File {
  const [prefix, base64] = dataUrl.split(",");

  if (!prefix || !base64) {
    throw new Error("No se pudo preparar una captura para enviarla.");
  }

  const match = prefix.match(/^data:(.+);base64$/);
  const resolvedMimeType = match?.[1] ?? mimeType;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: resolvedMimeType });
}