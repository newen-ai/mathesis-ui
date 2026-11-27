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
  CONTACT_EMAIL_IS_REQUIRED: "common:bugReport.errors.contactEmailRequired",
  ONLY_UP_TO_1_SCREENSHOT_FILES_ARE_ALLOWED: "common:bugReport.errors.tooManyScreenshots",
  ONLY_UP_TO_3_SCREENSHOT_FILES_ARE_ALLOWED: "common:bugReport.errors.tooManyScreenshots",
  COMPLETE_THE_VERIFICATION_TO_CONTINUE: "common:bugReport.errors.captchaRequired",
  THE_VERIFICATION_FAILED_TRY_AGAIN: "common:bugReport.errors.captchaFailed",
  VERIFICATION_IS_UNAVAILABLE_TRY_AGAIN_IN_A_MOMENT: "common:bugReport.errors.captchaFailed",
  TOO_MANY_ATTEMPTS_PLEASE_TRY_AGAIN_LATER: "common:bugReport.errors.rateLimited",
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