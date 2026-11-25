"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getVerbumCalendar, getVerbumStats, type VerbumLetterState, type VerbumPlayStatus } from "@/lib/api/verbum";
import { isVerbumDateKey, verbumPuzzlePath } from "@/lib/utils/verbum";
import { verbumStateColor } from "./VerbumTiles";
import { useVerbumRequest } from "./useVerbumRequest";

function ExampleRow({ word, highlight, state }: { word: string; highlight: number; state: VerbumLetterState }) {
  return (
    <div className="flex gap-1">
      {Array.from(word).map((letter, index) => (
        <span
          key={index}
          className="flex h-9 w-9 items-center justify-center rounded-md border-2 font-display text-base font-bold"
          style={
            index === highlight
              ? { backgroundColor: verbumStateColor(state), borderColor: verbumStateColor(state), color: "var(--verbum-on-tile)" }
              : { borderColor: "var(--line-strong)", color: "var(--text-primary)" }
          }
        >
          {letter}
        </span>
      ))}
    </div>
  );
}

export function VerbumHelpContent() {
  const { t } = useTranslation("games");

  return (
    <div className="space-y-4 text-scale-2 text-[var(--text-primary)]">
      <p>{t("verbum.help.intro")}</p>
      <div className="space-y-1.5">
        <ExampleRow word="ROBOT" highlight={0} state="CORRECT" />
        <p className="text-[var(--text-secondary)]">{t("verbum.help.correct")}</p>
      </div>
      <div className="space-y-1.5">
        <ExampleRow word="DATOS" highlight={2} state="PRESENT" />
        <p className="text-[var(--text-secondary)]">{t("verbum.help.present")}</p>
      </div>
      <div className="space-y-1.5">
        <ExampleRow word="LÓGICA" highlight={4} state="ABSENT" />
        <p className="text-[var(--text-secondary)]">{t("verbum.help.absent")}</p>
      </div>
      <p>{t("verbum.help.accents")}</p>
      <p className="border-t border-[var(--line)] pt-3 text-[var(--text-secondary)]">{t("verbum.help.daily")}</p>
    </div>
  );
}

export function VerbumStatsContent({ highlightAttempts }: { highlightAttempts: number | null }) {
  const { t } = useTranslation("games");
  const { data: stats, errorCode } = useVerbumRequest("stats", async (signal) => (await getVerbumStats(signal)).data.stats);

  if (errorCode) {
    return <p className="text-scale-2 text-[var(--danger-500)]">{t("verbum.stats.load")}</p>;
  }

  if (!stats) {
    return <p className="text-scale-2 text-[var(--text-secondary)]">{t("verbum.loading")}</p>;
  }

  const maxBar = Math.max(1, ...stats.distribution);
  const figures = [
    { label: t("verbum.stats.played"), value: stats.played },
    { label: t("verbum.stats.winRate"), value: stats.winRate },
    { label: t("verbum.stats.currentStreak"), value: stats.currentStreak },
    { label: t("verbum.stats.maxStreak"), value: stats.maxStreak }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 text-center">
        {figures.map((figure) => (
          <div key={figure.label}>
            <p className="font-display text-[1.75rem] font-semibold leading-none text-[var(--heading-primary)]">{figure.value}</p>
            <p className="mt-1 text-[0.7rem] leading-tight text-[var(--text-secondary)]">{figure.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-scale-2 font-semibold text-[var(--heading-primary)]">{t("verbum.stats.distribution")}</h3>
        <div className="space-y-1">
          {stats.distribution.map((count, index) => {
            const isHighlighted = highlightAttempts === index + 1;
            return (
              <div key={index} className="flex items-center gap-2 text-scale-2">
                <span className="w-3 text-right font-semibold text-[var(--text-secondary)]">{index + 1}</span>
                <div className="flex-1">
                  <div
                    className="flex h-6 min-w-[1.75rem] items-center justify-end rounded px-2 text-xs font-semibold"
                    style={{
                      width: `${Math.max(8, (count / maxBar) * 100)}%`,
                      backgroundColor: isHighlighted ? "var(--verbum-correct)" : "var(--verbum-absent)",
                      color: "var(--verbum-on-tile)"
                    }}
                  >
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">{t("verbum.stats.streakNote")}</p>
    </div>
  );
}

type MonthKey = { year: number; month: number };

function monthOf(dateKey: string): MonthKey {
  const [year, month] = dateKey.split("-").map(Number);
  return { year, month };
}

function compareMonths(a: MonthKey, b: MonthKey): number {
  return a.year === b.year ? a.month - b.month : a.year - b.year;
}

function shiftMonth(value: MonthKey, delta: number): MonthKey {
  const index = value.year * 12 + (value.month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function dateKeyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Days outside the playable range (before launch, after today) have no status.
function dayStyle(status: VerbumPlayStatus | undefined) {
  if (!status) {
    return { className: "text-[var(--text-soft)] opacity-50", style: undefined };
  }

  switch (status) {
    case "WON":
      return { className: "font-semibold", style: { backgroundColor: "var(--verbum-correct)", color: "var(--verbum-on-tile)" } };
    case "LOST":
      return { className: "font-semibold", style: { backgroundColor: "var(--verbum-absent)", color: "var(--verbum-on-tile)" } };
    case "IN_PROGRESS":
      return { className: "font-semibold border-2", style: { borderColor: "var(--verbum-present)", color: "var(--text-primary)" } };
    default:
      return { className: "bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)]", style: undefined };
  }
}

export function VerbumCalendarContent({ currentDate, onNavigate }: { currentDate: string; onNavigate: () => void }) {
  const { t, i18n } = useTranslation("games");
  const { data: calendar, errorCode } = useVerbumRequest("calendar", async (signal) => (await getVerbumCalendar(signal)).data);
  const [chosenMonth, setChosenMonth] = useState<MonthKey | null>(() =>
    isVerbumDateKey(currentDate) ? monthOf(currentDate) : null
  );

  const dayByDate = useMemo(
    () => new Map((calendar?.days ?? []).map((day) => [day.date, day])),
    [calendar]
  );

  if (errorCode) {
    return <p className="text-scale-2 text-[var(--danger-500)]">{t("verbum.calendar.load")}</p>;
  }

  if (!calendar) {
    return <p className="text-scale-2 text-[var(--text-secondary)]">{t("verbum.loading")}</p>;
  }

  const visibleMonth = chosenMonth ?? monthOf(calendar.today);
  const setVisibleMonth = (update: (month: MonthKey) => MonthKey) => setChosenMonth(update(visibleMonth));
  const firstMonth = monthOf(calendar.launchDate);
  const lastMonth = monthOf(calendar.today);
  const daysInMonth = new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 0)).getUTCDate();
  // Monday-first grid: getUTCDay() is 0 for Sunday.
  const leadingBlanks = (new Date(Date.UTC(visibleMonth.year, visibleMonth.month - 1, 1)).getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(visibleMonth.year, visibleMonth.month - 1, 1))
  );
  const weekdays = t("verbum.calendar.weekdays").split(",");
  const canGoBack = compareMonths(visibleMonth, firstMonth) > 0;
  const canGoForward = compareMonths(visibleMonth, lastMonth) < 0;

  const legend: Array<{ label: string; status: VerbumPlayStatus }> = [
    { label: t("verbum.calendar.won"), status: "WON" },
    { label: t("verbum.calendar.lost"), status: "LOST" },
    { label: t("verbum.calendar.inProgress"), status: "IN_PROGRESS" },
    { label: t("verbum.calendar.notStarted"), status: "NOT_STARTED" }
  ];

  return (
    <div className="space-y-4">
      <p className="text-scale-2 text-[var(--text-secondary)]">{t("verbum.calendar.subtitle")}</p>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
          aria-label={t("verbum.calendar.previousMonth")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-30"
        >
          ‹
        </button>
        <span className="text-scale-3 font-semibold capitalize text-[var(--heading-primary)]">{monthLabel}</span>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
          aria-label={t("verbum.calendar.nextMonth")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-2)] disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-scale-2">
        {weekdays.map((weekday, index) => (
          <span key={index} className="pb-1 text-xs font-semibold text-[var(--text-soft)]">
            {weekday}
          </span>
        ))}
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const dateKey = dateKeyOf(visibleMonth.year, visibleMonth.month, index + 1);
          const day = dayByDate.get(dateKey);
          const { className, style } = dayStyle(day?.status);
          const isCurrent = dateKey === currentDate;
          const cellClass = `flex aspect-square items-center justify-center rounded-lg ${className} ${
            isCurrent ? "ring-2 ring-[var(--brand-500)] ring-offset-1 ring-offset-[var(--surface)]" : ""
          }`;

          if (!day) {
            return (
              <span key={dateKey} className={cellClass}>
                {index + 1}
              </span>
            );
          }

          return (
            <Link key={dateKey} href={verbumPuzzlePath(dateKey, calendar.today)} onClick={onNavigate} className={cellClass} style={style} title={`#${day.number}`}>
              {index + 1}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[var(--line)] pt-3 text-xs text-[var(--text-secondary)]">
        {legend.map((item) => {
          const { className, style } = dayStyle(item.status);
          return (
            <span key={item.status} className="flex items-center gap-1.5">
              <span className={`inline-block h-3.5 w-3.5 rounded ${className}`} style={style} />
              {item.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
