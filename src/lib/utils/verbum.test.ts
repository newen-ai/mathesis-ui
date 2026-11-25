import { describe, expect, it } from "vitest";
import type { VerbumPuzzleState } from "@/lib/api/verbum";
import {
  buildVerbumKeyboardStates,
  buildVerbumShareText,
  buildWhatsAppShareUrl,
  formatCountdown,
  formatVerbumDate,
  isVerbumDateKey,
  normalizeVerbumInput,
  verbumPuzzlePath
} from "@/lib/utils/verbum";

function stateWith(status: VerbumPuzzleState["play"]["status"]): VerbumPuzzleState {
  return {
    puzzle: { date: "2026-11-24", number: 1, length: 5, maxAttempts: 6, isToday: true },
    play: {
      status,
      attemptsUsed: 2,
      finishedOnPuzzleDay: true,
      guesses: [
        {
          word: "MOTOR",
          letters: [
            { letter: "M", state: "ABSENT" },
            { letter: "O", state: "CORRECT" },
            { letter: "T", state: "PRESENT" },
            { letter: "O", state: "CORRECT" },
            { letter: "R", state: "PRESENT" }
          ]
        },
        {
          word: "ROBOT",
          letters: ["R", "O", "B", "O", "T"].map((letter) => ({ letter, state: "CORRECT" as const }))
        }
      ]
    },
    solution: null,
    today: "2026-11-24",
    nextPuzzleAt: "2026-11-25T03:00:00.000Z"
  };
}

describe("verbum utils", () => {
  it("builds the share text without letters", () => {
    const text = buildVerbumShareText(stateWith("WON"), "https://sophium.social/games/verbum/2026-11-24");
    expect(text).toBe(
      [
        "Verbum #1 · 24/11/2026 · 2/6",
        "⬛🟩🟨🟩🟨",
        "🟩🟩🟩🟩🟩",
        "https://sophium.social/games/verbum/2026-11-24"
      ].join("\n")
    );
    expect(text).not.toContain("ROBOT");
    expect(buildVerbumShareText(stateWith("LOST"), "u").split("\n")[0]).toContain("X/6");
  });

  it("encodes the WhatsApp link", () => {
    expect(buildWhatsAppShareUrl("a b\n🟩")).toBe("https://api.whatsapp.com/send?text=a%20b%0A%F0%9F%9F%A9");
  });

  it("keeps the best state per key", () => {
    const keys = buildVerbumKeyboardStates(stateWith("WON"));
    expect(keys.get("M")).toBe("ABSENT");
    expect(keys.get("T")).toBe("CORRECT");
    expect(buildVerbumKeyboardStates(null).size).toBe(0);
  });

  // Same cases as "normalizes accents but keeps Ñ" in the backend's verbum-engine.test.ts.
  it("normalizes typed input like the backend", () => {
    expect(normalizeVerbumInput(" átomo ")).toBe("ATOMO");
    expect(normalizeVerbumInput("Diseño")).toBe("DISEÑO");
    expect(normalizeVerbumInput("pingüino")).toBe("PINGUINO");
    expect(normalizeVerbumInput("SEÑAL")).toBe("SEÑAL");
    // UI only: anything that is not a letter is dropped while typing.
    expect(normalizeVerbumInput("átomo 1")).toBe("ATOMO");
  });

  it("builds game routes and validates day keys", () => {
    expect(verbumPuzzlePath("2026-11-24", "2026-11-24")).toBe("/games/verbum/");
    expect(verbumPuzzlePath("2026-11-20", "2026-11-24")).toBe("/games/verbum/2026-11-20/");
    expect(verbumPuzzlePath("2026-11-20")).toBe("/games/verbum/2026-11-20/");
    expect(isVerbumDateKey("2026-11-24")).toBe(true);
    expect(isVerbumDateKey("24/11/2026")).toBe(false);
  });

  it("formats dates and countdowns", () => {
    expect(formatVerbumDate("2026-11-24")).toBe("24/11/2026");
    expect(formatCountdown(3_723_000)).toBe("01:02:03");
    expect(formatCountdown(-5)).toBe("00:00:00");
  });
});
