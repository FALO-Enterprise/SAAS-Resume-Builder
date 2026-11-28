import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { unwrap, type ApiEnvelope } from "@/lib/api/envelope";

export type PlanTier = "FREE" | "PRO" | "ENTERPRISE";

export type UserUsageDetails = {
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  resumesExported: number;
  resumesExportLimit: number;
  resumesStored: number;
  resumesStoreLimit: number;
};

export type BillingSubscriptionDetails = {
  plan: PlanTier;
  status: "ACTIVE" | "CANCELED" | "EXPIRED" | "PAST_DUE";
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  updatePaymentUrl: string | null;
  cancelUrl: string | null;
  paddleSubscriptionId: string | null;
  price: number;
  usage?: UserUsageDetails;
};

export type CheckoutSessionResponse = {
  clientToken: string;
  environment: "sandbox" | "production";
  priceId: string;
  planId: string;
  customData: {
    userId: string;
    userEmail?: string;
    planId: string;
  };
};

export type PublicPlan = {
  name: PlanTier;
  price: number;
  maxResumes: number;
  hasWatermark: boolean;
  canExportPDF: boolean;
  canUseTemplates: boolean;
};

export type CheckoutSyncResult = {
  success: boolean;
  plan: PlanTier;
  status: string;
  transactionId?: string | null;
  currentPeriodEnd?: string | null;
};

export async function fetchPublicPlans(): Promise<PublicPlan[]> {
  const { data } = await apiClient.get<ApiEnvelope<{ plans: PublicPlan[] }>>(
    API_ENDPOINTS.payments.plans,
  );

  const { plans } = unwrap(data, "Could not fetch plans");
  return Array.isArray(plans) ? plans : [];
}

export async function fetchBillingSubscription(
  signal?: AbortSignal,
): Promise<BillingSubscriptionDetails> {
  const { data } = await apiClient.get<
    ApiEnvelope<BillingSubscriptionDetails> | BillingSubscriptionDetails
  >(API_ENDPOINTS.payments.subscription, { signal });

  return unwrap(data, "Could not fetch billing subscription");
}

export async function createCheckoutSession(
  planId: string,
): Promise<CheckoutSessionResponse> {
  const { data } = await apiClient.post<
    ApiEnvelope<CheckoutSessionResponse> | CheckoutSessionResponse
  >(API_ENDPOINTS.payments.checkoutSession, { planId });

  return unwrap(data, "Could not create checkout session");
}

export async function syncCheckout(input: {
  planId: string;
  transactionId?: string;
}): Promise<CheckoutSyncResult> {
  const { data } = await apiClient.post<
    ApiEnvelope<CheckoutSyncResult> | CheckoutSyncResult
  >(API_ENDPOINTS.payments.syncCheckout, input);

  return unwrap(data, "Could not synchronize payment state");
}

export async function cancelSubscription(
  immediately = false,
): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post<
    ApiEnvelope<{ success: boolean; message: string }>
  >(API_ENDPOINTS.payments.cancel, { immediately });

  return unwrap(data, "Could not cancel subscription");
}
