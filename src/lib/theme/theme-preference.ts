export type ThemeMode = "light" | "dark";

export const THEME_COOKIE_NAME = "theme";
export const THEME_STORAGE_KEY = "theme";

export function normalizeTheme(value: unknown): ThemeMode | null {
  if (value === "light" || value === "dark") {
    return value;
  }

  return null;
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
}

export function readThemeFromDocument(): ThemeMode | null {
  if (typeof document === "undefined") {
    return null;
  }

  return normalizeTheme(document.documentElement.getAttribute("data-theme"));
}

export function readThemeFromCookieString(cookieHeader: string): ThemeMode | null {
  const entries = cookieHeader
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const entry of entries) {
    if (!entry.startsWith(`${THEME_COOKIE_NAME}=`)) {
      continue;
    }

    const rawValue = entry.slice(THEME_COOKIE_NAME.length + 1);
    return normalizeTheme(decodeURIComponent(rawValue));
  }

  return null;
}

export function readThemeFromBrowserCookie(): ThemeMode | null {
  if (typeof document === "undefined") {
    return null;
  }

  return readThemeFromCookieString(document.cookie ?? "");
}

export function readThemeFromLocalStorage(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function readStoredTheme(): ThemeMode | null {
  const fromStorage = readThemeFromLocalStorage();
  if (fromStorage) {
    return fromStorage;
  }

  return readThemeFromBrowserCookie();
}

export function persistTheme(theme: ThemeMode): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  if (typeof document !== "undefined") {
    document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(theme)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }
}

export function resolveThemeBootstrapValue(): ThemeMode {
  const fromStorage = readThemeFromLocalStorage();
  if (fromStorage) {
    return fromStorage;
  }

  const fromCookie = readThemeFromBrowserCookie();
  if (fromCookie) {
    return fromCookie;
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  return "light";
}