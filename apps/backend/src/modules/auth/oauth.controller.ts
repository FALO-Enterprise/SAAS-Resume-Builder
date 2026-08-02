import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { HttpErrorStatus } from '../../common/utils/util.types';
import { signJWT } from './util/jwt.util';
import {
    consumeOAuthLoginCode,
    createAuthorizationUrl,
    createOAuthLoginCode,
    findOrCreateOAuthUser,
    getOAuthProfile,
    isOAuthProvider,
} from './oauth.service';

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

function frontendCallbackUrl(locale: 'en' | 'ar', params: Record<string, string>) {
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const url = new URL(`${frontendUrl}/${locale}/auth/callback`);

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }

    return url.toString();
}

class OAuthController {
    public start(req: Request, res: Response) {
        const provider = typeof req.params.provider === 'string' ? req.params.provider : '';
        const locale = req.query.locale === 'ar' ? 'ar' : 'en';

        if (!provider || !isOAuthProvider(provider)) {
            res.redirect(frontendCallbackUrl(locale, { error: 'unsupported_provider' }));
            return;
        }

        try {
            const state = randomBytes(32).toString('base64url');
            const codeVerifier = randomBytes(48).toString('base64url');
            const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

            req.session.oauth = {
                provider,
                state,
                codeVerifier,
                locale,
                createdAt: Date.now(),
            };

            req.session.save((error) => {
                if (error) {
                    console.error('Could not save the OAuth session:', error);
                    res.redirect(frontendCallbackUrl(locale, { error: 'oauth_failed' }));
                    return;
                }

                res.redirect(createAuthorizationUrl(provider, state, codeChallenge));
            });
        } catch (error) {
            console.error('Could not start OAuth:', error);
            res.redirect(frontendCallbackUrl(locale, { error: 'provider_not_configured' }));
        }
    }

    public async callback(req: Request, res: Response) {
        const provider = typeof req.params.provider === 'string' ? req.params.provider : '';
        const oauthSession = req.session.oauth;
        const locale = oauthSession?.locale ?? 'en';

        if (!provider || !isOAuthProvider(provider)) {
            res.redirect(frontendCallbackUrl(locale, { error: 'unsupported_provider' }));
            return;
        }

        const state = typeof req.query.state === 'string' ? req.query.state : '';
        const code = typeof req.query.code === 'string' ? req.query.code : '';
        const providerError = typeof req.query.error === 'string' ? req.query.error : '';
        const validSession = oauthSession
            && oauthSession.provider === provider
            && oauthSession.state === state
            && Date.now() - oauthSession.createdAt <= OAUTH_STATE_TTL_MS;

        if (!validSession) {
            res.redirect(frontendCallbackUrl(locale, { error: 'invalid_oauth_state' }));
            return;
        }

        delete req.session.oauth;

        if (providerError || !code) {
            res.redirect(frontendCallbackUrl(locale, { error: 'access_denied' }));
            return;
        }

        try {
            const profile = await getOAuthProfile(provider, code, oauthSession.codeVerifier);
            const user = await findOrCreateOAuthUser(provider, profile);
            const loginCode = await createOAuthLoginCode(user.id);

            res.redirect(frontendCallbackUrl(locale, { code: loginCode }));
        } catch (error) {
            console.error(`${provider} OAuth callback failed:`, error);
            const errorDescription = error instanceof Error ? error.message : String(error);
            res.redirect(frontendCallbackUrl(locale, { error: 'oauth_failed', error_description: errorDescription }));
        }
    }

    public async exchange(req: Request, res: Response) {
        const code = typeof req.body?.code === 'string' ? req.body.code : '';

        if (!code || code.length > 256) {
            res.error({ statusCode: HttpErrorStatus.BadRequest, message: 'Invalid OAuth login code' });
            return;
        }

        const user = await consumeOAuthLoginCode(code);
        if (!user) {
            res.error({ statusCode: HttpErrorStatus.Unauthorized, message: 'OAuth login code is invalid or expired' });
            return;
        }

        const token = signJWT({ sub: user.id, name: user.name });
        res.ok({ user, token });
    }
}

export const oauthController = new OAuthController();
