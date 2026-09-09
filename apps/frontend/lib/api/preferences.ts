import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { unwrap, type ApiEnvelope } from "@/lib/api/envelope";

export type NotificationPreferences = Record<string, boolean>;

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await apiClient.get<
    ApiEnvelope<NotificationPreferences> | NotificationPreferences
  >(API_ENDPOINTS.users.preferences);

  return unwrap(data, "Could not fetch your preferences");
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const { data } = await apiClient.patch<
    ApiEnvelope<NotificationPreferences> | NotificationPreferences
  >(API_ENDPOINTS.users.preferences, preferences);

  return unwrap(data, "Could not save your preferences");
}
