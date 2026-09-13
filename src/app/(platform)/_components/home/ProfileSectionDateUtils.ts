type MonthOption = {
  value: string;
  label: string;
};

export const monthOptions: MonthOption[] = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
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