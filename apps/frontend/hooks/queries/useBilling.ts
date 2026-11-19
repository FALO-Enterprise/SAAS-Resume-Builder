"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBillingSubscription } from "@/lib/api/billing";
import { queryKeys } from "@/lib/query/queryKeys";
import { ANONYMOUS_USER_ID, useCurrentUserId } from "@/hooks/useCurrentUserId";

export function useBillingSubscriptionQuery(enabled = true) {
  const userId = useCurrentUserId();

  return useQuery({
    queryKey: queryKeys.billing.subscription(userId ?? ANONYMOUS_USER_ID),
    queryFn: ({ signal }) => fetchBillingSubscription(signal),
    enabled: enabled && Boolean(userId),
  });
}
