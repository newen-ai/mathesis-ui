"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVerbumPuzzle, type VerbumPlayStatus } from "@/lib/api/verbum";

const STATUS_KEYS: Record<VerbumPlayStatus, string> = {
  WON: "hub.verbum.statusWon",
  LOST: "hub.verbum.statusLost",
  IN_PROGRESS: "hub.verbum.statusInProgress",
  NOT_STARTED: "hub.verbum.statusNotStarted"
};

export function GamesHub() {
  const { t } = useTranslation("games");
  const [todayStatus, setTodayStatus] = useState<VerbumPlayStatus | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getVerbumPuzzle(null, controller.signal)
      .then((response) => setTodayStatus(response.data.play.status))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-scale-5 font-semibold text-[var(--heading-primary)]">{t("hub.title")}</h1>
        <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">{t("hub.subtitle")}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/games/verbum/"
          className="group flex flex-col rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition-colors hover:border-[var(--brand-500)]"
        >
          <div className="flex items-center gap-1" aria-hidden="true">
            {["V", "E", "R", "B", "U", "M"].map((letter, index) => (
              <span
                key={index}
                className="flex h-9 w-9 items-center justify-center rounded-md font-display text-base font-bold"
                style={{
                  backgroundColor: index % 3 === 0 ? "var(--verbum-correct)" : index % 3 === 1 ? "var(--verbum-present)" : "var(--verbum-absent)",
                  color: "var(--verbum-on-tile)"
                }}
              >
                {letter}
              </span>
            ))}
          </div>
          <h2 className="mt-4 font-display text-scale-4 font-semibold text-[var(--heading-primary)]">{t("hub.verbum.title")}</h2>
          <p className="mt-1 text-scale-2 text-[var(--text-secondary)]">{t("hub.verbum.description")}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--brand-700)]">
              {todayStatus ? t(STATUS_KEYS[todayStatus]) : ""}
            </span>
            <span className="text-scale-2 font-semibold text-[var(--link-accent)] group-hover:underline">{t("hub.play")} →</span>
          </div>
        </Link>

        <div className="flex items-center justify-center rounded-3xl border border-dashed border-[var(--line-strong)] p-5 text-center text-scale-2 text-[var(--text-secondary)]">
          {t("hub.comingSoon")}
        </div>
      </div>
    </div>
  );
}
