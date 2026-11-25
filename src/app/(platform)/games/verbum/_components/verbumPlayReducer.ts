import type { VerbumPuzzleState } from "@/lib/api/verbum";

// Interaction state of one Verbum board. The puzzle itself (server state) lives outside; this only tracks
// what the player is doing with it, so the phases can never overlap (e.g. a flip and the win bounce).
export type VerbumPlayPhase = "idle" | "submitting" | "revealing";

export type VerbumPlayState = {
  phase: VerbumPlayPhase;
  input: string;
  // Row flipping right now. Only set while phase is "revealing".
  revealRow: number | null;
  // Row that bounces after a win was just revealed. Never set while revealing.
  winRow: number | null;
  // Keyboard colors follow the last revealed guess, not the one still flipping.
  keyboardSource: VerbumPuzzleState | null;
};

export type VerbumPlayAction =
  | { type: "loaded"; puzzle: VerbumPuzzleState }
  | { type: "typed"; letter: string; maxLength: number }
  | { type: "erased" }
  | { type: "submitStarted" }
  | { type: "submitFailed" }
  | { type: "revealStarted"; next: VerbumPuzzleState }
  | { type: "revealEnded"; next: VerbumPuzzleState };

export const initialVerbumPlayState: VerbumPlayState = {
  phase: "idle",
  input: "",
  revealRow: null,
  winRow: null,
  keyboardSource: null
};

export function isVerbumFinished(puzzle: VerbumPuzzleState | null): boolean {
  return puzzle?.play.status === "WON" || puzzle?.play.status === "LOST";
}

export function verbumPlayReducer(state: VerbumPlayState, action: VerbumPlayAction): VerbumPlayState {
  switch (action.type) {
    case "loaded":
      return { ...initialVerbumPlayState, keyboardSource: action.puzzle };
    case "typed": {
      const letters = Array.from(state.input);
      return state.phase === "idle" && letters.length < action.maxLength
        ? { ...state, input: state.input + action.letter }
        : state;
    }
    case "erased":
      return state.phase === "idle" ? { ...state, input: Array.from(state.input).slice(0, -1).join("") } : state;
    case "submitStarted":
      return { ...state, phase: "submitting" };
    case "submitFailed":
      return { ...state, phase: "idle" };
    case "revealStarted":
      return {
        ...state,
        phase: "revealing",
        input: "",
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
