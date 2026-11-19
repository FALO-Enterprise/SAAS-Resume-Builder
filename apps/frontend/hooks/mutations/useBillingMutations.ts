"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  cancelSubscription,
  createCheckoutSession,
  syncCheckout,
} from "@/lib/api/billing";
import { queryKeys } from "@/lib/query/queryKeys";

function useInvalidatePlanScopedData() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.billing.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.drafts.all });
  };
}

export function useCreateCheckoutSessionMutation() {
  return useMutation({
    mutationFn: (planId: string) => createCheckoutSession(planId),
  });
}

export function useSyncCheckoutMutation() {
  const invalidatePlanScopedData = useInvalidatePlanScopedData();

  return useMutation({
    mutationFn: (input: { planId: string; transactionId?: string }) =>
      syncCheckout(input),
    onSuccess: invalidatePlanScopedData,
  });
}

export function useCancelSubscriptionMutation() {
  const invalidatePlanScopedData = useInvalidatePlanScopedData();

  return useMutation({
    mutationFn: (immediately: boolean = false) =>
      cancelSubscription(immediately),
    onSuccess: invalidatePlanScopedData,
  });
}
