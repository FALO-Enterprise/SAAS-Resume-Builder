import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { DashboardDraftData } from './types/dashboard.types';
import type { ResumeTemplateId } from '@shared-types/resume';
import { PlanName } from "./types/auth.types";
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

    const source = error as BackendErrorPayload;
    const responseData = source.response?.data;
    const payload = responseData && typeof responseData === 'object'
        ? responseData as BackendErrorPayload
        : source;
    const fromMessage = payload.message;
    const fromError = payload.error;

    if (typeof fromMessage === 'string' && fromMessage.trim()) return fromMessage;
    if (typeof fromError === "string") return fromError;
    if (fromError && typeof fromError === "object" && "message" in fromError) {
        const nestedMessage = (fromError as { message?: unknown }).message;
        if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
    }

    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

function backendErrorStatus(error: unknown): number | null {
    if (!error || typeof error !== 'object') return null;

    const source = error as BackendErrorPayload;
    const status = [
        source.response?.status,
        source.status,
        source.statusCode,
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

export async function getDashboardDraft(token: string) {
    try {
        const { data } = await apiClient.get(API_ENDPOINTS.auth.dashboard, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
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

export async function saveDashboardDraft(token: string, draft: DashboardDraftData) {
    try {
        const payload = createDashboardDraftPayload(draft);

        const { data } = await apiClient.put(API_ENDPOINTS.auth.dashboard, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
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
    input: { title: string; templateId: ResumeTemplateId },
): Promise<GeneratedResume> {
    try {
        const { data } = await apiClient.post(
            API_ENDPOINTS.resumes.generate,
            input,
            {
                headers: { Authorization: `Bearer ${token}` },
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
