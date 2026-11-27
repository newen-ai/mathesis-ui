type MonthOption = {
  value: string;
  label: string;
};

export const monthOptions: MonthOption[] = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;

export const yearOptions = Array.from({ length: 70 }, (_, index) =>
  String(currentYear - index)
);

export function isFutureMonthForYear(monthValue: string, yearValue: string) {
  if (!monthValue || !yearValue) return false;
  if (Number(yearValue) < currentYear) return false;
  if (Number(yearValue) > currentYear) return true;
  return Number(monthValue) > currentMonth;
}