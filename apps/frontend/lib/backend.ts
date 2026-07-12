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
    const parsedPayload = payload ? JSON.parse(payload) : null;

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

export interface AuthSession {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        locale: 'en' | 'ar';
        activePlanId: 'free' | 'pro' | 'enterprise';
        role: 'USER' | 'ADMIN';
        isVerified: boolean;
    };
}

export async function loginWithBackend(input: { email: string; password: string }) {
    const { response, payload } = await proxyToBackend('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const normalized = normalizeBackendPayload<{ error: string }>(payload)
        const errorMessage = normalized && 'error' in normalized
            ? normalized.error
            : 'Login failed'
        throw new Error(errorMessage)
    }

    return normalizeBackendPayload<AuthSession>(payload);
}

export async function registerWithBackend(input: { name: string; email: string; password: string; locale?: 'en' | 'ar'; planId?: 'free' | 'pro' | 'enterprise' }) {
    const { response, payload } = await proxyToBackend('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    if (!response.ok) {
        const normalized = normalizeBackendPayload<{ error: string }>(payload)
        const errorMessage = normalized && 'error' in normalized
            ? normalized.error
            : 'Registration failed'
        throw new Error(errorMessage)
    }

    return normalizeBackendPayload<AuthSession>(payload);
}

