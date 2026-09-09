import { ApiError, getErrorMessage } from "@/lib/api/errors";

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string | { message?: string };
};

export function isEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return (
    Boolean(payload) &&
    typeof payload === "object" &&
    "success" in (payload as object)
  );
}


export function unwrap<T>(
  payload: ApiEnvelope<T> | T | undefined | null,
  fallback: string,
): T {
  if (payload === undefined || payload === null) {
    throw new ApiError(fallback);
  }

  if (isEnvelope<T>(payload)) {
    if (payload.success) {
      if (payload.data === undefined) throw new ApiError(fallback);
      return payload.data;
    }

    throw new ApiError(getErrorMessage(payload, fallback));
  }

  return payload as T;
}

export function unwrapOptional<T>(
  payload: ApiEnvelope<T> | T | undefined | null,
  fallback: string,
): T | undefined {
  if (payload === undefined || payload === null) return undefined;
  return unwrap(payload, fallback);
}
