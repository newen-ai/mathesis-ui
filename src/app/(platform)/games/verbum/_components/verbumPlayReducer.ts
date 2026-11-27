import type { VerbumPuzzleState } from "@/lib/api/verbum";

// Interaction state of one Verbum board. The puzzle itself (server state) lives outside; this only tracks
// what the player is doing with it, so the phases can never overlap (e.g. a flip and the win bounce).
export type VerbumPlayPhase = "idle" | "submitting" | "revealing";

export type VerbumPlayState = {
  phase: VerbumPlayPhase;
  // One entry per tile of the current row ("" when empty). The player can fill them in any order.
  slots: string[];
  // Tile that the next letter goes to.
  cursor: number;
  // Row flipping right now. Only set while phase is "revealing".
  revealRow: number | null;
  // Row that bounces after a win was just revealed. Never set while revealing.
  winRow: number | null;
  // Keyboard colors follow the last revealed guess, not the one still flipping.
  keyboardSource: VerbumPuzzleState | null;
};

export type VerbumPlayAction =
  | { type: "loaded"; puzzle: VerbumPuzzleState }
  // A letter goes into the selected tile and the cursor moves right (it stays on the last tile).
  | { type: "typed"; letter: string }
  // Backspace: clears the selected tile and moves left (it stays on the first tile). On an empty tile it
  // moves left and clears that one, so typing "ROB" + Backspace removes the B and stays on its tile.
  | { type: "erased" }
  // "_": clears the selected tile and moves right.
  | { type: "skipped" }
  | { type: "moved"; delta: -1 | 1 }
  | { type: "selected"; index: number }
  | { type: "submitStarted" }
  | { type: "submitFailed" }
  | { type: "revealStarted"; next: VerbumPuzzleState }
  | { type: "revealEnded"; next: VerbumPuzzleState };

export const initialVerbumPlayState: VerbumPlayState = {
  phase: "idle",
  slots: [],
  cursor: 0,
  revealRow: null,
  winRow: null,
  keyboardSource: null
};

export function isVerbumFinished(puzzle: VerbumPuzzleState | null): boolean {
  return puzzle?.play.status === "WON" || puzzle?.play.status === "LOST";
}

export function verbumGuessFromSlots(slots: string[]): string | null {
  return slots.length > 0 && slots.every((slot) => slot !== "") ? slots.join("") : null;
}

function emptySlots(length: number): string[] {
  return Array.from({ length }, () => "");
}

function clampCursor(slots: string[], index: number): number {
  return Math.min(Math.max(index, 0), Math.max(slots.length - 1, 0));
}

function withSlot(state: VerbumPlayState, letter: string, nextCursor: number): VerbumPlayState {
  const slots = [...state.slots];
  slots[state.cursor] = letter;
  return { ...state, slots, cursor: clampCursor(slots, nextCursor) };
}

export function verbumPlayReducer(state: VerbumPlayState, action: VerbumPlayAction): VerbumPlayState {
  switch (action.type) {
    case "loaded":
      return { ...initialVerbumPlayState, slots: emptySlots(action.puzzle.puzzle.length), keyboardSource: action.puzzle };
    case "typed":
      return state.phase === "idle" ? withSlot(state, action.letter, state.cursor + 1) : state;
    case "erased": {
      if (state.phase !== "idle") return state;
      if (state.slots[state.cursor] === "" && state.cursor > 0) {
        const previous = state.cursor - 1;
        return withSlot({ ...state, cursor: previous }, "", previous);
      }
      return withSlot(state, "", state.cursor - 1);
    }
    case "skipped":
      return state.phase === "idle" ? withSlot(state, "", state.cursor + 1) : state;
    case "moved":
      return state.phase === "idle" ? { ...state, cursor: clampCursor(state.slots, state.cursor + action.delta) } : state;
    case "selected":
      return state.phase === "idle" ? { ...state, cursor: clampCursor(state.slots, action.index) } : state;
    case "submitStarted":
      return { ...state, phase: "submitting" };
    case "submitFailed":
      return { ...state, phase: "idle" };
    case "revealStarted":
      return {
        ...state,
        phase: "revealing",
        slots: emptySlots(action.next.puzzle.length),
        cursor: 0,
        revealRow: action.next.play.guesses.length - 1,
        winRow: null
      };
    case "revealEnded":
      return {
        ...state,
        phase: "idle",
        revealRow: null,
        winRow: action.next.play.status === "WON" ? action.next.play.guesses.length - 1 : null,
        keyboardSource: action.next
      };
  }
}
