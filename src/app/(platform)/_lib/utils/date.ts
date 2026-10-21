export const toDateLabel = (value: string, locale = "es-AR") => {
  if (!value) return "";

  const normalizedValue = value.length === 7 ? `${value}-01` : value;

  return new Date(`${normalizedValue}T00:00:00`).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
  });
};
