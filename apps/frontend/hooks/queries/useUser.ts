"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "@/lib/api/user";
import type { AuthUser as User } from "@/lib/types/auth.types";
import { queryKeys } from "@/lib/query/queryKeys";
import { ANONYMOUS_USER_ID } from "@/hooks/useCurrentUserId";

export function useUserQuery(userId?: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId ?? ANONYMOUS_USER_ID),
    queryFn: () => fetchUserProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUpdateUserMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) =>
      updateUserProfile(userId as string, payload),
    onSuccess: (updated) => {
      if (!userId) return;
      queryClient.setQueryData<User>(queryKeys.users.detail(userId), updated);
    },
  });
}

export function useDeleteUserMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteUserProfile(userId as string),
    onSuccess: () => {
      // The account is gone, so nothing cached about it is still valid — not
      // just the profile row. logout() clears the rest of the cache.
      queryClient.removeQueries({ queryKey: queryKeys.users.all });
      queryClient.removeQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}
