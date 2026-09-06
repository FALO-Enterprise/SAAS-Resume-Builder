import { createHash, randomBytes } from 'node:crypto';
import prisma from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';
import { createArgonHash } from './util/argon.util';
import type { AuthenticatedUserDTO } from './types/auth.dto';
import { sendVerificationCode } from './util/verification.util';
import { notificationEmailService } from '../email/notification-email.service';

export const OAUTH_PROVIDERS = ['google', 'github'] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export type OAuthProfile = {
    providerUserId: string;
    email: string;
    emailVerified: boolean;
    name: string;
    avatar?: string;
};

type ProviderConfig = {
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    scope: string;
};

const LOGIN_CODE_TTL_MS = 2 * 60 * 1000;

function hashLoginCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
}

function requiredProviderEnv(provider: OAuthProvider, suffix: 'CLIENT_ID' | 'CLIENT_SECRET') {
    const key = `${provider.toUpperCase()}_${suffix}`;
    const value = process.env[key];

    if (!value) {
        throw new Error(`${key} is not configured`);
    }

    return value;
}

export function getProviderConfig(provider: OAuthProvider): ProviderConfig {
    const credentials = {
        clientId: requiredProviderEnv(provider, 'CLIENT_ID'),
        clientSecret: requiredProviderEnv(provider, 'CLIENT_SECRET'),
    };

    switch (provider) {
        case 'google':
            return {
                ...credentials,
                authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                scope: 'openid email profile',
            };
        case 'github':
            return {
                ...credentials,
                authorizationUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                scope: 'read:user user:email',
            };
    }
}

export function isOAuthProvider(value: string): value is OAuthProvider {
    return OAUTH_PROVIDERS.includes(value as OAuthProvider);
}

export function getOAuthCallbackUrl(provider: OAuthProvider) {
    const backendUrl = (process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '');
    return `${backendUrl}/api/auth/oauth/${provider}/callback`;
}

export function createAuthorizationUrl(
    provider: OAuthProvider,
    state: string,
    codeChallenge: string,
) {
    const config = getProviderConfig(provider);
    const url = new URL(config.authorizationUrl);

    url.searchParams.set('client_id', config.clientId);
    url.searchParams.set('redirect_uri', getOAuthCallbackUrl(provider));
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', config.scope);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', codeChallenge);
    url.searchParams.set('code_challenge_method', 'S256');

    if (provider === 'google') {
        url.searchParams.set('prompt', 'select_account');
    }

    return url.toString();
}

async function parseJsonResponse<T>(response: Response, context: string): Promise<T> {
    const payload = await response.json() as T & { error?: string; error_description?: string; message?: string };

    if (!response.ok) {
        throw new Error(payload.error_description || payload.message || payload.error || context);
    }

    return payload;
}

async function exchangeCode(
    provider: OAuthProvider,
    code: string,
    codeVerifier: string,
) {
    const config = getProviderConfig(provider);
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: getOAuthCallbackUrl(provider),
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code_verifier: codeVerifier,
    });

    const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
    });
    const token = await parseJsonResponse<{ access_token?: string }>(response, 'OAuth token exchange failed');

    if (!token.access_token) {
        throw new Error('OAuth provider did not return an access token');
    }

    return token.access_token;
}

async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile> {
    const response = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await parseJsonResponse<{
        sub: string;
        email?: string;
        email_verified?: boolean;
        name?: string;
        picture?: string;
    }>(response, 'Could not load the Google profile');

    if (!profile.sub || !profile.email) throw new Error('Google did not return an email address');

    return {
        providerUserId: profile.sub,
        email: profile.email,
        emailVerified: profile.email_verified === true,
        name: profile.name || profile.email.split('@')[0] || 'Google user',
        avatar: profile.picture,
    };
}

async function fetchGitHubProfile(accessToken: string): Promise<OAuthProfile> {
    const headers = {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ResuMax',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    const [userResponse, emailResponse] = await Promise.all([
        fetch('https://api.github.com/user', { headers }),
        fetch('https://api.github.com/user/emails', { headers }),
    ]);
    const user = await parseJsonResponse<{
        id: number;
        login: string;
        name?: string | null;
        avatar_url?: string;
    }>(userResponse, 'Could not load the GitHub profile');
    const emails = await parseJsonResponse<Array<{
        email: string;
        primary: boolean;
        verified: boolean;
    }>>(emailResponse, 'Could not load the GitHub email address');
    const email = emails.find((item) => item.primary && item.verified)
        || emails.find((item) => item.verified);

    if (!user.id || !email) throw new Error('GitHub did not return a verified email address');

    return {
        providerUserId: String(user.id),
        email: email.email,
        emailVerified: true,
        name: user.name || user.login,
        avatar: user.avatar_url,
    };
}

export async function getOAuthProfile(
    provider: OAuthProvider,
    code: string,
    codeVerifier: string,
) {
    const accessToken = await exchangeCode(provider, code, codeVerifier);

    switch (provider) {
        case 'google': return fetchGoogleProfile(accessToken);
        case 'github': return fetchGitHubProfile(accessToken);
    }
}

async function authenticatedUser(userId: string): Promise<AuthenticatedUserDTO> {
    const result = await prisma.user.findUnique({
        where: { id: userId },
        include: { Subscription: { include: { Plan: true } } },
    });

    if (!result || !result.Subscription) throw new Error('Active plan not found for user');

    const { password: _password, Subscription, ...user } = result;
    return { ...user, plan: Subscription.Plan };
}

function isUploadedAvatar(avatar: string) {
    try {
        return new URL(avatar, 'http://localhost').pathname.startsWith('/uploads/');
    } catch {
        return avatar.startsWith('/uploads/') || avatar.startsWith('uploads/');
    }
}

export async function findOrCreateOAuthUser(
    provider: OAuthProvider,
    profile: OAuthProfile,
) {
    if (!profile.emailVerified) {
        throw new Error(`${provider} did not provide a verified email address`);
    }

    let existingAccount;
    try {
        existingAccount = await prisma.oAuthAccount.findFirst({
            where: { provider, providerUserId: profile.providerUserId },
        });
    } catch (error) {
        console.error('OAuth account lookup failed', {
            provider,
            providerUserId: profile.providerUserId,
            email: profile.email,
            error,
        });
        throw error;
    }

    if (existingAccount) {
        const existingUser = await prisma.user.findUnique({
            where: { id: existingAccount.userId },
            select: { avatar: true, email: true, isVerified: true },
        });

        if (!existingUser) throw new Error('OAuth account user not found');

        const updateData: { avatar?: string | null } = {};


        // Don't auto-verify returning OAuth users — they must verify via email
        // like everyone else. Their existing isVerified status is maintained.

        // Provider image URLs can change or expire. Refresh provider-managed
        // avatars on login, but never replace an image uploaded by the user.
        if (
            profile.avatar
            && profile.avatar !== existingUser.avatar
            && (!existingUser.avatar || !isUploadedAvatar(existingUser.avatar))
        ) {
            updateData.avatar = profile.avatar;
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
                where: { id: existingAccount.userId },
                data: updateData,
            });
        }

        if (!existingUser.isVerified) {
            await sendVerificationCode(existingUser.email);
        }

        return authenticatedUser(existingAccount.userId);
    }

    const email = profile.email.trim().toLowerCase();
    const password = await createArgonHash(randomBytes(32).toString('base64url'));

    const createdUserData = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
        const freePlan = await transaction.plan.findUnique({ where: { name: 'FREE' } });
        if (!freePlan) throw new Error('FREE plan not found');

        let user = await transaction.user.findUnique({ where: { email } });
        let isNewUser = false;

        if (!user) {
            isNewUser = true;
            user = await transaction.user.create({
                data: {
                    name: profile.name,
                    email,
                    avatar: profile.avatar,
                    password,
                    isVerified: false,
                },
            });
        } else {
            const updateData: { isVerified?: boolean; avatar?: string | null; password?: string } = {};

            if (!user.isVerified) {
                // This is the first time this OAuth identity is being linked
                // to an existing, never-verified row — the exact moment a
                // pre-account-hijack would surface: someone could have
                // registered this email with a password of their own
                // choosing and never verified it, hoping the real owner
                // later signs up (or signs in) and inherits that row. The
                // provider has just cryptographically proven control of the
                // mailbox, which is at least as strong a signal as our own
                // email-code check, so treat it as verification — and
                // critically, invalidate whatever password is on the row so
                // a planted credential can never authenticate this account
                // again.
                updateData.isVerified = true;
                updateData.password = password;
            }

            if (!user.avatar && profile.avatar) updateData.avatar = profile.avatar;

            if (Object.keys(updateData).length > 0) {
                user = await transaction.user.update({
                    where: { id: user.id },
                    data: updateData,
                });
            }
        }

        const subscription = await transaction.subscription.findUnique({ where: { userId: user.id } });
        if (!subscription) {
            await transaction.subscription.create({
                data: { userId: user.id, planId: freePlan.id, status: 'ACTIVE' },
            });
        }

        await transaction.oAuthAccount.create({
            data: { provider, providerUserId: profile.providerUserId, userId: user.id },
        });

        return {
            userId: user.id,
            email: user.email,
            name: user.name,
            isNewUser,
        };
    }, {
        timeout: 15000,
        maxWait: 5000,
    });

    // Send verification email and welcome email after the transaction commits successfully
    if (createdUserData.isNewUser) {
        try {
            await sendVerificationCode(createdUserData.email);
            console.log(`Verification code sent to OAuth user: ${createdUserData.email}`);
            void notificationEmailService.sendWelcomeEmail({
                id: createdUserData.userId,
                email: createdUserData.email,
                name: createdUserData.name,
            }).catch(() => { });
        } catch (verifyError) {
            console.error(`Failed to send verification code to OAuth user ${createdUserData.email}:`, verifyError);
        }
    }

    return authenticatedUser(createdUserData.userId);
}

export async function createOAuthLoginCode(userId: string) {
    const code = randomBytes(32).toString('base64url');

    await prisma.oAuthLoginCode.create({
        data: {
            codeHash: hashLoginCode(code),
            userId,
            expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MS),
        },
    });

    return code;
}

export async function consumeOAuthLoginCode(code: string) {
    const now = new Date();
    const codeHash = hashLoginCode(code);

    const userId = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
        const loginCode = await transaction.oAuthLoginCode.findUnique({ where: { codeHash } });
        if (!loginCode) return null;

        const consumed = await transaction.oAuthLoginCode.updateMany({
            where: {
                id: loginCode.id,
                usedAt: null,
                expiresAt: { gt: now },
            },
            data: { usedAt: now },
        });

        return consumed.count === 1 ? loginCode.userId : null;
    }, {
        timeout: 10000,
        maxWait: 5000,
    });

    return userId ? authenticatedUser(userId) : null;
}
