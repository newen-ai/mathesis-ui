import i18next from "@/lib/i18n";
import { normalizeMessageKey } from "@/lib/i18n/auth-errors";

export const bugReportErrorCodeToKey: Record<string, string> = {
  VALIDATION_FAILED: "common:bugReport.errors.validationFailed",
  COULD_NOT_CONNECT_TO_BUG_REPORT_SERVICE:
    "common:bugReport.errors.connectionFailed",
  NEXT_PUBLIC_API_BASE_URL_IS_NOT_CONFIGURED:
    "common:bugReport.errors.missingApiBaseUrl",
  BUG_REPORT_IMAGE_IS_TOO_LARGE: "common:bugReport.errors.imageTooLarge",
  ONLY_IMAGE_ATTACHMENTS_ARE_ALLOWED_FOR_BUG_REPORTS:
    "common:bugReport.errors.imagesOnly",
};

export function getBugReportErrorTranslation(
  message?: string,
  fallback = "No pudimos enviar el reporte en este momento."
): string {
  if (!message) {
    return i18next.t("common:bugReport.errors.default", { defaultValue: fallback });
  }

  const normalizedKey = normalizeMessageKey(message);
  if (normalizedKey && bugReportErrorCodeToKey[normalizedKey]) {
    return i18next.t(bugReportErrorCodeToKey[normalizedKey], {
      defaultValue: fallback,
    });
  }

  return i18next.t("common:bugReport.errors.default", { defaultValue: message || fallback });
}