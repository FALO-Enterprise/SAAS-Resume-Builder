"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDraft, deleteDraft, updateDraftTitle } from "@/lib/api/drafts";
import type { ResumeDraftItem } from "@/lib/backend";
import { queryKeys } from "@/lib/query/queryKeys";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";

export function useCreateDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDraft,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}

export function useDeleteDraftMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: deleteDraft,
    onSuccess: (_data, resumeId) => {
      if (userId) {
        queryClient.setQueryData<ResumeDraftItem[]>(
          queryKeys.drafts.list(userId),
          (previous) => previous?.filter((draft) => draft.id !== resumeId),
        );
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}

export function useUpdateDraftTitleMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: updateDraftTitle,
    onSuccess: (_data, { resumeId, title }) => {
      if (userId) {
        queryClient.setQueryData<ResumeDraftItem[]>(
          queryKeys.drafts.list(userId),
          (previous) =>
            previous?.map((draft) =>
              draft.id === resumeId ? { ...draft, title } : draft,
            ),
        );
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}
