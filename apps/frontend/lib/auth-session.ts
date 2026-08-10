export const AUTH_TOKEN_KEY = "resumax_token";

const AUTH_TOKEN_COOKIE_NAME = "resumax_token";
const AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type AuthTokenStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type AuthTokenWriter = {
  storage: AuthTokenStorage;
  writeCookie: (cookie: string) => void;
  secure: boolean;
};

function getBrowserWriter(): AuthTokenWriter {
  return {
    storage: window.localStorage,
    writeCookie: (cookie) => {
      document.cookie = cookie;
    },
    secure: window.location.protocol === "https:",
  };
}

function buildAuthTokenCookie(token: string, maxAge: number, secure: boolean) {
  const secureAttribute = secure ? "; Secure" : "";

  return `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttribute}`;
}

export function persistAuthToken(
  token: string,
  writer: AuthTokenWriter = getBrowserWriter(),
) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    throw new Error("Cannot persist an empty authentication token");
  }

  writer.storage.setItem(AUTH_TOKEN_KEY, normalizedToken);
  writer.writeCookie(
    buildAuthTokenCookie(
      normalizedToken,
      AUTH_TOKEN_MAX_AGE_SECONDS,
      writer.secure,
    ),
  );
}

export function clearAuthToken(writer: AuthTokenWriter = getBrowserWriter()) {
  writer.storage.removeItem(AUTH_TOKEN_KEY);
  writer.writeCookie(buildAuthTokenCookie("", 0, writer.secure));
}

export function getAuthTokenFromCookie(cookieHeader: string) {
  const cookiePrefix = `${AUTH_TOKEN_COOKIE_NAME}=`;
  const encodedToken = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length);

  if (!encodedToken) return null;

  try {
    return decodeURIComponent(encodedToken);
  } catch {
    return null;
  }
}

export function hasActiveAuthToken(
  storage: Pick<AuthTokenStorage, "getItem"> = window.localStorage,
  cookieHeader: string = document.cookie,
) {
  const storedToken = storage.getItem(AUTH_TOKEN_KEY);

  return Boolean(
    storedToken && getAuthTokenFromCookie(cookieHeader) === storedToken,
  );
}
