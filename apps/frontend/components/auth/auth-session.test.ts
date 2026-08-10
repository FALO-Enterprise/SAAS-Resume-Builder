import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTH_TOKEN_KEY,
  clearAuthToken,
  getAuthTokenFromCookie,
  hasActiveAuthToken,
  persistAuthToken,
} from "../../lib/auth-session";

function createMemoryStorage() {
  const values = new Map<string, string>();

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("persists the JWT in local storage and the route-guard cookie", () => {
  const storage = createMemoryStorage();
  const cookies: string[] = [];

  persistAuthToken("header.payload.signature", {
    storage,
    writeCookie: (cookie) => cookies.push(cookie),
    secure: false,
  });

  assert.equal(storage.getItem(AUTH_TOKEN_KEY), "header.payload.signature");
  assert.equal(
    cookies[0],
    "resumax_token=header.payload.signature; path=/; max-age=2592000; SameSite=Lax",
  );
  assert.equal(
    hasActiveAuthToken(storage, "theme=dark; resumax_token=header.payload.signature"),
    true,
  );
});

test("does not accept a missing or different route-guard cookie", () => {
  const storage = createMemoryStorage();
  storage.setItem(AUTH_TOKEN_KEY, "current-token");

  assert.equal(hasActiveAuthToken(storage, ""), false);
  assert.equal(
    hasActiveAuthToken(storage, "resumax_token=another-token"),
    false,
  );
});

test("reads encoded cookie values and clears both JWT copies", () => {
  const storage = createMemoryStorage();
  const cookies: string[] = [];
  storage.setItem(AUTH_TOKEN_KEY, "token/value");

  assert.equal(
    getAuthTokenFromCookie("resumax_token=token%2Fvalue"),
    "token/value",
  );

  clearAuthToken({
    storage,
    writeCookie: (cookie) => cookies.push(cookie),
    secure: true,
  });

  assert.equal(storage.getItem(AUTH_TOKEN_KEY), null);
  assert.equal(
    cookies[0],
    "resumax_token=; path=/; max-age=0; SameSite=Lax; Secure",
  );
});
