export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(
    message: string,
    options: { status?: number; code?: string } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.code = options.code;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

function firstNonEmptyString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function messageFromPayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const source = payload as { message?: unknown; error?: unknown };
  const nested =
    source.error && typeof source.error === "object"
      ? (source.error as { message?: unknown }).message
      : undefined;

  return firstNonEmptyString(source.message, source.error, nested);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error.trim() ? error : fallback;
  if (typeof error !== "object") return fallback;

  const raw = error as { response?: { data?: unknown } };

  return (
    messageFromPayload(error) ??
    messageFromPayload(raw.response?.data) ??
    fallback
  );
}

export function readErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  const source = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };

  for (const value of [
    source.status,
    source.statusCode,
    source.response?.status,
  ]) {
    if (typeof value === "number") return value;
  }

  return undefined;
}

export function isUnauthorizedError(error: unknown): boolean {
  return readErrorStatus(error) === 401;
}

export function isClientError(error: unknown): boolean {
  const status = readErrorStatus(error);
  return status !== undefined && status >= 400 && status < 500;
}
