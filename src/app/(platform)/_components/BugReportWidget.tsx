"use client";

import Image from "next/image";
import {
  ChangeEvent,
  FormEvent,
  ClipboardEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { submitBugReport } from "@/lib/api/profile";
import { getBugReportErrorTranslation } from "@/lib/i18n/bug-report-errors";
import {
  type BugReportButtonCorner,
  BUG_REPORT_MAX_DESCRIPTION_LENGTH,
  BUG_REPORT_MAX_SCREENSHOTS,
  BUG_REPORT_MAX_TITLE_LENGTH,
  BUG_REPORT_MAX_UPLOAD_SCREENSHOT_BYTES,
  clearBugReportDraft,
  createBugReportScreenshot,
  createEmptyBugReportDraft,
  dataUrlToFile,
  isBugReportFeatureEnabled,
  readBugReportButtonCorner,
  readBugReportDraft,
  saveBugReportButtonCorner,
  saveBugReportDraft,
  type BugReportDraft,
} from "@/lib/utils/bug-report";

const reportingHints = [
  "¿Qué ocurrió exactamente?",
  "¿Qué esperabas que pasara?",
  "¿Cuáles son los pasos para reproducirlo?",
  "Si podés, adjuntá una captura con el error visible.",
];

function getClipboardImageFiles(event: ClipboardEvent<HTMLElement>) {
  return Array.from(event.clipboardData.items)
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

function getCornerFromPointerPosition(
  clientX: number,
  clientY: number
): BugReportButtonCorner {
  if (typeof window === "undefined") {
    return "bottom-right";
  }

  const horizontal = clientX <= window.innerWidth / 2 ? "left" : "right";
  const vertical = clientY <= window.innerHeight / 2 ? "top" : "bottom";
  return `${vertical}-${horizontal}` as BugReportButtonCorner;
}

function getCornerOffsets() {
  if (typeof window === "undefined") {
    return {
      left: 16,
      right: 16,
      top: 80,
      bottom: 64,
    };
  }

  const isDesktop = window.innerWidth >= 768;
  return {
    left: isDesktop ? 24 : 16,
    right: isDesktop ? 24 : 16,
    top: isDesktop ? 96 : 80,
    bottom: isDesktop ? 72 : 64,
  };
}

function getCornerPosition(
  corner: BugReportButtonCorner,
  buttonWidth: number,
  buttonHeight: number
): DragPosition {
  const offsets = getCornerOffsets();
  const maxLeft = Math.max(0, window.innerWidth - buttonWidth);
  const maxTop = Math.max(0, window.innerHeight - buttonHeight);

  const left =
    corner === "top-left" || corner === "bottom-left"
      ? offsets.left
      : window.innerWidth - offsets.right - buttonWidth;
  const top =
    corner === "top-left" || corner === "top-right"
      ? offsets.top
      : window.innerHeight - offsets.bottom - buttonHeight;

  return {
    left: Math.min(Math.max(0, left), maxLeft),
    top: Math.min(Math.max(0, top), maxTop),
  };
}

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  didDrag: boolean;
};

type DragPosition = {
  left: number;
  top: number;
};

const BUTTON_SNAP_DURATION_MS = 280;
const BUG_REPORT_BUTTON_SIZE = 56;

export function BugReportWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const snapTimeoutRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonCorner, setButtonCorner] = useState<BugReportButtonCorner>(() => {
    if (typeof window === "undefined") {
      return "bottom-right";
    }

    return readBugReportButtonCorner();
  });
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const [isSnapAnimating, setIsSnapAnimating] = useState(false);
  const [draft, setDraft] = useState<BugReportDraft>(() => {
    if (typeof window === "undefined") {
      return createEmptyBugReportDraft();
    }

    return readBugReportDraft() ?? createEmptyBugReportDraft(window.location.href);
  });
  const [isAttachingScreenshots, setIsAttachingScreenshots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featureEnabled = isBugReportFeatureEnabled();
  const currentPageUrl =
    typeof window === "undefined"
      ? draft.pageUrl
      : `${window.location.origin}${pathname}${searchParamsKey ? `?${searchParamsKey}` : ""}`;
  const effectiveDraft = useMemo(
    () => ({
      ...draft,
      pageUrl: currentPageUrl,
    }),
    [currentPageUrl, draft]
  );
  const anchoredButtonPosition = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        left: 16,
        top: 80,
      };
    }

    return getCornerPosition(
      buttonCorner,
      BUG_REPORT_BUTTON_SIZE,
      BUG_REPORT_BUTTON_SIZE
    );
  }, [buttonCorner]);
  const floatingButtonStyle = dragPosition
    ? {
        left: `${dragPosition.left}px`,
        top: `${dragPosition.top}px`,
      }
    : {
        left: `${anchoredButtonPosition.left}px`,
        top: `${anchoredButtonPosition.top}px`,
      };

  const titleCount = effectiveDraft.title.trim().length;
  const descriptionCount = effectiveDraft.description.trim().length;
  const canSubmit = useMemo(() => {
    return Boolean(titleCount > 0 && descriptionCount > 0 && effectiveDraft.pageUrl);
  }, [descriptionCount, effectiveDraft.pageUrl, titleCount]);

  if (!featureEnabled) {
    return null;
  }

  const updateDraft = (patch: Partial<BugReportDraft>) => {
    try {
      setDraft((current) => {
        const nextDraft = {
          ...current,
          ...patch,
          pageUrl: currentPageUrl,
        };

        saveBugReportDraft(nextDraft);
        return nextDraft;
      });
      setError(null);
    } catch {
      setError("No pudimos guardar este borrador en el navegador.");
    }
  };

  const appendScreenshots = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = BUG_REPORT_MAX_SCREENSHOTS - effectiveDraft.screenshots.length;
    if (remainingSlots <= 0) {
      setError(`Solo podés adjuntar hasta ${BUG_REPORT_MAX_SCREENSHOTS} capturas.`);
      return;
    }

    setIsAttachingScreenshots(true);
    setError(null);

    try {
      const nextScreenshots = await Promise.all(
        selectedFiles.slice(0, remainingSlots).map((file) => createBugReportScreenshot(file))
      );

      setDraft((current) => {
        const nextDraft = {
          ...current,
          pageUrl: currentPageUrl,
          screenshots: [...current.screenshots, ...nextScreenshots],
        };

        saveBugReportDraft(nextDraft);
        return nextDraft;
      });

      if (selectedFiles.length > remainingSlots) {
        toast.warning(`Solo se agregaron ${remainingSlots} capturas.`);
      }
    } catch (attachError) {
      setError(
        attachError instanceof Error
          ? attachError.message
          : "No pudimos adjuntar esas capturas."
      );
    } finally {
      setIsAttachingScreenshots(false);
    }
  };

  const handleScreenshotSelection = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    await appendScreenshots(selectedFiles);
  };

  const handlePaste = async (event: ClipboardEvent<HTMLElement>) => {
    const clipboardImages = getClipboardImageFiles(event);
    if (clipboardImages.length === 0) {
      return;
    }

    event.preventDefault();
    await appendScreenshots(clipboardImages);
  };

  const handleRemoveScreenshot = (screenshotId: string) => {
    try {
      setDraft((current) => {
        const nextDraft = {
          ...current,
          pageUrl: currentPageUrl,
          screenshots: current.screenshots.filter((item) => item.id !== screenshotId),
        };

        saveBugReportDraft(nextDraft);
        return nextDraft;
      });
    } catch {
      setError("No pudimos actualizar el borrador en el navegador.");
    }
  };

  const handleClear = () => {
    const nextDraft = createEmptyBugReportDraft(currentPageUrl);
    setDraft(nextDraft);
    clearBugReportDraft();
    setError(null);
    toast.success("Borrador limpiado.");
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
  };

  const clearSnapTimeout = () => {
    if (snapTimeoutRef.current !== null) {
      window.clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = null;
    }
  };

  const handleButtonPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    clearSnapTimeout();
    setIsSnapAnimating(false);
    const rect = event.currentTarget.getBoundingClientRect();
    setDragPosition({
      left: rect.left,
      top: rect.top,
    });
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      didDrag: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleButtonPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (!dragState.didDrag && Math.hypot(deltaX, deltaY) >= 8) {
      dragState.didDrag = true;
    }

    if (!dragState.didDrag) {
      return;
    }

    const buttonElement = buttonRef.current;
    const buttonWidth = buttonElement?.offsetWidth ?? 56;
    const buttonHeight = buttonElement?.offsetHeight ?? 56;
    const maxLeft = Math.max(0, window.innerWidth - buttonWidth);
    const maxTop = Math.max(0, window.innerHeight - buttonHeight);
    const nextLeft = Math.min(Math.max(0, event.clientX - dragState.offsetX), maxLeft);
    const nextTop = Math.min(Math.max(0, event.clientY - dragState.offsetY), maxTop);

    setDragPosition({
      left: nextLeft,
      top: nextTop,
    });
  };

  const finalizeButtonDrag = (pointerId: number) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== pointerId) {
      return;
    }

    if (dragState.didDrag) {
      suppressClickRef.current = true;
      const buttonElement = buttonRef.current;
      const rect = buttonElement?.getBoundingClientRect();
      const nextCorner = rect
        ? getCornerFromPointerPosition(rect.left + rect.width / 2, rect.top + rect.height / 2)
        : buttonCorner;
      const targetPosition = getCornerPosition(
        nextCorner,
        buttonElement?.offsetWidth ?? 56,
        buttonElement?.offsetHeight ?? 56
      );

      setButtonCorner(nextCorner);
      saveBugReportButtonCorner(nextCorner);
      setIsSnapAnimating(true);
      setDragPosition(targetPosition);
      clearSnapTimeout();
      snapTimeoutRef.current = window.setTimeout(() => {
        setDragPosition(null);
        setIsSnapAnimating(false);
        snapTimeoutRef.current = null;
      }, BUTTON_SNAP_DURATION_MS);
    }

    dragStateRef.current = null;
  };

  const handleButtonPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    finalizeButtonDrag(event.pointerId);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleButtonPointerCancel = (event: React.PointerEvent<HTMLButtonElement>) => {
    finalizeButtonDrag(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleButtonClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setIsOpen((current) => !current);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft.title.trim()) {
      setError("El título es obligatorio.");
      return;
    }

    if (!draft.description.trim()) {
      setError("La descripción es obligatoria.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const screenshots = effectiveDraft.screenshots.map((screenshot) =>
        dataUrlToFile(screenshot.dataUrl, screenshot.name, screenshot.mimeType)
      );

      const oversizedScreenshot = screenshots.find(
        (screenshot) => screenshot.size > BUG_REPORT_MAX_UPLOAD_SCREENSHOT_BYTES
      );

      if (oversizedScreenshot) {
        setError(`La captura ${oversizedScreenshot.name} supera el tamaño permitido para enviarla.`);
        setIsSubmitting(false);
        return;
      }

      const response = await submitBugReport({
        title: effectiveDraft.title.trim(),
        description: effectiveDraft.description.trim(),
        pageUrl: effectiveDraft.pageUrl,
        screenshots,
      });

      if (!response.success) {
        setError(getBugReportErrorTranslation(response.message));
        return;
      }

      clearBugReportDraft();
      setDraft(createEmptyBugReportDraft(currentPageUrl));
      setIsOpen(false);
      toast.success("Reporte enviado. Gracias por avisarnos.");
    } catch {
      setError("No pudimos preparar el reporte para enviarlo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[88] flex items-center justify-center bg-[color-mix(in_srgb,var(--navy-900)_48%,transparent)] px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleClose();
            }
          }}
        >
          <section
            className="relative z-[89] w-full max-w-3xl rounded-[1.75rem] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_24px_70px_color-mix(in_srgb,var(--navy-900)_28%,transparent)] md:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bug-report-title"
            onPaste={(event) => {
              void handlePaste(event);
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-scale-1 font-semibold uppercase tracking-[0.18em] text-[var(--brand-700)]">
                  Reportar bug
                </p>
                <h2
                  id="bug-report-title"
                  className="mt-1 font-[family-name:var(--font-spectral)] text-scale-5 font-semibold mathesis-heading-primary"
                >
                  Contanos qué falló
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface-2)] text-lg text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <p className="mt-3 text-scale-2 text-[var(--text-secondary)]">
              Guardamos este borrador automáticamente en tu navegador para que puedas cerrar,
              sacar una captura y volver sin perderlo.
            </p>

            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
              <p className="text-scale-1 font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Sugerencias
              </p>
              <ul className="mt-2 space-y-1.5 text-scale-2 text-[var(--text-secondary)]">
                {reportingHints.map((hint) => (
                  <li key={hint}>{hint}</li>
                ))}
              </ul>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <label className="mathesis-field">
                <span>Título</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    updateDraft({ title: event.target.value.slice(0, BUG_REPORT_MAX_TITLE_LENGTH) })
                  }
                  placeholder="Ej: El botón de guardar no responde"
                />
                <span className="text-scale-1 text-[var(--text-soft)]">
                  {effectiveDraft.title.length}/{BUG_REPORT_MAX_TITLE_LENGTH}
                </span>
              </label>

              <label className="mathesis-field">
                <span>Descripción</span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    updateDraft({
                      description: event.target.value.slice(0, BUG_REPORT_MAX_DESCRIPTION_LENGTH),
                    })
                  }
                  rows={6}
                  placeholder="Contanos qué hiciste, qué esperabas y qué terminó pasando."
                />
                <span className="text-scale-1 text-[var(--text-soft)]">
                  {effectiveDraft.description.length}/{BUG_REPORT_MAX_DESCRIPTION_LENGTH}
                </span>
              </label>

              <div className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-scale-2 font-semibold text-[var(--text-primary)]">
                      Capturas
                    </p>
                    <p className="text-scale-1 text-[var(--text-secondary)]">
                      Hasta {BUG_REPORT_MAX_SCREENSHOTS} imágenes. El borrador se guarda localmente y se envía al backend cuando confirmás.
                    </p>
                    <p className="mt-1 text-scale-1 text-[var(--text-soft)]">
                      También podés pegar una captura con Ctrl+V o Cmd+V.
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-scale-2 font-semibold text-[var(--text-primary)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-muted)]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleScreenshotSelection}
                    />
                    {isAttachingScreenshots ? "Procesando..." : "Adjuntar"}
                  </label>
                </div>

                {effectiveDraft.screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {effectiveDraft.screenshots.map((screenshot) => (
                      <figure
                        key={screenshot.id}
                        className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]"
                      >
                        <Image
                          src={screenshot.dataUrl}
                          alt={screenshot.name}
                          width={320}
                          height={220}
                          unoptimized
                          className="h-28 w-full object-cover"
                        />
                        <figcaption className="flex items-center justify-between gap-2 px-2.5 py-2 text-scale-1 text-[var(--text-secondary)]">
                          <span className="truncate">{screenshot.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveScreenshot(screenshot.id)}
                            className="text-[var(--danger-500)] transition hover:brightness-90"
                            aria-label={`Quitar ${screenshot.name}`}
                          >
                            Quitar
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-3 py-5 text-center text-scale-1 text-[var(--text-soft)]">
                    Pegá una captura desde el portapapeles o elegí imágenes desde tu equipo.
                  </p>
                )}
              </div>

              {error ? (
                <p className="rounded-xl border border-[color-mix(in_srgb,var(--danger-500)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger-500)_10%,var(--surface))] px-3 py-2 text-scale-1 font-medium text-[var(--danger-500)]">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="rounded-full border border-[var(--line)] px-4 py-2 text-scale-2 font-semibold text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-scale-2 font-semibold text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                  >
                    Cancelar
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="rounded-full bg-[var(--brand-500)] px-4 py-2 text-scale-2 font-semibold mathesis-on-brand transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Guardando..." : "Enviar reporte"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <div
        className={
          dragPosition
            ? `fixed z-[90] ${isSnapAnimating ? "transition-[left,top] duration-300 ease-out" : ""}`
            : "fixed z-[90]"
        }
        style={floatingButtonStyle}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleButtonClick}
          onPointerDown={handleButtonPointerDown}
          onPointerMove={handleButtonPointerMove}
          onPointerUp={handleButtonPointerUp}
          onPointerCancel={handleButtonPointerCancel}
          className="relative z-[92] inline-flex h-14 w-14 cursor-grab items-center justify-center rounded-full border border-[var(--brand-300)] bg-[var(--brand-500)] shadow-[0_14px_30px_color-mix(in_srgb,var(--brand-700)_30%,transparent)] transition hover:translate-y-[-1px] hover:brightness-95 active:cursor-grabbing"
          aria-label={isOpen ? "Cerrar reportar bug" : "Abrir reportar bug"}
          title="Reportar bug"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 mathesis-on-brand"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 7.2v5.7" />
            <path d="M12 16.8h.01" />
            <path d="M10 3.9 3.9 14.4a1.7 1.7 0 0 0 1.48 2.55h13.24a1.7 1.7 0 0 0 1.48-2.55L14 3.9a2.3 2.3 0 0 0-4 0Z" />
          </svg>
        </button>
      </div>
    </>
  );
}