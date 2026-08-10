type TwoInitialsInput = {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  fallback?: string;
};

function firstChar(value: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  return Array.from(normalized)[0] ?? "";
}

function firstTwoChars(value: string) {
  return Array.from(value.trim()).slice(0, 2).join("");
}

export function getTwoInitials({
  firstName,
  lastName,
  fullName,
  fallback = "ME",
}: TwoInitialsInput) {
  const safeFallback = firstTwoChars(fallback) || "ME";

  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";

  let rawInitials = "";

  if (first || last) {
    const fromNames = `${firstChar(first)}${firstChar(last)}`;
    if (fromNames.length === 2) {
      rawInitials = fromNames;
    } else {
      const primarySource = first || last;
      rawInitials = firstTwoChars(primarySource);
    }
  } else if (fullName?.trim()) {
    const tokens = fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length >= 2) {
      rawInitials = `${firstChar(tokens[0])}${firstChar(tokens[1])}`;
    } else if (tokens.length === 1) {
      rawInitials = firstTwoChars(tokens[0]);
    }
  }

  const normalized = rawInitials.toUpperCase();
  if (normalized.length >= 2) {
    return normalized.slice(0, 2);
  }

  if (normalized.length === 1) {
    return `${normalized}${(safeFallback[1] ?? normalized).toUpperCase()}`;
  }

  return safeFallback.toUpperCase().slice(0, 2);
}

export function normalizeImageUrl(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}
