"use client";

import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  CONTENT_REPORT_DETAILS_MAX_LENGTH,
  CONTENT_REPORT_REASONS,
  createContentReport,
  type ContentReportReason,
  type ContentReportTargetType
} from "@/lib/api/report";

export type ReportTarget = {
  type: ContentReportTargetType;
  id: string;
};

type ReportDialogProps = {
  // The dialog is open while a target is set.
  target: ReportTarget | null;
  onClose: () => void;
};

const TITLE_KEYS: Record<ContentReportTargetType, string> = {
  PROFILE: "common:report.title.profile",
  FEED_POST: "common:report.title.feedPost",
  ATENEO_TOPIC: "common:report.title.ateneoTopic",
  ATENEO_COMMENT: "common:report.title.ateneoComment"
};

export function ReportDialog({ target, onClose }: ReportDialogProps) {
  if (!target) {
    return null;
  }

  // Keyed by target so each report starts with an empty form.
  return <ReportDialogContent key={`${target.type}:${target.id}`} target={target} onClose={onClose} />;
}

function ReportDialogContent({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const { t } = useTranslation();
  const idPrefix = useId();
  const [reason, setReason] = useState<ContentReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsRequired, setShowDetailsRequired] = useState(false);

  const detailsRequired = reason === "OTHER";
  const canSubmit = reason !== null && !isSubmitting;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!reason || isSubmitting) {
      return;
    }
    if (detailsRequired && details.trim().length === 0) {
      setShowDetailsRequired(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createContentReport({ targetType: target.type, targetId: target.id, reason, details });
      if (response.data.alreadyReported) {
        toast.info(t("common:report.toasts.alreadyReported"));
      } else {
        toast.success(t("common:report.toasts.sent"));
      }
      onClose();
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 404) {
        toast.error(t("common:report.toasts.notFound"));
        onClose();
        return;
      }
      toast.error(status === 429 ? t("common:report.toasts.rateLimited") : t("common:report.toasts.error"));
      setIsSubmitting(false);
    }
  };

  const titleId = `${idPrefix}-title`;
  const reasonId = `${idPrefix}-reason`;
  const detailsId = `${idPrefix}-details`;
  const detailsErrorId = `${idPrefix}-details-error`;
  const hasDetailsError = showDetailsRequired && detailsRequired && details.trim().length === 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-3"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6"
      >
        <h3 id={titleId} className="font-display text-scale-4 font-semibold text-[var(--heading-primary)]">
          {t(TITLE_KEYS[target.type])}
        </h3>
        <p className="mt-2 text-scale-3 leading-relaxed text-[var(--text-secondary)]">{t("common:report.description")}</p>

        <label className="mt-4 block text-scale-2 font-semibold text-[var(--text-primary)]" htmlFor={reasonId}>
          {t("common:report.reasonLabel")}
        </label>
        <select
          id={reasonId}
          value={reason ?? ""}
          onChange={(event) => setReason(event.target.value ? (event.target.value as ContentReportReason) : null)}
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2.5 text-scale-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--brand-700)]"
        >
          <option value="" disabled>
            {t("common:report.reasonPlaceholder")}
          </option>
          {CONTENT_REPORT_REASONS.map((value) => (
            <option key={value} value={value}>
              {t(`common:report.reasons.${value}`)}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-scale-2 font-semibold text-[var(--text-primary)]" htmlFor={detailsId}>
          {detailsRequired ? t("common:report.detailsLabelRequired") : t("common:report.detailsLabel")}
        </label>
        <textarea
          id={detailsId}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          maxLength={CONTENT_REPORT_DETAILS_MAX_LENGTH}
          rows={4}
          disabled={isSubmitting}
          placeholder={t("common:report.detailsPlaceholder")}
          aria-invalid={hasDetailsError || undefined}
          aria-describedby={hasDetailsError ? detailsErrorId : undefined}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-scale-3 text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-secondary)]"
        />
        <div className="mt-1 flex items-start justify-between gap-3">
          <p id={detailsErrorId} className="text-scale-1 text-[var(--danger-500)]">
            {hasDetailsError ? t("common:report.detailsRequired") : null}
          </p>
          <p className="shrink-0 text-scale-1 text-[var(--text-secondary)]">
            {details.length}/{CONTENT_REPORT_DETAILS_MAX_LENGTH}
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-xl border border-[var(--line)] px-4 py-2 text-scale-2 font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t("common:report.cancel")}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={!canSubmit}
            className="inline-flex items-center rounded-xl bg-[var(--danger-500)] px-4 py-2 text-scale-2 font-semibold text-[var(--surface)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("common:report.submitting") : t("common:report.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
