"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type ProfileCollapsibleTextProps = {
  text: string;
  /** Visible lines while collapsed. */
  lines?: number;
  className?: string;
};

/**
 * Clamps long text to `lines` and shows "ver más" only when the text actually overflows
 * (measured against the rendered box, so it adapts to width changes).
 */
export function ProfileCollapsibleText({ text, lines = 3, className = "" }: ProfileCollapsibleTextProps) {
  const { t } = useTranslation("profile");
  const textRef = useRef<HTMLParagraphElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element || isExpanded) {
      return;
    }

    const measure = () => {
      setIsOverflowing(element.scrollHeight > element.clientHeight + 1);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [isExpanded, text, lines]);

  const normalizedText = text.trim();
  if (!normalizedText) {
    return null;
  }

  return (
    <div>
      <p
        ref={textRef}
        className={`whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${className}`}
        style={
          isExpanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: lines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {normalizedText}
      </p>
      {isOverflowing || isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded((current) => !current)}
          aria-expanded={isExpanded}
          className="mt-1 text-scale-2 font-bold text-[var(--brand-700)] hover:text-[var(--brand-900)]"
        >
          {isExpanded ? t("collapsible.less") : t("collapsible.more")}
        </button>
      ) : null}
    </div>
  );
}

type ProfileShowAllToggleProps = {
  hiddenCount: number;
  isShowingAll: boolean;
  onToggle: () => void;
};

/** Toggle for lists collapsed to their first N items. Renders nothing when nothing is hidden. */
export function ProfileShowAllToggle({ hiddenCount, isShowingAll, onToggle }: ProfileShowAllToggleProps) {
  const { t } = useTranslation("profile");

  if (hiddenCount <= 0) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isShowingAll}
      className="mt-2 w-full rounded-lg py-1.5 text-center text-scale-2 font-bold text-[var(--brand-700)] transition hover:bg-[var(--surface-2)] hover:text-[var(--brand-900)]"
    >
      {isShowingAll ? t("collapsible.showLess") : t("collapsible.showAll", { count: hiddenCount })}
    </button>
  );
}
