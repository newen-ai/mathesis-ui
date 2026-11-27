import { describe, expect, it } from "vitest";
import { getBirthDateError, todayDateInputValue } from "./birthDate";

const now = new Date(2026, 10, 23, 12, 0, 0);

describe("birth date validation", () => {
  it("formats today in local time", () => {
    expect(todayDateInputValue(now)).toBe("2026-11-23");
  });

  it("accepts empty, past and today's dates", () => {
    expect(getBirthDateError("", now)).toBeNull();
    expect(getBirthDateError("1990-05-17", now)).toBeNull();
    expect(getBirthDateError("2026-11-23", now)).toBeNull();
  });

  it("rejects future dates and dates before 1900", () => {
    expect(getBirthDateError("2026-11-24", now)).toBe("future");
    expect(getBirthDateError("1899-12-31", now)).toBe("tooOld");
  });
});
