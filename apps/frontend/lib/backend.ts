const DEFAULT_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001'
export function buildBackendUrl(path: string) {
    const baseUrl = (DEFAULT_BACKEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
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

interface BackendAuthUser {
    name: string;
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

