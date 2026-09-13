import { isFutureMonthForYear, monthOptions, yearOptions } from "./ProfileSectionDateUtils";

type ProfileYearMonthRangeFieldsProps = {
  startLabel: string;
  endLabel: string;
  currentLabel: string;
  currentChecked: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  onStartMonthChange: (value: string) => void;
  onStartYearChange: (value: string) => void;
  onEndMonthChange: (value: string) => void;
  onEndYearChange: (value: string) => void;
  onCurrentChange: (checked: boolean) => void;
};

export function ProfileYearMonthRangeFields({
  startLabel,
  endLabel,
  currentLabel,
  currentChecked,
  startMonth,
  startYear,
  endMonth,
  endYear,
  onStartMonthChange,
  onStartYearChange,
  onEndMonthChange,
  onEndYearChange,
  onCurrentChange,
}: ProfileYearMonthRangeFieldsProps) {
  return (
    <>
      <label className="mathesis-field sm:col-span-1">
        {startLabel}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={startMonth}
            onChange={(event) => onStartMonthChange(event.target.value)}
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">Mes</option>
            {monthOptions.map((month) => (
              <option
                key={month.value}
                value={month.value}
                disabled={isFutureMonthForYear(month.value, startYear)}
              >
                {month.label}
              </option>
            ))}
          </select>

          <select
            value={startYear}
            onChange={(event) => onStartYearChange(event.target.value)}
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
          >
            <option value="">Año</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </label>

      {!currentChecked ? (
        <label className="mathesis-field sm:col-span-1">
          {endLabel}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={endMonth}
              onChange={(event) => onEndMonthChange(event.target.value)}
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="">Mes</option>
              {monthOptions.map((month) => (
                <option
                  key={month.value}
                  value={month.value}
                  disabled={isFutureMonthForYear(month.value, endYear)}
                >
                  {month.label}
                </option>
              ))}
            </select>

            <select
              value={endYear}
              onChange={(event) => onEndYearChange(event.target.value)}
              className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              <option value="">Año</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </label>
      ) : null}

      <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={currentChecked}
          onChange={(event) => onCurrentChange(event.target.checked)}
          className="h-4 w-4 rounded border-[var(--line)] text-[var(--brand-700)] focus:ring-[var(--brand-700)]"
        />
        {currentLabel}
      </label>
    </>
  );
}