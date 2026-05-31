// Update session name and surname
export function setSessionName(name: string, surname: string) {
  if (!isBrowser()) return;
  const session = readSession();
  if (!session) return;
  const fullName = `${name.trim()} ${surname.trim()}`.trim();
  const updated = {
    ...session,
    user: {
      ...session.user,
      name: fullName,
    },
  };
  saveSession(updated);
}

// Update registered user name and surname by email
export function updateRegisteredUserName(email: string, name: string, surname: string) {
  if (!isBrowser()) return;
  const users = readRegisteredUsersUnsafe();
  const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) return;
  users[idx] = {
    ...users[idx],
    name: `${name.trim()} ${surname.trim()}`.trim(),
  };
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}
export const SESSION_STORAGE_KEY = "mensa-empresarios-session-v1";
export const SESSION_COOKIE_KEY = "mensa_session";
export const USERS_STORAGE_KEY = "mensa-empresarios-users-v1";
export const PROFILE_STORAGE_KEY = "mensa-empresarios-profile-v1";

const SHORT_SESSION_MS = 1000 * 60 * 60 * 12;
const LONG_SESSION_MS = 1000 * 60 * 60 * 24 * 30;

export type MockSession = {
  sessionId: string;
  rememberMe: boolean;
  createdAt: number;
  expiresAt: number;
  user: {
    name: string;
    email: string;
  };
};

export type MockRegisteredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: number;
};

let cachedSessionRawValue: string | null = null;
let cachedSessionSnapshot: MockSession | null = null;

type SessionSeed = {
  name?: string;
  email: string;
  rememberMe: boolean;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeDisplayName(email: string) {
  const localPart = email.split("@")[0] ?? "Usuario";

  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((piece) => piece.charAt(0).toUpperCase() + piece.slice(1))
    .join(" ");
}

function readProfileDisplayNameFromStorage(): string | null {
  if (!isBrowser()) return null;

  const rawValue = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as {
      activeProfileId?: string;
      profiles?: Array<{
        id?: string;
        profile?: {
          nombre?: string;
          apellido?: string;
        };
      }>;
      profile?: {
        nombre?: string;
        apellido?: string;
      };
    };

    const activeProfile = parsed.profiles?.find(
      (item) => item.id === parsed.activeProfileId
    );

    const profileSource = activeProfile?.profile ?? parsed.profile;
    const fullName = `${profileSource?.nombre ?? ""} ${
      profileSource?.apellido ?? ""
    }`.trim();

    return fullName || null;
  } catch {
    return null;
  }
}

function resolveSessionDisplayName(seed: SessionSeed): string {
  const profileDisplayName = readProfileDisplayNameFromStorage();
  if (profileDisplayName) return profileDisplayName;

  if (seed.name?.trim()) return seed.name.trim();

  return normalizeDisplayName(seed.email);
}

function writeSessionCookie(session: MockSession) {
  if (!isBrowser()) return;

  const maxAgeSeconds = Math.max(
    0,
    Math.floor((session.expiresAt - Date.now()) / 1000)
  );

  document.cookie = `${SESSION_COOKIE_KEY}=${encodeURIComponent(
    session.sessionId
  )}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearSessionCookie() {
  if (!isBrowser()) return;

  document.cookie = `${SESSION_COOKIE_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function createMockSession(seed: SessionSeed): MockSession {
  const now = Date.now();
  const duration = seed.rememberMe ? LONG_SESSION_MS : SHORT_SESSION_MS;

  return {
    sessionId: crypto.randomUUID(),
    rememberMe: seed.rememberMe,
    createdAt: now,
    expiresAt: now + duration,
    user: {
      name: resolveSessionDisplayName(seed),
      email: seed.email,
    },
  };
}

function readRegisteredUsersUnsafe(): MockRegisteredUser[] {
  if (!isBrowser()) return [];

  const rawValue = localStorage.getItem(USERS_STORAGE_KEY);
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue) as MockRegisteredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(USERS_STORAGE_KEY);
    return [];
  }
}

export function readRegisteredUsers(): MockRegisteredUser[] {
  return readRegisteredUsersUnsafe();
}

export function findRegisteredUserByEmail(email: string): MockRegisteredUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const user = readRegisteredUsersUnsafe().find(
    (candidate) => candidate.email.toLowerCase() === normalizedEmail
  );

  return user ?? null;
}

export function registerMockUser(input: {
  name: string;
  email: string;
  password: string;
}):
  | { ok: true; user: MockRegisteredUser }
  | { ok: false; reason: "email_taken" } {
  if (!isBrowser()) {
    return { ok: false, reason: "email_taken" };
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (findRegisteredUserByEmail(normalizedEmail)) {
    return { ok: false, reason: "email_taken" };
  }

  const users = readRegisteredUsersUnsafe();
  const user: MockRegisteredUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    password: input.password,
    createdAt: Date.now(),
  };

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...users, user]));

  return { ok: true, user };
}

export function authenticateMockUser(input: {
  email: string;
  password: string;
}): MockRegisteredUser | null {
  const normalizedEmail = input.email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const user = findRegisteredUserByEmail(normalizedEmail);
  if (!user) return null;

  if (user.password !== input.password) {
    return null;
  }

  return user;
}

export function saveSession(session: MockSession) {
  if (!isBrowser()) return;

  const rawValue = JSON.stringify(session);
  localStorage.setItem(SESSION_STORAGE_KEY, rawValue);
  cachedSessionRawValue = rawValue;
  cachedSessionSnapshot = session;
  writeSessionCookie(session);
}

export function clearSession() {
  if (!isBrowser()) return;

  localStorage.removeItem(SESSION_STORAGE_KEY);
  cachedSessionRawValue = null;
  cachedSessionSnapshot = null;
  clearSessionCookie();
}

export function readSession(): MockSession | null {
  if (!isBrowser()) return null;

  const rawValue = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawValue) return null;

  if (cachedSessionRawValue === rawValue) {
    return cachedSessionSnapshot;
  }

  try {
    const parsed = JSON.parse(rawValue) as MockSession;
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      clearSession();
      return null;
    }

    cachedSessionRawValue = rawValue;
    cachedSessionSnapshot = parsed;
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function hasActiveSession() {
  return readSession() !== null;
}
