import { useCallback, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { BIRTH_DATE_MIN, todayDateInputValue, type BirthDateFieldStatus } from "../../_lib/birthDate";
import { monthOptions } from "./ProfileSectionDateUtils";
import { useAnchoredPopover, useDismissOnOutsidePress } from "./useAnchoredPopover";

type BirthDateFieldProps = {
  /** `YYYY-MM-DD`, or "" when empty or not a full valid date. */
  value: string;
  onChange: (value: string, status: BirthDateFieldStatus) => void;
  id?: string;
  labelledBy?: string;
  /** Lets the parent show "incomplete" errors only after the user leaves the field. */
  onBlur?: () => void;
};

const MIN_YEAR = Number(BIRTH_DATE_MIN.slice(0, 4));
const DEFAULT_VIEW_AGE = 30;

/** "17051990" → "17/05/1990". Slashes appear only once the next digit is typed, so backspace never gets stuck. */
export function formatBirthDateDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let text = digits.slice(0, 2);
  if (digits.length > 2) text += `/${digits.slice(2, 4)}`;
  if (digits.length > 4) text += `/${digits.slice(4, 8)}`;
  return text;
}

/** Parses `dd/mm/yyyy` text into `YYYY-MM-DD` plus a status. */
export function parseBirthDateText(text: string): { value: string; status: BirthDateFieldStatus } {
  const digits = text.replace(/\D/g, "");
  if (!digits) return { value: "", status: "empty" };
  if (digits.length < 8) return { value: "", status: "incomplete" };

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const date = new Date(year, month - 1, day);
  if (month < 1 || month > 12 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { value: "", status: "invalid" };
  }
  return { value: `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`, status: "complete" };
}

function toText(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Birth date as typeable `dd/mm/aaaa` text (digits only, slashes added automatically) plus a
 * calendar popup for mouse users. The popup picks month and year with selects, so reaching
 * 1990 does not mean paging back month by month like the native date picker.
 * Mount it with the initial value: later `value` changes from outside are not re-synced.
 */
export function BirthDateField({ value, onChange, id, labelledBy, onBlur }: BirthDateFieldProps) {
  const { t, i18n } = useTranslation("profile");
  const [text, setText] = useState(() => toText(value));
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const today = todayDateInputValue();
  const [todayYear, todayMonth] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const initialView = () => {
    const match = /^(\d{4})-(\d{2})/.exec(value);
    return match
      ? { year: Number(match[1]), month: Number(match[2]) }
      : { year: todayYear - DEFAULT_VIEW_AGE, month: 1 };
  };
  const [view, setView] = useState(initialView);

  const close = useCallback(() => setOpen(false), []);
  const popupStyle = useAnchoredPopover(anchorRef, popupRef, open, 304);
  useDismissOnOutsidePress([anchorRef, popupRef], open, close);

  const emitText = (nextText: string) => {
    setText(nextText);
    const parsed = parseBirthDateText(nextText);
    onChange(parsed.value, parsed.status);
  };

  const pickDay = (day: number) => {
    emitText(`${pad(day)}/${pad(view.month)}/${view.year}`);
    setOpen(false);
    toggleRef.current?.focus();
  };

  const shiftMonth = (delta: number) => {
    setView((current) => {
      const date = new Date(current.year, current.month - 1 + delta, 1);
      const year = Math.min(todayYear, Math.max(MIN_YEAR, date.getFullYear()));
      const month = year === todayYear ? Math.min(todayMonth, date.getMonth() + 1) : date.getMonth() + 1;
      return { year, month };
    });
  };

  const openCalendar = () => {
    const parsed = parseBirthDateText(text);
    if (parsed.status === "complete") {
      setView({ year: Number(parsed.value.slice(0, 4)), month: Number(parsed.value.slice(5, 7)) });
    }
    setOpen(true);
  };

  const onPopupKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      // Consumed here so the profile edit modal does not close too.
      event.preventDefault();
      setOpen(false);
      toggleRef.current?.focus();
    }
  };

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: "narrow" });
    // 2024-01-01 was a Monday: weeks start on Monday.
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(2024, 0, 1 + index)));
  }, [i18n.language]);

  const years = Array.from({ length: todayYear - MIN_YEAR + 1 }, (_, index) => todayYear - index);
  const daysInView = new Date(view.year, view.month, 0).getDate();
  const leadingBlanks = (new Date(view.year, view.month - 1, 1).getDay() + 6) % 7;
  const selectedValue = parseBirthDateText(text).value;
  const atMinMonth = view.year === MIN_YEAR && view.month === 1;
  const atMaxMonth = view.year === todayYear && view.month === todayMonth;

  return (
    <div ref={anchorRef} className="relative">
      <input
        id={id}
        aria-labelledby={labelledBy}
        inputMode="numeric"
        autoComplete="bday"
        placeholder={t("profileForm.placeholders.birthDate")}
        value={text}
        maxLength={10}
        onChange={(event) => emitText(formatBirthDateDigits(event.target.value))}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && event.altKey) {
            event.preventDefault();
            openCalendar();
          }
        }}
        className="w-full pr-11"
      />
      <button
        ref={toggleRef}
        type="button"
        aria-label={t("profileForm.actions.openCalendar")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? setOpen(false) : openCalendar())}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[var(--brand-700)]"
      >
        <svg viewBox="0 0 24 24" className="h-[1.1rem] w-[1.1rem]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              ref={popupRef}
              role="dialog"
              aria-label={t("profileForm.actions.openCalendar")}
              style={popupStyle}
              onKeyDown={onPopupKeyDown}
              className="sophium-select-popup z-[140] p-3"
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  disabled={atMinMonth}
                  aria-label={t("profileForm.actions.previousMonth")}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition hover:bg-[var(--surface-2)] disabled:opacity-40"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="m12.5 5-5 5 5 5" />
                  </svg>
                </button>
                <select
                  aria-label={t("common.month")}
                  value={view.month}
                  onChange={(event) => setView((current) => ({ ...current, month: Number(event.target.value) }))}
                  className="sophium-calendar-select min-w-0 flex-[1.4]"
                >
                  {monthOptions.map((month) => (
                    <option
                      key={month.value}
                      value={Number(month.value)}
                      disabled={view.year === todayYear && Number(month.value) > todayMonth}
                    >
                      {t(`months.${month.value}`)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t("common.year")}
                  value={view.year}
                  onChange={(event) => {
                    const year = Number(event.target.value);
                    setView((current) => ({
                      year,
                      month: year === todayYear ? Math.min(current.month, todayMonth) : current.month,
                    }));
                  }}
                  className="sophium-calendar-select min-w-0 flex-1"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  disabled={atMaxMonth}
                  aria-label={t("profileForm.actions.nextMonth")}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition hover:bg-[var(--surface-2)] disabled:opacity-40"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="m7.5 5 5 5-5 5" />
                  </svg>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-7 gap-0.5 text-center">
                {weekdayLabels.map((label, index) => (
                  <span key={index} className="py-1 text-scale-1 font-semibold uppercase text-[var(--text-soft)]" aria-hidden="true">
                    {label}
                  </span>
                ))}
                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <span key={`blank-${index}`} aria-hidden="true" />
                ))}
                {Array.from({ length: daysInView }, (_, index) => {
                  const day = index + 1;
                  const iso = `${view.year}-${pad(view.month)}-${pad(day)}`;
                  const isSelected = iso === selectedValue;
                  const isToday = iso === today;
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={iso > today}
                      aria-pressed={isSelected}
                      onClick={() => pickDay(day)}
                      className={`h-9 rounded-md text-scale-2 transition disabled:cursor-not-allowed disabled:opacity-35 ${
                        isSelected
                          ? "bg-[var(--brand-700)] font-semibold text-white"
                          : `hover:bg-[color:color-mix(in_srgb,var(--brand-100)_70%,var(--surface))] ${
                              isToday ? "font-semibold text-[var(--brand-700)] ring-1 ring-inset ring-[var(--brand-300)]" : ""
                            }`
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
