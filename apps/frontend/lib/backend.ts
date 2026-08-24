import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { DashboardDraftData } from './types/dashboard.types';
import type { ResumeTemplateId } from '@shared-types/resume';
import { PlanName } from "./types/auth.types";
import { getAccessToken } from "./auth/token";
// import type { NormalizedApiError } from "@/lib/api/client";


const DEFAULT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";

export function buildBackendUrl(path: string) {
    const baseUrl = (DEFAULT_BACKEND_URL || "http://127.0.0.1:3001").replace(/\/$/, "");
    return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizeBackendPayload<T>(payload: unknown): T | { error: string } {
    if (payload && typeof payload === "object" && "success" in payload) {
        const p = payload as { success: boolean; data?: T; error?: string | { message?: string } };

        if (p.success) {
            return (p.data ?? payload) as T;
        }

        if (typeof p.error === "string") {
            return { error: p.error };
        }

        return {
            error: (p.error as { message?: string })?.message || "Request failed",
        };
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

type BackendErrorPayload = {
    message?: unknown;
    error?: unknown;
    status?: unknown;
    statusCode?: unknown;
    response?: {
        status?: unknown;
        data?: unknown;
    };
};

function backendErrorMessage(error: unknown, fallback: string) {
    if (!error || typeof error !== 'object') return fallback;

    const source = error as { message?: unknown; error?: unknown; status?: unknown; response?: { data?: unknown } };

    if (typeof source.message === 'string' && source.message.trim()) {
        return source.message;
    }

    const responseData = source.response?.data;
    const payload = responseData && typeof responseData === 'object'
        ? responseData as { message?: unknown; error?: unknown }
        : null;

    if (payload) {
        if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
        if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
    }

    if (typeof source.error === 'string' && source.error.trim()) return source.error;
    if (error instanceof Error && error.message) return error.message;

    return fallback;
}

function backendErrorStatus(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null;

    const source = error as { status?: unknown; statusCode?: unknown; response?: { status?: unknown } };
    const status = [
        source.status,
        source.statusCode,
        source.response?.status,
    ].find((value): value is number => typeof value === 'number');

    return status ?? null;
}

export class BackendRequestError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name = 'BackendRequestError';
    }
}

export function isUnauthorizedBackendError(error: unknown): error is BackendRequestError {
    return error instanceof BackendRequestError && error.status === 401;
}

function createBackendRequestError(
    response: Response,
    payload: unknown,
    fallback: string,
) {
    return new BackendRequestError(
        backendErrorMessage(payload, fallback),
        response.status,
    );
}

export function createAuthenticatedRequestError(
    response: Response,
    payload: unknown,
    fallback: string,
) {
    if (response.status === 401) {
        return new BackendRequestError(
            'Your session has expired. Please sign in again.',
            response.status,
        );
    }

    return createBackendRequestError(response, payload, fallback);
}

export function createApiRequestError(error: unknown, fallback: string) {
    const status = backendErrorStatus(error);
    if (status === 401) {
        return new BackendRequestError(
            'Your session has expired. Please sign in again.',
            status,
        );
    }

    const message = backendErrorMessage(error, fallback);
    return status === null
        ? new Error(message)
        : new BackendRequestError(message, status);
}

export async function loginWithBackend(input: { email: string; password: string }) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.login, input);
        return normalizeBackendPayload<AuthSession>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Login failed"));
    }
}

export async function registerWithBackend(input: { name: string; email: string; password: string; locale?: 'en' | 'ar'; planId?: 'free' | 'pro' | 'enterprise' }) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.register, input);
        return normalizeBackendPayload<RegistrationResponse>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Registration failed"));
    }
}

export function getOAuthStartUrl(provider: 'google' | 'github' | 'linkedin', locale: string) {
    return buildBackendUrl(API_ENDPOINTS.auth.oauthStart(provider, locale));
}

export async function exchangeOAuthCode(code: string) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.oauthExchange, { code });
        return normalizeBackendPayload<AuthSession>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Social sign-in failed"));
    }
}

export async function requestPasswordReset(input: {
    email: string;
    locale: 'en' | 'ar';
}) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.forgotPassword, input);
        return normalizeBackendPayload<{ message: string }>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Could not send the reset email"));
    }
}

export async function validatePasswordResetToken(token: string) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.validateResetToken, { token });
        return normalizeBackendPayload<{ valid: boolean }>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Could not validate the reset link"));
    }
}

export async function resetPasswordWithBackend(input: {
    token: string;
    password: string;
}) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.resetPassword, input);
        return normalizeBackendPayload<{ message: string }>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Could not reset the password"));
    }

}

export async function verifyEmailCodeWithBackend(input: { email: string; code: string }) {
    try {
        // Default validateStatus rejects on non-2xx, so an invalid/expired
        // code surfaces as a real error instead of resolving with a body we
        // then have to fake a session out of. /auth/verify never returns 204.
        const { data } = await apiClient.post(API_ENDPOINTS.auth.verify, input);
        return normalizeBackendPayload<AuthSession>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Verification failed"));
    }
}

export async function resendVerificationCodeWithBackend(input: { email: string }) {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.auth.resendCode, input);
        return normalizeBackendPayload<{ success?: boolean; message?: string }>(data);
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
        const { data } = await apiClient.patch(API_ENDPOINTS.users.byId(id), payload);
        return normalizeBackendPayload<UserDetailsResponse>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Could not update user"));
    }
}

export async function deleteUserWithBackend(id: string) {
    try {
        const { data } = await apiClient.delete(API_ENDPOINTS.users.byId(id));
        return normalizeBackendPayload<{ success?: boolean; message?: string }>(data);
    } catch (error) {
        throw new Error(backendErrorMessage(error, "Could not delete user"));
    }
}

export async function getDashboardDraft(token?: string, resumeId?: string) {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.get(API_ENDPOINTS.auth.dashboard, {
            params: resumeId ? { resumeId } : {},
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        return normalizeBackendPayload<DashboardDraftData>(data);
    } catch (error) {
        throw createApiRequestError(error, "Could not fetch your dashboard");
    }
}

export function createDashboardDraftPayload(draft: DashboardDraftData) {
    return {
        template: draft.template,
        currentStep: draft.currentStep,
        completedSteps: draft.completedSteps,
        sectionOrder: draft.sectionOrder,
        contact: draft.contact,
        summary: draft.summary,
        skillGroups: draft.skillGroups,
        experience: draft.experience,
        projects: draft.projects,
        education: draft.education,
        certifications: draft.certifications,
        skills: draft.skills,
    };
}

export async function saveDashboardDraft(token: string, draft: DashboardDraftData, resumeId?: string) {
    try {
        const payload = createDashboardDraftPayload(draft);
        const authToken = token || getAccessToken();

        const { data } = await apiClient.put(API_ENDPOINTS.auth.dashboard, payload, {
            params: resumeId ? { resumeId } : {},
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        return normalizeBackendPayload<DashboardDraftData>(data);
    } catch (error) {
        throw createApiRequestError(error, "Could not save your dashboard");
    }
}

export type GeneratedResume = {
    id: string;
    title: string;
    templateId: ResumeTemplateId;
    userId: string;
    createdAt: string;
    updatedAt: string;
};

export async function generateCurrentResume(
    token: string,
    input: { title: string; templateId: ResumeTemplateId; purpose?: string },
    resumeId?: string,
): Promise<GeneratedResume> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.post(
            API_ENDPOINTS.resumes.generate,
            input,
            {
                params: resumeId ? { resumeId } : {},
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                timeout: 75_000,
            },
        );

        const normalized = normalizeBackendPayload<GeneratedResume>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not generate your resume');
    }
}

export type UserUsageDetails = {
    aiCreditsUsed: number;
    aiCreditsLimit: number;
    resumesExported: number;
    resumesExportLimit: number;
    resumesStored: number;
    resumesStoreLimit: number;
};

export type BillingSubscriptionDetails = {
    plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'CANCELED' | 'EXPIRED' | 'PAST_DUE';
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
    environment: 'sandbox' | 'production';
    priceId: string;
    planId: string;
    customData: {
        userId: string;
        userEmail?: string;
        planId: string;
    };
};

export type PublicPlan = {
    name: 'FREE' | 'PRO' | 'ENTERPRISE';
    price: number;
    maxResumes: number;
    hasWatermark: boolean;
    canExportPDF: boolean;
    canUseTemplates: boolean;
};

export async function getPublicPlans(): Promise<PublicPlan[]> {
    try {
        const { data } = await apiClient.get('/api/payments/plans');
        const normalized = normalizeBackendPayload<{ plans: PublicPlan[] }>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return Array.isArray(normalized.plans) ? normalized.plans : [];
    } catch (error) {
        throw createApiRequestError(error, 'Could not fetch plans');
    }
}

export async function getBillingSubscription(token?: string): Promise<BillingSubscriptionDetails> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.get('/api/payments/subscription', {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const normalized = normalizeBackendPayload<BillingSubscriptionDetails>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not fetch billing subscription');
    }
}

export async function createCheckoutSession(token: string, planId: string): Promise<CheckoutSessionResponse> {
    try {
        const { data } = await apiClient.post(
            '/api/payments/checkout-session',
            { planId },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const normalized = normalizeBackendPayload<CheckoutSessionResponse>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not create checkout session');
    }
}

export async function syncBillingCheckout(
    token: string,
    payload: { planId: string; transactionId?: string }
): Promise<{ success: boolean; plan: 'FREE' | 'PRO' | 'ENTERPRISE'; status: string; transactionId?: string | null; currentPeriodEnd?: string | null }> {
    try {
        const { data } = await apiClient.post(
            '/api/payments/sync-checkout',
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const normalized = normalizeBackendPayload<{ success: boolean; plan: 'FREE' | 'PRO' | 'ENTERPRISE'; status: string; transactionId?: string | null; currentPeriodEnd?: string | null }>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not synchronize payment state');
    }
}

export async function cancelBillingSubscription(token: string, immediately = false): Promise<{ success: boolean; message: string }> {
    try {
        const { data } = await apiClient.post(
            '/api/payments/cancel',
            { immediately },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const normalized = normalizeBackendPayload<{ success: boolean; message: string }>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not cancel subscription');
    }
}

export async function fetchBackendPreferences(token: string): Promise<Record<string, boolean> | null> {
    try {
        const { data } = await apiClient.get('/api/users/me/preferences', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const normalized = normalizeBackendPayload<Record<string, boolean>>(data);
        if (normalized && !('error' in normalized)) {
            return normalized;
        }
        return null;
    } catch {
        return null;
    }
}

export async function updateBackendPreferences(token: string, preferences: Record<string, boolean>): Promise<Record<string, boolean> | null> {
    try {
        const { data } = await apiClient.patch('/api/users/me/preferences', preferences, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const normalized = normalizeBackendPayload<Record<string, boolean>>(data);
        if (normalized && !('error' in normalized)) {
            return normalized;
        }
        return null;
    } catch (error) {
        console.warn('Failed to sync preferences to backend:', error);
        return null;
    }
}

export type AiCoachTip = {
    id: string;
    category: 'summary' | 'experience' | 'skills' | 'keywords' | 'general';
    title: string;
    description: string;
    suggestedActionText?: string;
    suggestedFix?: {
        targetField: 'summary' | 'title' | 'skills' | 'experience';
        experienceId?: string;
        value: any;
    };
};

export type AiCoachAnalysisResult = {
    atsScore: number;
    scoreBreakdown: {
        impact: number;
        keywords: number;
        clarity: number;
        completeness: number;
    };
    overallAssessment: string;
    tips: AiCoachTip[];
    suggestedSkills: string[];
    replyMessage?: string;
};

export async function analyzeWithAiCoach(
    token?: string,
    payload?: { draft?: any; userPrompt?: string; purpose?: string; resumeId?: string },
): Promise<AiCoachAnalysisResult> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.post('/api/resumes/ai-coach/analyze', payload ?? {}, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
            timeout: 60_000,
        });
        const normalized = normalizeBackendPayload<AiCoachAnalysisResult>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not run AI Coach analysis');
    }
}

export type ResumeDraftItem = {
    id: string;
    title: string;
    templateId?: string;
    templateName: string;
    updatedAt: string;
    thumbnailUrl?: string;
};

export async function fetchUserDrafts(token?: string): Promise<ResumeDraftItem[]> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.get('/api/resumes/drafts', {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const normalized = normalizeBackendPayload<ResumeDraftItem[]>(data);
        if (Array.isArray(normalized)) return normalized;
        if (normalized && 'error' in normalized) throw new Error((normalized as any).error);
        return [];
    } catch (error) {
        throw createApiRequestError(error, 'Could not fetch your saved drafts');
    }
}

export async function createUserDraft(token?: string): Promise<{ id: string; title: string; templateId: string }> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.post('/api/resumes/new-draft', {}, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const normalized = normalizeBackendPayload<{ id: string; title: string; templateId: string }>(data);
        if ('error' in normalized) throw new Error(normalized.error);
        return normalized;
    } catch (error) {
        throw createApiRequestError(error, 'Could not create new resume draft');
    }
}

export async function deleteUserDraft(token: string, resumeId: string): Promise<void> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.delete(`/api/resumes/${resumeId}`, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const normalized = normalizeBackendPayload<{ success: boolean }>(data);
        if (normalized && 'error' in normalized) throw new Error(normalized.error);
    } catch (error) {
        throw createApiRequestError(error, 'Could not delete resume draft');
    }
}

export async function updateUserDraftTitle(token: string, resumeId: string, title: string): Promise<void> {
    try {
        const authToken = token || getAccessToken();
        const { data } = await apiClient.patch(`/api/resumes/${resumeId}`, { title }, {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        const normalized = normalizeBackendPayload<{ id: string; title: string }>(data);
        if (normalized && 'error' in normalized) throw new Error(normalized.error);
    } catch (error) {
        throw createApiRequestError(error, 'Could not update resume title');
    }
}


