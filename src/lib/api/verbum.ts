import { apiRequest, parseDataResponse } from "@/lib/api/client";

export type VerbumLetterState = "CORRECT" | "PRESENT" | "ABSENT";
export type VerbumPlayStatus = "NOT_STARTED" | "IN_PROGRESS" | "WON" | "LOST";

export type VerbumEvaluatedLetter = {
  letter: string;
  state: VerbumLetterState;
};

export type VerbumPuzzleState = {
  puzzle: {
    date: string;
    number: number;
    length: number;
    maxAttempts: number;
    isToday: boolean;
  };
  play: {
    status: VerbumPlayStatus;
    attemptsUsed: number;
    guesses: Array<{ word: string; letters: VerbumEvaluatedLetter[] }>;
    finishedOnPuzzleDay: boolean;
  };
  solution: {
    word: string;
    context: string;
    readMoreUrl: string | null;
    readMoreLabel: string | null;
  } | null;
  today: string;
  nextPuzzleAt: string;
};

export type VerbumCalendarDay = {
  date: string;
  number: number;
  status: VerbumPlayStatus;
  attemptsUsed: number;
  finishedOnPuzzleDay: boolean;
};

export type VerbumCalendar = {
  launchDate: string;
  today: string;
  days: VerbumCalendarDay[];
};

export type VerbumStats = {
  played: number;
  won: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
};

export async function getVerbumPuzzle(date: string | null, signal?: AbortSignal) {
  const path = date ? `/games/verbum/puzzles/${encodeURIComponent(date)}` : "/games/verbum/today";
  const response = await apiRequest(path, { signal });
  return parseDataResponse<VerbumPuzzleState>(response, "Invalid Verbum puzzle response");
}

export async function submitVerbumGuess(date: string, guess: string, signal?: AbortSignal) {
  const response = await apiRequest(`/games/verbum/puzzles/${encodeURIComponent(date)}/guesses`, {
    method: "POST",
    body: { guess },
    signal
  });
  return parseDataResponse<VerbumPuzzleState>(response, "Invalid Verbum guess response");
}

export async function getVerbumCalendar(signal?: AbortSignal) {
  const response = await apiRequest("/games/verbum/calendar", { signal });
  return parseDataResponse<VerbumCalendar>(response, "Invalid Verbum calendar response");
}

export async function getVerbumStats(signal?: AbortSignal) {
  const response = await apiRequest("/games/verbum/stats", { signal });
  return parseDataResponse<{ stats: VerbumStats }>(response, "Invalid Verbum stats response");
}

export function getVerbumErrorCode(error: unknown): string | undefined {
  const details = (error as { details?: unknown } | null)?.details;
  if (!details || typeof details !== "object") {
    return undefined;
  }
  const code = (details as { code?: unknown }).code;
  return typeof code === "string" ? code : undefined;
}

// True when the request failed because the session expired (the access token has no refresh flow).
export function isVerbumSessionExpired(error: unknown): boolean {
  return (error as { status?: unknown } | null)?.status === 401;
}
