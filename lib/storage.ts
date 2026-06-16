import type { ApiUser } from "./api";

const TOKEN_KEY = "d4i_token";
const USER_KEY = "d4i_user";
const AUTH_NOTICE_KEY = "d4i_auth_notice";
const SESSION_CACHE_PREFIX = "d4i_session_cache:";

export const AUTH_EXPIRED_EVENT = "auth:expired";

export function saveAuth(token: string, user: ApiUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadAuth(): {
  token: string;
  user: ApiUser;
} | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const userRaw = window.localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;

  try {
    const user = JSON.parse(userRaw) as ApiUser;
    return { token, user };
  } catch {
    clearAuth();
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function setAuthNotice(message: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_NOTICE_KEY, message);
}

export function consumeAuthNotice(): string | null {
  if (typeof window === "undefined") return null;
  const message = window.sessionStorage.getItem(AUTH_NOTICE_KEY);
  if (!message) return null;
  window.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  return message;
}

export function saveSessionCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    `${SESSION_CACHE_PREFIX}${key}`,
    JSON.stringify(value)
  );
}

export function loadSessionCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.sessionStorage.removeItem(`${SESSION_CACHE_PREFIX}${key}`);
    return null;
  }
}

export function clearSessionCache(prefix?: string) {
  if (typeof window === "undefined") return;
  const scopedPrefix = `${SESSION_CACHE_PREFIX}${prefix ?? ""}`;
  const keysToRemove: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key && key.startsWith(scopedPrefix)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
}
