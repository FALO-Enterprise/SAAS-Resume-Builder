import {
  AUTH_TOKEN_KEY,
  clearAuthToken,
  persistAuthToken,
} from "@/lib/auth-session";

const ACCESS_TOKEN_KEY = AUTH_TOKEN_KEY;

function canUseBrowserApis() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseBrowserApis()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  if (!canUseBrowserApis()) return;
  persistAuthToken(token);
}

export function clearAccessToken() {
  if (!canUseBrowserApis()) return;
  clearAuthToken();
}

export { ACCESS_TOKEN_KEY };
