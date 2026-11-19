import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { getErrorMessage, readErrorStatus } from "@/lib/api/errors";
import type { DashboardDraftData } from "./types/dashboard.types";
import { PlanName } from "./types/auth.types";

import * as billingApi from "@/lib/api/billing";
import * as resumesApi from "@/lib/api/resumes";

export type {
  GeneratedResume,
  ResumeDraftItem,
  AiCoachTip,
  AiCoachAnalysisResult,
} from "@/lib/api/resumes";

export type {
  UserUsageDetails,
  BillingSubscriptionDetails,
  CheckoutSessionResponse,
  PublicPlan,
} from "@/lib/api/billing";

export { createDashboardDraftPayload } from "@/lib/api/resumes";

const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";

export function buildBackendUrl(path: string) {
  const baseUrl = DEFAULT_BACKEND_URL.replace(/\/$/, "");
  return baseUrl + (path.startsWith("/") ? path : "/" + path);
}

export function normalizeBackendPayload<T>(
  payload: unknown,
): T | { error: string } {
  if (payload && typeof payload === "object" && "success" in payload) {
    const p = payload as {
      success: boolean;
      data?: T;
      error?: string | { message?: string };
    };

    if (p.success) {
      return (p.data ?? payload) as T;
    }

    return { error: getErrorMessage(p, "Request failed") };
  }

  return payload as T;
}

export interface BackendAuthUser {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
  email: string;
  isVerified: boolean;
  plan: {
    name: PlanName;
  };
}

export interface AuthSession {
  token: string;
  user: BackendAuthUser;
}

export interface RegistrationResponse {
  user: BackendAuthUser;
  message: string;
}

export interface UserDetailsResponse {
  user: BackendAuthUser;
}


function backendErrorMessage(error: unknown, fallback: string) {
  return getErrorMessage(error, fallback);
}

function backendErrorStatus(error: unknown): number | null {
  return readErrorStatus(error) ?? null;
}

export class BackendRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "BackendRequestError";
  }
}

export function isUnauthorizedBackendError(
  error: unknown,
): error is BackendRequestError {
  return error instanceof BackendRequestError && error.status === 401;
}

const EXPIRED_SESSION_MESSAGE =
  "Your session has expired. Please sign in again.";

export function createAuthenticatedRequestError(
  response: Response,
  payload: unknown,
  fallback: string,
) {
  if (response.status === 401) {
    return new BackendRequestError(EXPIRED_SESSION_MESSAGE, response.status);
  }

  return new BackendRequestError(
    backendErrorMessage(payload, fallback),
    response.status,
  );
}

export function createApiRequestError(error: unknown, fallback: string) {
  const status = backendErrorStatus(error);

  if (status === 401) {
    return new BackendRequestError(EXPIRED_SESSION_MESSAGE, status);
  }

  const message = backendErrorMessage(error, fallback);

  return status === null
    ? new Error(message)
    : new BackendRequestError(message, status);
}

export async function loginWithBackend(input: {
  email: string;
  password: string;
}) {
  try {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.login, input);
    return normalizeBackendPayload<AuthSession>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Login failed"));
  }
}

export async function registerWithBackend(input: {
  name: string;
  email: string;
  password: string;
  locale?: "en" | "ar";
  planId?: "free" | "pro" | "enterprise";
}) {
  try {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.register, input);
    return normalizeBackendPayload<RegistrationResponse>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Registration failed"));
  }
}

export function getOAuthStartUrl(
  provider: "google" | "github" ,
  locale: string,
) {
  return buildBackendUrl(API_ENDPOINTS.auth.oauthStart(provider, locale));
}

export async function exchangeOAuthCode(code: string) {
  try {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.oauthExchange, {
      code,
    });
    return normalizeBackendPayload<AuthSession>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Social sign-in failed"));
  }
}

export async function requestPasswordReset(input: {
  email: string;
  locale: "en" | "ar";
}) {
  try {
    const { data } = await apiClient.post(
      API_ENDPOINTS.auth.forgotPassword,
      input,
    );
    return normalizeBackendPayload<{ message: string }>(data);
  } catch (error) {
    throw new Error(
      backendErrorMessage(error, "Could not send the reset email"),
    );
  }
}

export async function validatePasswordResetToken(token: string) {
  try {
    const { data } = await apiClient.post(
      API_ENDPOINTS.auth.validateResetToken,
      { token },
    );
    return normalizeBackendPayload<{ valid: boolean }>(data);
  } catch (error) {
    throw new Error(
      backendErrorMessage(error, "Could not validate the reset link"),
    );
  }
}

export async function resetPasswordWithBackend(input: {
  token: string;
  password: string;
}) {
  try {
    const { data } = await apiClient.post(
      API_ENDPOINTS.auth.resetPassword,
      input,
    );
    return normalizeBackendPayload<{ message: string }>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Could not reset the password"));
  }
}

export async function verifyEmailCodeWithBackend(input: {
  email: string;
  code: string;
}) {
  try {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.verify, input);
    return normalizeBackendPayload<AuthSession>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Verification failed"));
  }
}

export async function resendVerificationCodeWithBackend(input: {
  email: string;
}) {
  try {
    const { data } = await apiClient.post(API_ENDPOINTS.auth.resendCode, input);
    return normalizeBackendPayload<{ success?: boolean; message?: string }>(
      data,
    );
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Could not resend code"));
  }
}

export async function getUserByIdWithBackend(id: string) {
  try {
    const { data } = await apiClient.get(API_ENDPOINTS.users.byId(id));
    return normalizeBackendPayload<UserDetailsResponse>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Could not fetch user"));
  }
}

export async function updateUserWithBackend(id: string, payload: FormData) {
  try {
    const { data } = await apiClient.patch(
      API_ENDPOINTS.users.byId(id),
      payload,
    );
    return normalizeBackendPayload<UserDetailsResponse>(data);
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Could not update user"));
  }
}

export async function deleteUserWithBackend(id: string) {
  try {
    const { data } = await apiClient.delete(API_ENDPOINTS.users.byId(id));
    return normalizeBackendPayload<{ success?: boolean; message?: string }>(
      data,
    );
  } catch (error) {
    throw new Error(backendErrorMessage(error, "Could not delete user"));
  }
}

/** @deprecated Use `useDashboardDraftQuery`. `token` is ignored. */
export async function getDashboardDraft(_token?: string, resumeId?: string) {
  try {
    return await resumesApi.fetchDashboardDraft(resumeId);
  } catch (error) {
    throw createApiRequestError(error, "Could not fetch your dashboard");
  }
}

/** @deprecated Use `useSaveDashboardDraftMutation`. `token` is ignored. */
export async function saveDashboardDraft(
  _token: string,
  draft: DashboardDraftData,
  resumeId?: string,
) {
  try {
    return await resumesApi.saveDashboardDraft({ draft, resumeId });
  } catch (error) {
    throw createApiRequestError(error, "Could not save your dashboard");
  }
}

export async function getPublicPlans() {
  try {
    return await billingApi.fetchPublicPlans();
  } catch (error) {
    throw createApiRequestError(error, "Could not fetch plans");
  }
}
