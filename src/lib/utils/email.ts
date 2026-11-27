export function normalizeEmailInput(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function resolveEmailParam(searchEmail: string | string[] | undefined): string | null {
  const value = Array.isArray(searchEmail) ? searchEmail[0] : searchEmail;
  const normalized = normalizeEmailInput(value);

  return normalized.length > 0 ? normalized : null;
}

export function maskEmailForDisplay(email: string, visibleCount = 2): string {
  const [localPart, domainPart] = email.split("@");

  if (!localPart || !domainPart) {
    return "tu correo";
  }

  const safeVisibleCount = Math.max(1, visibleCount);
  const shown = localPart.slice(0, Math.min(safeVisibleCount, localPart.length));
  const masked = "*".repeat(Math.max(localPart.length - shown.length, 1));

  return `${shown}${masked}@${domainPart}`;
}
