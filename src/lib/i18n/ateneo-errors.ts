import i18next from "@/lib/i18n";
import { normalizeMessageKey } from "@/lib/i18n/auth-errors";

type ApiLikeError = Error & {
  status?: number;
  details?: unknown;
};

function toMegabytesLabel(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  const rounded = Number.isInteger(mb) ? String(mb) : mb.toFixed(1);
  return `${rounded} MB`;
}

function extractDetailsCode(details: unknown): string | undefined {
  if (!details || typeof details !== "object") {
    return undefined;
  }

  const maybeCode = (details as { code?: unknown }).code;
  if (typeof maybeCode !== "string") {
    return undefined;
  }

  const normalized = maybeCode.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
}

function extractDetailsMaxBytes(details: unknown): number | undefined {
  if (!details || typeof details !== "object") {
    return undefined;
  }

  const value = (details as { maxBytes?: unknown }).maxBytes;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function resolveUploadErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const apiError = error as ApiLikeError;
  const detailsCode = extractDetailsCode(apiError.details);
  if (detailsCode) {
    return detailsCode;
  }

  const normalizedMessage = normalizeMessageKey(error.message);
  if (!normalizedMessage) {
    return undefined;
  }

  const aliases: Record<string, string> = {
    ATTACHMENT_IS_TOO_LARGE: "ATENEO_ATTACHMENT_TOO_LARGE",
    PDF_FILE_IS_TOO_LARGE: "FEED_PDF_TOO_LARGE",
    TOO_MANY_ATTACHMENTS: "ATENEO_TOO_MANY_ATTACHMENTS",
    TOO_MANY_PDF_FILES: "FEED_TOO_MANY_PDF_FILES",
    UNSUPPORTED_ATTACHMENT_TYPE: "ATENEO_UNSUPPORTED_ATTACHMENT_TYPE",
    ONLY_PDF_FILES_ARE_ALLOWED: "FEED_ONLY_PDF_ALLOWED",
    UPLOADED_FILE_IS_TOO_LARGE: "UPLOAD_FILE_TOO_LARGE",
    TOO_MANY_FILES_UPLOADED: "UPLOAD_TOO_MANY_FILES",
    UNEXPECTED_UPLOAD_FIELD: "UPLOAD_UNEXPECTED_FIELD"
  };

  return aliases[normalizedMessage] ?? normalizedMessage;
}

export function getAteneoTopicPublishErrorTranslation(error: unknown): string {
  if (error instanceof Error && error.message === "NEXT_PUBLIC_API_BASE_URL is not configured") {
    return i18next.t("common:ateneo.errors.missingApiBaseUrl");
  }

  const code = resolveUploadErrorCode(error);
  const apiError = error instanceof Error ? (error as ApiLikeError) : undefined;
  const maxBytesFromDetails = extractDetailsMaxBytes(apiError?.details);
  const maxBytes = maxBytesFromDetails ?? 10 * 1024 * 1024;
  const maxSizeLabel = toMegabytesLabel(maxBytes);

  if (code === "ATENEO_ATTACHMENT_TOO_LARGE" || code === "FEED_PDF_TOO_LARGE" || code === "UPLOAD_FILE_TOO_LARGE") {
    return i18next.t("common:ateneo.errors.attachmentTooLarge", {
      maxSize: maxSizeLabel,
      defaultValue: `Uno de los archivos supera el tamaño permitido. Máximo: ${maxSizeLabel} por archivo.`
    });
  }

  if (code === "ATENEO_TOO_MANY_ATTACHMENTS" || code === "FEED_TOO_MANY_PDF_FILES" || code === "UPLOAD_TOO_MANY_FILES") {
    return i18next.t("common:ateneo.errors.tooManyAttachments", {
      defaultValue: "Podés adjuntar hasta 5 archivos por tema. Quitá algunos e intentá de nuevo."
    });
  }

  if (code === "ATENEO_UNSUPPORTED_ATTACHMENT_TYPE" || code === "FEED_ONLY_PDF_ALLOWED" || code === "UPLOAD_UNEXPECTED_FIELD") {
    return i18next.t("common:ateneo.errors.unsupportedAttachmentType", {
      defaultValue: "Solo se permiten imágenes JPG/PNG/HEIC/HEIF y archivos PDF."
    });
  }

  if (apiError?.status === 401 || apiError?.status === 403) {
    return i18next.t("common:ateneo.errors.authRequired", {
      defaultValue: "Tu sesión venció o no tenés permisos. Iniciá sesión nuevamente e intentá otra vez."
    });
  }

  if (error instanceof TypeError) {
    return i18next.t("common:ateneo.errors.connectionFailed", {
      defaultValue: "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo."
    });
  }

  return i18next.t("common:ateneo.errors.publishFailed", {
    defaultValue: "No pudimos publicar el tema. Intentá nuevamente en unos segundos."
  });
}