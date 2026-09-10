"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, type TouchEvent } from "react";

type CarouselImage = {
  src: string;
  alt: string;
  caption: string;
};

type AteneoImageCarouselModalProps = {
  images: CarouselImage[];
  activeIndex: number | null;
  onClose: () => void;
  onChangeIndex: (nextIndex: number | null) => void;
};

export function AteneoImageCarouselModal({
  images,
  activeIndex,
  onClose,
  onChangeIndex,
}: AteneoImageCarouselModalProps) {
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const normalizedIndex = useMemo(() => {
    if (activeIndex === null || images.length === 0) {
      return null;
    }

    return Math.min(activeIndex, images.length - 1);
  }, [activeIndex, images.length]);

  const activeImage = normalizedIndex !== null ? images[normalizedIndex] : null;
  const isOpen = Boolean(activeImage);
  const hasCarousel = images.length > 1;

  useEffect(() => {
    if (!isOpen) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.setProperty("overflow", "hidden");

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (!hasCarousel || normalizedIndex === null) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onChangeIndex((normalizedIndex + 1) % images.length);
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onChangeIndex((normalizedIndex - 1 + images.length) % images.length);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [hasCarousel, images.length, isOpen, normalizedIndex, onChangeIndex, onClose]);

  const showNext = () => {
    if (!hasCarousel || normalizedIndex === null) {
      return;
    }

    onChangeIndex((normalizedIndex + 1) % images.length);
  };

  const showPrevious = () => {
    if (!hasCarousel || normalizedIndex === null) {
      return;
    }

    onChangeIndex((normalizedIndex - 1 + images.length) % images.length);
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasCarousel) {
      return;
    }

    const touch = event.changedTouches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!hasCarousel) {
      return;
    }

    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    if (startX === null || startY === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      showNext();
      return;
    }

    showPrevious();
  };

  if (!isOpen || !activeImage) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center px-3 sm:px-6">
      <button
        type="button"
        aria-label="Cerrar vista previa"
        className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--navy-900)_72%,transparent)]"
        onClick={onClose}
      />

      <section className="relative z-[151] w-full max-w-5xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[0_24px_60px_color-mix(in_srgb,var(--navy-900)_40%,transparent)] sm:p-4">
        <div className="flex items-center justify-between gap-3 pb-3">
          <p className="min-w-0 truncate text-scale-2 font-semibold text-[var(--heading-primary)]">
            {activeImage.caption}
          </p>
          <div className="flex items-center gap-2">
            {hasCarousel ? (
              <p className="text-scale-1 text-[var(--text-secondary)]">
                {normalizedIndex !== null ? normalizedIndex + 1 : 1}/{images.length}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--text-secondary)]"
              aria-label="Cerrar vista previa"
            >
              ×
            </button>
          </div>
        </div>

        <div
          className="relative flex min-h-[220px] items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,var(--navy-900)_72%,var(--surface-2))] p-2 sm:min-h-[320px] sm:p-3"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            width={1600}
            height={1200}
            unoptimized
            className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
          />

          {hasCarousel ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] text-xl text-[var(--text-primary)] backdrop-blur sm:left-3"
                aria-label="Imagen anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[color:color-mix(in_srgb,var(--surface)_82%,transparent)] text-xl text-[var(--text-primary)] backdrop-blur sm:right-3"
                aria-label="Imagen siguiente"
              >
                ›
              </button>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
