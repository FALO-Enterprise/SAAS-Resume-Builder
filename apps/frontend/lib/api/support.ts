import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { isEnvelope, type ApiEnvelope } from "@/lib/api/envelope";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

export interface SupportContactPayload {
  name: string;
  email: string;
  topic: string;
  message: string;
  locale: string;
  website?: string;
}

export interface SupportContactResult {
  received: boolean;
  delivered?: boolean;
}

export async function sendSupportMessage(
  payload: SupportContactPayload,
): Promise<SupportContactResult> {
  const { data } = await apiClient.post<
    ApiEnvelope<SupportContactResult> | SupportContactResult
  >(API_ENDPOINTS.support.contact, payload);

  if (isEnvelope<SupportContactResult>(data)) {
    if (!data.success) {
      throw new ApiError(getErrorMessage(data, "Request failed"));
    }
    return data.data ?? { received: true };
  }

  return data as SupportContactResult;
}
