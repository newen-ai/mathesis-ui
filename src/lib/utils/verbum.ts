import type { VerbumLetterState, VerbumPuzzleState } from "@/lib/api/verbum";

const SHARE_SQUARES: Record<VerbumLetterState, string> = {
  CORRECT: "🟩",
  PRESENT: "🟨",
  ABSENT: "⬛"
};

// Routes of the game. Today's puzzle lives at the root; past days at /games/verbum/YYYY-MM-DD/.
export const VERBUM_HOME_PATH = "/games/verbum/";

export function verbumPuzzlePath(dateKey: string, todayKey?: string): string {
  return dateKey === todayKey ? VERBUM_HOME_PATH : `${VERBUM_HOME_PATH}${dateKey}/`;
}

export function isVerbumDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// "2026-11-24" -> "24/11/2026" (the date is already an Argentina calendar day; no time zone math).
export function formatVerbumDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${day}/${month}/${year}`;
}

// Text shared to WhatsApp and other apps: colors only, never the letters.
export function buildVerbumShareText(state: VerbumPuzzleState, url: string): string {
  const score = state.play.status === "WON" ? String(state.play.attemptsUsed) : "X";
  const header = `Verbum #${state.puzzle.number} · ${formatVerbumDate(state.puzzle.date)} · ${score}/${state.puzzle.maxAttempts}`;
  const grid = state.play.guesses.map((guess) => guess.letters.map((letter) => SHARE_SQUARES[letter.state]).join(""));
  return [header, ...grid, url].join("\n");
}

// Not wa.me: its redirect to api.whatsapp.com re-encodes the text and turns 4-byte emoji (🟩🟨) into U+FFFD,
// so WhatsApp ends up sharing only the link. Going straight to api.whatsapp.com keeps the text intact.
export function buildWhatsAppShareUrl(text: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}

// Best state per letter across all guesses, for the on-screen keyboard colors.
export function buildVerbumKeyboardStates(state: VerbumPuzzleState | null): Map<string, VerbumLetterState> {
  const rank: Record<VerbumLetterState, number> = { ABSENT: 0, PRESENT: 1, CORRECT: 2 };
  const result = new Map<string, VerbumLetterState>();

  for (const guess of state?.play.guesses ?? []) {
    for (const { letter, state: letterState } of guess.letters) {
      const previous = result.get(letter);
      if (!previous || rank[letterState] > rank[previous]) {
        result.set(letter, letterState);
      }
    }
  }

  return result;
}

// Mirrors normalizeVerbumWord in the backend engine (uppercase, accents dropped, Ñ kept). The test cases in
// verbum.test.ts mirror the backend's verbum-engine.test.ts: change both together.
export function normalizeVerbumInput(raw: string): string {
  return raw
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-̂̄-ͯ]/g, "")
    .replace(/(?<!N)̃/g, "")
    .normalize("NFC")
    .replace(/[^A-ZÑ]/g, "");
}

export function formatCountdown(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
