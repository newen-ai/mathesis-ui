"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { VerbumEvaluatedLetter, VerbumLetterState } from "@/lib/api/verbum";

export const VERBUM_FLIP_STEP_MS = 300;
export const VERBUM_FLIP_DURATION_MS = 500;
// Stagger between tiles of the win bounce.
const VERBUM_WIN_STEP_MS = 90;

export function verbumStateColor(state: VerbumLetterState): string {
  switch (state) {
    case "CORRECT":
      return "var(--verbum-correct)";
    case "PRESENT":
      return "var(--verbum-present)";
    default:
      return "var(--verbum-absent)";
  }
}

// The win bounce runs after the reveal: one stagger per tile plus the bounce itself (verbum-tile-win, 0.6s).
export function verbumWinBounceDurationMs(length: number): number {
  return (length - 1) * VERBUM_WIN_STEP_MS + 600;
}

export function verbumRevealDurationMs(length: number): number {
  return (length - 1) * VERBUM_FLIP_STEP_MS + VERBUM_FLIP_DURATION_MS;
}

type VerbumBoardProps = {
  length: number;
  maxAttempts: number;
  guesses: Array<{ word: string; letters: VerbumEvaluatedLetter[] }>;
  // Letters of the row being typed ("" for empty tiles) and the selected tile.
  slots: string[];
  cursor: number;
  // Set while the player can edit the row: tiles become buttons that select themselves.
  onSelectTile?: (index: number) => void;
  revealRow: number | null;
  winRow: number | null;
  shakeKey: number;
};

const tileBase =
  "flex aspect-square items-center justify-center rounded-lg border-2 font-display font-bold uppercase leading-none select-none text-[clamp(1.05rem,5.2vw,1.85rem)]";

export function VerbumBoard({ length, maxAttempts, guesses, slots, cursor, onSelectTile, revealRow, winRow, shakeKey }: VerbumBoardProps) {
  const { t } = useTranslation("games");

  return (
    <div
      className="mx-auto grid w-full gap-1.5"
      style={{ maxWidth: `${length * 3.6}rem` }}
      role="grid"
      aria-label={t("verbum.a11y.board")}
    >
      {Array.from({ length: maxAttempts }, (_, rowIndex) => {
        const guess = guesses[rowIndex];
        const isCurrentRow = rowIndex === guesses.length;

        return (
          <div
            key={isCurrentRow ? `current-${shakeKey}` : `row-${rowIndex}`}
            role="row"
            className={`grid gap-1.5 ${isCurrentRow && shakeKey > 0 ? "verbum-row-shake" : ""}`}
            style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }}
          >
            {Array.from({ length }, (_, columnIndex) => {
              if (guess) {
                const letter = guess.letters[columnIndex];
                const color = verbumStateColor(letter.state);
                const isRevealing = revealRow === rowIndex;
                const isWinning = winRow === rowIndex;
                const delay = columnIndex * VERBUM_FLIP_STEP_MS;
                const style = {
                  "--verbum-tile-bg": color,
                  backgroundColor: color,
                  borderColor: color,
                  color: "var(--verbum-on-tile)",
                  // The flip and the win bounce never overlap: the bounce starts once the reveal is over.
                  ...(isRevealing ? { animationDelay: `${delay}ms` } : {}),
                  ...(isWinning && !isRevealing ? { animationDelay: `${columnIndex * VERBUM_WIN_STEP_MS}ms` } : {})
                } as CSSProperties;

                return (
                  <div
                    key={columnIndex}
                    role="gridcell"
                    aria-label={t("verbum.a11y.tile", { letter: letter.letter, state: t(`verbum.a11y.states.${letter.state}`) })}
                    className={`${tileBase} ${isRevealing ? "verbum-tile-reveal" : ""} ${isWinning && !isRevealing ? "verbum-tile-win" : ""}`}
                    style={style}
                  >
                    {letter.letter}
                  </div>
                );
              }

              const typed = isCurrentRow ? slots[columnIndex] || undefined : undefined;
              const isSelected = isCurrentRow && onSelectTile !== undefined && columnIndex === cursor;
              const className = `${tileBase} bg-[var(--surface)] text-[var(--text-primary)] ${
                isSelected
                  ? "border-[var(--brand-500)] ring-2 ring-[var(--brand-500)] ring-offset-1 ring-offset-[var(--surface)]"
                  : typed
                    ? "border-[var(--text-secondary)]"
                    : "border-[var(--line-strong)]"
              } ${typed ? "verbum-tile-pop" : ""}`;

              if (isCurrentRow && onSelectTile) {
                return (
                  <button
                    key={typed ? `${columnIndex}-${typed}` : columnIndex}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={t("verbum.a11y.slot", { position: columnIndex + 1, letter: typed ?? t("verbum.a11y.emptySlot") })}
                    onClick={() => onSelectTile(columnIndex)}
                    className={`${className} cursor-pointer`}
                  >
                    {typed ?? ""}
                  </button>
                );
              }

              return (
                <div key={typed ? `${columnIndex}-${typed}` : columnIndex} role="gridcell" className={className}>
                  {typed ?? ""}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const KEY_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"]
];

type VerbumKeyboardProps = {
  keyStates: Map<string, VerbumLetterState>;
  disabled: boolean;
  enterLabel: string;
  deleteLabel: string;
  onKey: (key: string) => void;
};

export function VerbumKeyboard({ keyStates, disabled, enterLabel, deleteLabel, onKey }: VerbumKeyboardProps) {
  const { t } = useTranslation("games");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-1.5 select-none" aria-label={t("verbum.a11y.keyboard")}>
      {KEY_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1">
          {row.map((key) => {
            const state = keyStates.get(key);
            const isWide = key === "ENTER" || key === "BACKSPACE";
            const style = state
              ? { backgroundColor: verbumStateColor(state), color: "var(--verbum-on-tile)" }
              : undefined;

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onKey(key)}
                aria-label={key === "ENTER" ? enterLabel : key === "BACKSPACE" ? deleteLabel : key}
                className={`flex h-12 items-center justify-center rounded-md font-semibold transition-colors disabled:cursor-default sm:h-14 ${
                  isWide ? "flex-[1.6] text-[0.7rem] uppercase tracking-wide sm:text-xs" : "flex-1 text-sm sm:text-base"
                } ${state ? "" : "bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]"}`}
                style={style}
              >
                {key === "BACKSPACE" ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z" />
                    <path d="m12 9 6 6M18 9l-6 6" />
                  </svg>
                ) : key === "ENTER" ? (
                  enterLabel
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
