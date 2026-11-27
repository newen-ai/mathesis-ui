import { describe, expect, it } from "vitest";
import type { VerbumPuzzleState } from "@/lib/api/verbum";
import {
  initialVerbumPlayState,
  isVerbumFinished,
  verbumGuessFromSlots,
  verbumPlayReducer,
  type VerbumPlayState
} from "./verbumPlayReducer";

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
  const fresh = () => reduce(initialVerbumPlayState, { type: "loaded", puzzle: puzzleWith("IN_PROGRESS", []) });
  const typeWord = (state: VerbumPlayState, word: string) =>
    reduce(state, ...Array.from(word).map((letter) => ({ type: "typed" as const, letter })));

  it("fills tiles left to right and stays on the last one", () => {
    const typed = typeWord(fresh(), "ROBOTS");
    expect(typed.slots).toEqual(["R", "O", "B", "O", "S"]);
    expect(typed.cursor).toBe(4);
    expect(verbumGuessFromSlots(typed.slots)).toBe("ROBOS");
  });

  it("writes into any tile the player selects, and moves with the arrows", () => {
    let state = reduce(fresh(), { type: "selected", index: 3 }, { type: "typed", letter: "O" });
    expect(state.slots).toEqual(["", "", "", "O", ""]);
    expect(state.cursor).toBe(4);

    state = reduce(state, { type: "moved", delta: -1 }, { type: "moved", delta: -1 }, { type: "typed", letter: "B" });
    expect(state.slots).toEqual(["", "", "B", "O", ""]);
    expect(verbumGuessFromSlots(state.slots)).toBeNull();

    expect(reduce(state, { type: "moved", delta: 1 }, { type: "moved", delta: 1 }, { type: "moved", delta: 1 }).cursor).toBe(4);
    expect(reduce(state, { type: "selected", index: 0 }, { type: "moved", delta: -1 }).cursor).toBe(0);
  });

  it("backspace clears the selected tile and moves left, except on the first tile", () => {
    let state = reduce(typeWord(fresh(), "ROBOT"), { type: "selected", index: 2 }, { type: "erased" });
    expect(state.slots).toEqual(["R", "O", "", "O", "T"]);
    expect(state.cursor).toBe(1);

    state = reduce(state, { type: "selected", index: 0 }, { type: "erased" });
    expect(state.slots).toEqual(["", "O", "", "O", "T"]);
    expect(state.cursor).toBe(0);
  });

  it("backspace on an empty tile clears the previous one and stays there, one tile per press", () => {
    let state = typeWord(fresh(), "ROB");
    expect(state.cursor).toBe(3);

    state = reduce(state, { type: "erased" });
    expect(state.slots).toEqual(["R", "O", "", "", ""]);
    expect(state.cursor).toBe(2);

    state = reduce(state, { type: "erased" });
    expect(state.slots).toEqual(["R", "", "", "", ""]);
    expect(state.cursor).toBe(1);

    state = reduce(state, { type: "erased" }, { type: "erased" }, { type: "erased" });
    expect(state.slots).toEqual(["", "", "", "", ""]);
    expect(state.cursor).toBe(0);
  });

  it("backspace over a gap moves one tile at a time", () => {
    const state = reduce(fresh(), { type: "selected", index: 3 }, { type: "erased" });
    expect(state.cursor).toBe(2);
    expect(reduce(state, { type: "erased" }).cursor).toBe(1);
  });

  it("underscore clears the selected tile and moves right", () => {
    const state = reduce(typeWord(fresh(), "ROBOT"), { type: "selected", index: 1 }, { type: "skipped" });
    expect(state.slots).toEqual(["R", "", "B", "O", "T"]);
    expect(state.cursor).toBe(2);
  });

  it("ignores editing while a guess is being sent or revealed", () => {
    const submitting = reduce(typeWord(fresh(), "RO"), { type: "submitStarted" });
    expect(reduce(submitting, { type: "typed", letter: "A" }, { type: "erased" }, { type: "selected", index: 4 })).toEqual(submitting);
    expect(reduce(submitting, { type: "submitFailed" }).phase).toBe("idle");
  });

  it("never flips and bounces the winning row at the same time", () => {
    const won = puzzleWith("WON", ["MOTOR", "ROBOT"]);
    const revealing = reduce(initialVerbumPlayState, { type: "submitStarted" }, { type: "revealStarted", next: won });
    expect(revealing).toMatchObject({ phase: "revealing", revealRow: 1, winRow: null, slots: ["", "", "", "", ""], cursor: 0 });

    const revealed = reduce(revealing, { type: "revealEnded", next: won });
    expect(revealed).toMatchObject({ phase: "idle", revealRow: null, winRow: 1, keyboardSource: won });
  });

  it("does not bounce after a guess that did not win", () => {
    const next = puzzleWith("IN_PROGRESS", ["MOTOR"]);
    expect(reduce(initialVerbumPlayState, { type: "revealStarted", next }, { type: "revealEnded", next }).winRow).toBeNull();
  });

  it("resets the board when a puzzle loads", () => {
    const loaded = puzzleWith("IN_PROGRESS", ["MOTOR"]);
    const dirty: VerbumPlayState = { phase: "revealing", slots: ["A", "B"], cursor: 1, revealRow: 0, winRow: 0, keyboardSource: null };
    expect(reduce(dirty, { type: "loaded", puzzle: loaded })).toEqual({
      ...initialVerbumPlayState,
      slots: ["", "", "", "", ""],
      keyboardSource: loaded
    });
  });

  it("knows when a game is over", () => {
    expect(isVerbumFinished(puzzleWith("WON", ["ROBOT"]))).toBe(true);
    expect(isVerbumFinished(puzzleWith("LOST", []))).toBe(true);
    expect(isVerbumFinished(puzzleWith("IN_PROGRESS", []))).toBe(false);
    expect(isVerbumFinished(null)).toBe(false);
  });
});
