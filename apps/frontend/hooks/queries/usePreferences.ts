"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/api/preferences";
import { queryKeys } from "@/lib/query/queryKeys";
import { ANONYMOUS_USER_ID, useCurrentUserId } from "@/hooks/useCurrentUserId";

export function useNotificationPreferencesQuery(enabled = true) {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.users.preferences(userId ?? ANONYMOUS_USER_ID),
    queryFn: fetchNotificationPreferences,
    enabled: enabled && Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      updateNotificationPreferences(preferences),
    onSuccess: (saved) => {
      if (!userId) return;
      queryClient.setQueryData(queryKeys.users.preferences(userId), saved);
    },
  });
}
