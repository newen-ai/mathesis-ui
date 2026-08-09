"use client";

import { useEffect, useState } from "react";

type CatchyPhrasesBannerProps = {
  lines: string[];
};

const ROTATION_MS = 5200;

const buildShuffledOrder = (length: number, previousLastIndex?: number) => {
  const order = Array.from({ length }, (_, index) => index);

  for (let i = order.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [order[i], order[randomIndex]] = [order[randomIndex], order[i]];
  }

  if (
    typeof previousLastIndex === "number" &&
    order.length > 1 &&
    order[0] === previousLastIndex
  ) {
    [order[0], order[1]] = [order[1], order[0]];
  }

  return order;
};

export function CatchyPhrasesBanner({ lines }: CatchyPhrasesBannerProps) {
  const [rotation, setRotation] = useState(() => ({
    order: Array.from({ length: lines.length }, (_, index) => index),
    position: 0,
  }));
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (lines.length <= 1 || isPaused) return;

    const intervalId = window.setInterval(() => {
      setRotation((current) => {
        if (current.position + 1 < current.order.length) {
          return {
            ...current,
            position: current.position + 1,
          };
        }

        const lastIndex = current.order[current.position];
        return {
          order: buildShuffledOrder(lines.length, lastIndex),
          position: 0,
        };
      });
    }, ROTATION_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPaused, lines.length]);

  const activeLineIndex = rotation.order[rotation.position] ?? 0;
  const currentLine = lines[activeLineIndex] ?? "";

  return (
    <section className="mathesis-phrase-band border-b border-[var(--line)]">
      <div
        className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
      >
        <span className="rounded-full bg-white/65 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--brand-900)]">
          Frases que pegan
        </span>

        <div className="mathesis-phrase-stage">
          <p
            key={`${activeLineIndex}-${rotation.position}`}
            className="mathesis-phrase-text text-sm font-medium text-white sm:text-base"
          >
            {currentLine}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
        <div className="h-0.5 rounded-full bg-white/15">
          <div
            key={`${activeLineIndex}-${isPaused ? "paused" : "running"}`}
            className={`mathesis-phrase-progress ${isPaused ? "is-paused" : ""}`}
            style={{ animationDuration: `${ROTATION_MS}ms` }}
          />
        </div>
      </div>
    </section>
  );
}
