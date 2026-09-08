"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  generateResume,
  saveDashboardDraft,
  type GeneratedResume,
} from "@/lib/api/resumes";
import { createApiRequestError } from "@/lib/backend";
import type { DashboardDraftData } from "@/lib/types/dashboard.types";
import type { ResumeTemplateId } from "@shared-types/resume";
import { queryKeys } from "@/lib/query/queryKeys";
import { useCurrentUserId } from "@/hooks/useCurrentUserId";

export function useSaveDashboardDraftMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: (input: { draft: DashboardDraftData; resumeId?: string }) =>
      saveDashboardDraft(input),
    onSuccess: (saved, { resumeId }) => {
      if (userId) {
        queryClient.setQueryData(
          queryKeys.dashboardDraft.detail(userId, resumeId),
          saved,
        );
      }
      // The drafts list sorts on updatedAt, which this write just changed.
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
    },
  });
}

export function useGenerateResumeMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    GeneratedResume,
    Error,
    {
      title: string;
      templateId: ResumeTemplateId;
      purpose?: string;
      resumeId?: string;
    }
  >({
    /* Wrapped, not passed straight through: a 401 has to arrive at the caller
       as a BackendRequestError or the dashboard's session-expiry handler
       (`isUnauthorizedBackendError`) will not recognise it and the user gets a
       generic toast instead of being signed out. */
    mutationFn: async (input) => {
      try {
        return await generateResume(input);
      } catch (error) {
        throw createApiRequestError(error, "Could not generate your resume");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
    },
  });
}
