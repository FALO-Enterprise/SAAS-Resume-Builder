import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HttpErrorStatus } from '../utils/util.types';

export interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
}

interface ClientRateLimitRecord {
    count: number;
    resetTime: number;
}

export function createRateLimiter(options: RateLimitOptions = {}): RequestHandler & { _resetStore: () => void } {
    const windowMs = options.windowMs ?? 15 * 60 * 1000;
    const max = options.max ?? 100;
    const message = options.message ?? 'Too many requests, please try again later';
    const statusCode = (options.statusCode ?? HttpErrorStatus.TooManyRequests) as typeof HttpErrorStatus.TooManyRequests;
    const keyGenerator = options.keyGenerator ?? ((req: Request) => {
        return req.ip || req.socket.remoteAddress || 'unknown';
    });
    const skip = options.skip ?? ((req: Request) => req.method === 'OPTIONS');

    const store = new Map<string, ClientRateLimitRecord>();

    // Cleanup expired entries every minute to prevent memory leaks
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of store.entries()) {
            if (now >= record.resetTime) {
                store.delete(key);
            }
        }
    }, Math.min(windowMs, 60 * 1000));

    if (cleanupInterval.unref) {
        cleanupInterval.unref();
    }

    const middleware: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
        if (skip(req)) {
            next();
            return;
        }

        const key = keyGenerator(req);
        const now = Date.now();
        let record = store.get(key);

        if (!record || now >= record.resetTime) {
            record = {
                count: 0,
                resetTime: now + windowMs,
            };
            store.set(key, record);
        }

        record.count += 1;

        const remaining = Math.max(0, max - record.count);
        const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
        const resetEpochSeconds = Math.ceil(record.resetTime / 1000);

        res.setHeader('RateLimit-Limit', max);
        res.setHeader('RateLimit-Remaining', remaining);
        res.setHeader('RateLimit-Reset', resetEpochSeconds);

        if (record.count > max) {
            res.setHeader('Retry-After', resetSeconds);
            if (typeof res.error === 'function') {
                res.error({
                    statusCode,
                    message,
                });
            } else {
                res.status(statusCode).json({
                    success: false,
                    error: {
                        statusCode,
                        message,
                    },
                });
            }
            return;
        }

        next();
    };

    const handler = middleware as RequestHandler & { _resetStore: () => void };
    handler._resetStore = () => {
        store.clear();
    };

    return handler;
}

// Preconfigured rate limiters for authentication endpoints
export const verifyRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many verification attempts from this IP, please try again later.',
});

export const resendCodeRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many verification code requests from this IP, please try again later.',
});

export const registerRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many registration attempts from this IP, please try again later.',
});

export const loginRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: 'Too many login attempts from this IP, please try again later.',
});

export const passwordResetRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many password reset requests from this IP, please try again later.',
});

export const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: 'Too many authentication requests from this IP, please try again later.',
});
