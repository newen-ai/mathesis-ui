"use client";

import { formatFileSize } from "@/lib/utils/pdf-preview";

type PdfAttachmentCardProps = {
  fileName: string;
  sizeBytes: number;
  /** Shown as "N págs" when known (local files only). */
  pageCount?: number | null;
  /** First-page thumbnail; when missing the PDF icon is shown. */
  thumbnailUrl?: string | null;
  isLoadingThumbnail?: boolean;
  /** Renders the card as a link (published attachments). */
  href?: string;
  /** Renders the card as a button (local files). Ignored when `href` is set. */
  onOpen?: () => void;
  openLabel: string;
  pagesLabel?: (count: number) => string;
  onRemove?: () => void;
  removeLabel?: string;
};

function PdfIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" aria-hidden="true" className={className}>
      <path d="M6 1h20l13 13v29a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V5a4 4 0 0 1 4-4Z" fill="var(--surface)" stroke="var(--line)" strokeWidth="2" />
      <path d="M26 1v9a4 4 0 0 0 4 4h9" fill="none" stroke="var(--line)" strokeWidth="2" />
      <rect x="0" y="27" width="30" height="13" rx="3" fill="#d93025" />
      <text x="15" y="36.6" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#ffffff" fontFamily="system-ui, sans-serif">
        PDF
      </text>
    </svg>
  );
}

/** Attachment card for PDFs: thumbnail or icon, name, size/pages and an open action. */
export function PdfAttachmentCard({
  fileName,
  sizeBytes,
  pageCount,
  thumbnailUrl,
  isLoadingThumbnail = false,
  href,
  onOpen,
  openLabel,
  pagesLabel,
  onRemove,
  removeLabel,
}: PdfAttachmentCardProps) {
  const meta = [pageCount && pagesLabel ? pagesLabel(pageCount) : null, formatFileSize(sizeBytes)].filter(Boolean).join(" · ");

  const body = (
    <>
      <span className="relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)]">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL, nothing to optimize
          <img src={thumbnailUrl} alt="" className="h-full w-full object-cover object-top" />
        ) : (
          <PdfIcon className={["h-10 w-9", isLoadingThumbnail ? "animate-pulse" : ""].join(" ")} />
        )}
        {thumbnailUrl ? (
          <span aria-hidden="true" className="absolute bottom-0.5 left-0.5 rounded-[3px] bg-[#d93025] px-1 text-[0.5rem] font-bold leading-[0.85rem] text-white">PDF</span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-scale-2 font-semibold text-[var(--text-primary)]">{fileName}</span>
        <span className="mt-0.5 block text-scale-1 text-[var(--text-secondary)]">{meta}</span>
        <span className="mt-1 block text-scale-1 font-semibold text-[var(--brand-700)]">{openLabel}</span>
      </span>
    </>
  );

  const bodyClassName = "flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 pr-3 text-left transition hover:bg-[var(--surface-2)]";

  return (
    <div className="flex w-full items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] sm:max-w-sm">
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className={bodyClassName}>
          {body}
        </a>
      ) : (
        <button type="button" onClick={onOpen} className={bodyClassName}>
          {body}
        </button>
      )}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
