export const BIRTH_DATE_MIN = "1900-01-01";

/** Today as a `YYYY-MM-DD` value in the user's local time zone, for `<input type="date" max>`. */
export function todayDateInputValue(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export type BirthDateError = "future" | "tooOld";

/** Validates a `YYYY-MM-DD` birth date. An empty value is valid (the field is optional). */
export function getBirthDateError(value: string, now: Date = new Date()): BirthDateError | null {
  if (!value) return null;
  if (value > todayDateInputValue(now)) return "future";
  if (value < BIRTH_DATE_MIN) return "tooOld";
  return null;
}

export type BirthDateFieldStatus = "empty" | "complete" | "incomplete" | "invalid";
export type BirthDateFieldError = BirthDateError | "incomplete" | "invalid";

/** Error for the birth date field given its typed status. Any non-null result blocks saving. */
export function getBirthDateFieldError(value: string, status: BirthDateFieldStatus): BirthDateFieldError | null {
  if (status === "incomplete" || status === "invalid") return status;
  return getBirthDateError(value);
}

/** Future/too-old dates show right away; "incomplete" and "invalid" wait until the user leaves the field. */
export function shouldShowBirthDateError(error: BirthDateFieldError | null, touched: boolean): boolean {
  if (!error) return false;
  return touched || error === "future" || error === "tooOld";
}
