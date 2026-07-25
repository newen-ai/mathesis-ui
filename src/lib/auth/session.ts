const SESSION_COOKIE_KEY = "mensa_session";
const SESSION_MEMORY_KEY = "current-session-memory";

function isBrowser() {
  return typeof window !== "undefined";
}

function clearSessionCookie() {
  if (!isBrowser()) return;

  document.cookie = `${SESSION_COOKIE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function clearSession() {
  if (!isBrowser()) return;

  clearSessionCookie();

  try {
    sessionStorage.removeItem(SESSION_MEMORY_KEY);
  } catch {
    // sessionStorage might be unavailable, ignore
  }
}
