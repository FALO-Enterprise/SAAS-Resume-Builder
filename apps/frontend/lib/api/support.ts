import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { NormalizedApiError } from "@/lib/api/client";

export interface SupportContactPayload {
  name: string;
  email: string;
  topic: string;
  message: string;
  locale: string;
  /** Honeypot — must stay empty. Bots that fill every field trip it. */
  website?: string;
}

export interface SupportContactResult {
  received: boolean;
  delivered?: boolean;
}

/**
 * Posts a help-centre message.
 *
 * Errors are thrown rather than returned so react-query can drive the retry
 * and error state; the caller maps them to a user-facing string.
 */
export async function sendSupportMessage(
  payload: SupportContactPayload,
): Promise<SupportContactResult> {
  const { data } = await apiClient.post(API_ENDPOINTS.support.contact, payload);

  if (data && typeof data === "object" && "success" in data) {
    const envelope = data as {
      success: boolean;
      data?: SupportContactResult;
      error?: string | { message?: string };
    };

    if (!envelope.success) {
      const message =
        typeof envelope.error === "string"
          ? envelope.error
          : envelope.error?.message;
      throw new Error(message || "Request failed");
    }

    return envelope.data ?? { received: true };
  }

  return data as SupportContactResult;
}

export type { NormalizedApiError };
