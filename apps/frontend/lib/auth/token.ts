const ACCESS_TOKEN_KEY = "resumax_token";

function canUseBrowserApis() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!canUseBrowserApis()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  if (!canUseBrowserApis()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  document.cookie = `${ACCESS_TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearAccessToken() {
  if (!canUseBrowserApis()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
}

export { ACCESS_TOKEN_KEY };
