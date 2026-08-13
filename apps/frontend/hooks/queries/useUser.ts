"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from "@/lib/api/user";
import type { AuthUser as User} from "@/lib/types/auth.types";
import { queryKeys } from "@/lib/query/queryKeys";

export function useUserQuery(userId?: string) {
  return useQuery({
    queryKey: userId ? queryKeys.user.detail(userId) : ["user", "missing-id"],
    queryFn: () => fetchUserProfile(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUpdateUserMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: FormData) => updateUserProfile(userId as string, payload),
    onSuccess: (updated) => {
      if (!userId) return;
      queryClient.setQueryData<User>(
        queryKeys.user.detail(userId),
        updated
      );
    },
  });
}

export function useDeleteUserMutation(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteUserProfile(userId as string),
    onSuccess: () => {
      if (!userId) return;
      queryClient.removeQueries({ queryKey: queryKeys.user.detail(userId) });
    },
  });
}