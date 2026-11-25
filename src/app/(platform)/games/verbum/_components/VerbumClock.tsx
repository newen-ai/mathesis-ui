"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatVerbumDuration } from "@/lib/utils/verbum";

// Game clock. The backend sends the elapsed time with every state (it measures from opening the puzzle);
// while the game runs, the clock keeps counting locally from that value. Remount it (key) on each new state.
export function VerbumClock({ elapsedMs, running }: { elapsedMs: number; running: boolean }) {
  const { t } = useTranslation("games");
  const [startedAt] = useState(() => Date.now() - elapsedMs);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  const shownMs = running ? now - startedAt : elapsedMs;

  return (
    <span className="inline-flex items-center gap-1 font-mono tabular-nums" title={t("verbum.time.label")} aria-label={t("verbum.time.aria", { time: formatVerbumDuration(shownMs) })}>
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M10 2h4" />
      </svg>
      {formatVerbumDuration(shownMs)}
    </span>
  );
}
