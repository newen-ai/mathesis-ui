import { describe, expect, it } from "vitest";
import type { VerbumPuzzleState } from "@/lib/api/verbum";
import { initialVerbumPlayState, isVerbumFinished, verbumPlayReducer, type VerbumPlayState } from "./verbumPlayReducer";

function puzzleWith(status: VerbumPuzzleState["play"]["status"], guesses: string[]): VerbumPuzzleState {
  return {
    puzzle: { date: "2026-11-24", number: 1, length: 5, maxAttempts: 6, isToday: true },
    play: {
      status,
      attemptsUsed: guesses.length,
      guesses: guesses.map((word) => ({ word, letters: Array.from(word).map((letter) => ({ letter, state: "ABSENT" as const })) })),
      finishedOnPuzzleDay: true
    },
    solution: null,
    today: "2026-11-24",
    nextPuzzleAt: "2026-11-25T03:00:00.000Z"
  };
}

const reduce = (state: VerbumPlayState, ...actions: Parameters<typeof verbumPlayReducer>[1][]) =>
  actions.reduce(verbumPlayReducer, state);

describe("verbumPlayReducer", () => {
  it("types up to the word length and erases letters", () => {
    const typed = reduce(
      initialVerbumPlayState,
      ...Array.from("ROBOTS").map((letter) => ({ type: "typed" as const, letter, maxLength: 5 }))
    );
    expect(typed.input).toBe("ROBOT");
    expect(reduce(typed, { type: "erased" }).input).toBe("ROBO");
  });

  it("ignores typing while a guess is being sent or revealed", () => {
    const submitting = reduce(initialVerbumPlayState, { type: "submitStarted" });
    expect(reduce(submitting, { type: "typed", letter: "A", maxLength: 5 }).input).toBe("");
    expect(reduce(submitting, { type: "submitFailed" }).phase).toBe("idle");
  });

  it("never flips and bounces the winning row at the same time", () => {
    const won = puzzleWith("WON", ["MOTOR", "ROBOT"]);
    const revealing = reduce(initialVerbumPlayState, { type: "submitStarted" }, { type: "revealStarted", next: won });
    expect(revealing).toMatchObject({ phase: "revealing", revealRow: 1, winRow: null, input: "" });

    const revealed = reduce(revealing, { type: "revealEnded", next: won });
    expect(revealed).toMatchObject({ phase: "idle", revealRow: null, winRow: 1, keyboardSource: won });
  });

  it("does not bounce after a guess that did not win", () => {
    const next = puzzleWith("IN_PROGRESS", ["MOTOR"]);
    expect(reduce(initialVerbumPlayState, { type: "revealStarted", next }, { type: "revealEnded", next }).winRow).toBeNull();
  });

  it("resets the board when a puzzle loads", () => {
    const loaded = puzzleWith("IN_PROGRESS", ["MOTOR"]);
    const dirty: VerbumPlayState = { phase: "revealing", input: "AB", revealRow: 0, winRow: 0, keyboardSource: null };
    expect(reduce(dirty, { type: "loaded", puzzle: loaded })).toEqual({ ...initialVerbumPlayState, keyboardSource: loaded });
  });

  it("knows when a game is over", () => {
    expect(isVerbumFinished(puzzleWith("WON", ["ROBOT"]))).toBe(true);
    expect(isVerbumFinished(puzzleWith("LOST", []))).toBe(true);
    expect(isVerbumFinished(puzzleWith("IN_PROGRESS", []))).toBe(false);
    expect(isVerbumFinished(null)).toBe(false);
  });
});
