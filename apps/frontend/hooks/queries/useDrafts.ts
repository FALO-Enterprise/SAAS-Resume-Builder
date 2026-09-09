"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchDrafts } from "@/lib/api/drafts";
import { queryKeys } from "@/lib/query/queryKeys";
import { ANONYMOUS_USER_ID, useCurrentUserId } from "@/hooks/useCurrentUserId";

export function useDraftsQuery(enabled = true) {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.drafts.list(userId ?? ANONYMOUS_USER_ID),
    queryFn: fetchDrafts,
    enabled: enabled && Boolean(userId),
  });
}
