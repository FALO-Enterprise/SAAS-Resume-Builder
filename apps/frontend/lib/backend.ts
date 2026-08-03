import type { DashboardDraftData } from './types/dashborad.types';

const DEFAULT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
export function buildBackendUrl(path: string) {
    const baseUrl = (DEFAULT_BACKEND_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function proxyToBackend(path: string, init?: RequestInit) {
    const response = await fetch(buildBackendUrl(path), {
        ...init,
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });

    const payload = await response.text();
    let parsedPayload: unknown = null;

    if (payload) {
        try {
            parsedPayload = JSON.parse(payload);
        } catch {
            parsedPayload = payload;
        }
    }

    return { response, payload: parsedPayload };
}

export function normalizeBackendPayload<T>(payload: unknown): T | { error: string } {
    if (payload && typeof payload === 'object' && 'success' in payload) {
        const p = payload as { success: boolean; data?: T; error?: string | { message?: string } }

        if (p.success) {
            return (p.data ?? payload) as T
        }

        if (typeof p.error === 'string') {
            return { error: p.error }
        }

        return {
            error: (p.error as { message?: string })?.message || 'Request failed',
        }
    }

    return payload as T
}

export interface BackendAuthUser {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
    email: string;
    plan: {
        name: 'FREE' | 'PRO' | 'ENTERPRISE';
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

function backendErrorMessage(payload: unknown, fallback: string) {
    if (typeof payload === 'string') return payload;

    const normalized = normalizeBackendPayload<{ error: string }>(payload)
    return normalized && 'error' in normalized ? normalized.error : fallback
}

export async function loginWithBackend(input: { email: string; password: string }) {
    const { response, payload } = await proxyToBackend('/api/auth/login-jwt', {
        method: 'POST',
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Login failed'))
    }

    return normalizeBackendPayload<AuthSession>(payload);
}

export async function registerWithBackend(input: { name: string; email: string; password: string; locale?: 'en' | 'ar'; planId?: 'free' | 'pro' | 'enterprise' }) {
    const { response, payload } = await proxyToBackend('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Registration failed'))
    }

    return normalizeBackendPayload<RegistrationResponse>(payload);
}

export function getOAuthStartUrl(provider: 'google' | 'github' | 'linkedin', locale: string) {
    const safeLocale = locale === 'ar' ? 'ar' : 'en';
    return buildBackendUrl(`/api/auth/oauth/${provider}?locale=${safeLocale}`);
}

export async function exchangeOAuthCode(code: string) {
    const { response, payload } = await proxyToBackend('/api/auth/oauth/exchange', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Social sign-in failed'));
    }

    return normalizeBackendPayload<AuthSession>(payload);
}

export async function requestPasswordReset(input: {
    email: string;
    locale: 'en' | 'ar';
}) {
    const { response, payload } = await proxyToBackend('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Could not send the reset email'));
    }

    return normalizeBackendPayload<{ message: string }>(payload);
}

export async function validatePasswordResetToken(token: string) {
    const { response, payload } = await proxyToBackend('/api/auth/validate-reset-token', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Could not validate the reset link'));
    }

    return normalizeBackendPayload<{ valid: boolean }>(payload);
}

export async function resetPasswordWithBackend(input: {
    token: string;
    password: string;
}) {
    const { response, payload } = await proxyToBackend('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Could not reset the password'));
    }

    return normalizeBackendPayload<{ message: string }>(payload);
}

async function dashboardRequest(token: string, init?: RequestInit) {
    const { response, payload } = await proxyToBackend('/api/dashboard', {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(init?.headers ?? {}),
        },
    });

    if (!response.ok) {
        throw new Error(backendErrorMessage(payload, 'Could not save your dashboard'));
    }

    const normalized = normalizeBackendPayload<DashboardDraftData>(payload);
    if ('error' in normalized) throw new Error(normalized.error);
    return normalized;
}

export function getDashboardDraft(token: string) {
    return dashboardRequest(token);
}

export function saveDashboardDraft(token: string, draft: DashboardDraftData) {
    return dashboardRequest(token, {
        method: 'PUT',
        body: JSON.stringify({
            template: draft.template,
            currentStep: draft.currentStep,
            completedSteps: draft.completedSteps,
            contact: draft.contact,
            experience: draft.experience,
            education: draft.education,
            certifications: draft.certifications,
            skills: draft.skills,
        }),
    });
}

