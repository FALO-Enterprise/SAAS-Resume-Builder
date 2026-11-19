"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDashboardDraft } from "@/lib/api/resumes";
import { queryKeys } from "@/lib/query/queryKeys";
import { ANONYMOUS_USER_ID, useCurrentUserId } from "@/hooks/useCurrentUserId";

export function useDashboardDraftQuery(resumeId?: string, enabled = true) {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.dashboardDraft.detail(
      userId ?? ANONYMOUS_USER_ID,
      resumeId,
    ),
    queryFn: ({ signal }) => fetchDashboardDraft(resumeId, signal),
    enabled: enabled && Boolean(userId),
    // The draft is edited locally and autosaved; refetching it out from under
    // an in-progress edit would discard the user's typing.
    staleTime: Infinity,
  });
}
