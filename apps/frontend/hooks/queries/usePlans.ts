"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicPlans } from "@/lib/backend";
import { queryKeys } from "@/lib/query/queryKeys";

export function usePlansQuery() {
  return useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: getPublicPlans,
    // Prices change on the order of never, so refetching them per mount is
    // wasted traffic on a page that anonymous visitors land on constantly.
    staleTime: 5 * 60 * 1000,
  });
}
