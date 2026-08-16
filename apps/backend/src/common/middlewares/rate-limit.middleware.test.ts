import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import type { Request, Response } from 'express';
import { createRateLimiter } from './rate-limit.middleware';

test('rate limiter allows requests within limit and attaches headers', async () => {
    const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 3,
        message: 'Rate limit exceeded',
    });

    const headers: Record<string, string | number> = {};
    const req = {
        ip: '192.168.1.1',
        method: 'POST',
        socket: {},
    } as unknown as Request;

    const res = {
        setHeader(name: string, value: string | number) {
            headers[name] = value;
        },
        error() {},
        status() { return this; },
        json() { return this; },
    } as unknown as Response;

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // Request 1
    nextCalled = false;
    limiter(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(headers['RateLimit-Limit'], 3);
    assert.equal(headers['RateLimit-Remaining'], 2);

    // Request 2
    nextCalled = false;
    limiter(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(headers['RateLimit-Remaining'], 1);

    // Request 3
    nextCalled = false;
    limiter(req, res, next);
    assert.equal(nextCalled, true);
    assert.equal(headers['RateLimit-Remaining'], 0);
});

test('rate limiter blocks requests exceeding max and returns 429', async () => {
    const limiter = createRateLimiter({
        windowMs: 60 * 1000,
        max: 2,
        message: 'Rate limit exceeded',
    });

    const headers: Record<string, string | number> = {};
    let errorResponse: { statusCode: number; message: string } | undefined;

    const req = {
        ip: '10.0.0.1',
        method: 'POST',
        socket: {},
    } as unknown as Request;

    const res = {
        setHeader(name: string, value: string | number) {
            headers[name] = value;
        },
        error(err: { statusCode: number; message: string }) {
            errorResponse = err;
        },
    } as unknown as Response;

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // Request 1
    limiter(req, res, next);
    // Request 2
    limiter(req, res, next);

    // Request 3 (exceeds limit of 2)
    nextCalled = false;
    limiter(req, res, next);

    assert.equal(nextCalled, false);
    assert.equal(errorResponse?.statusCode, 429);
    assert.equal(errorResponse?.message, 'Rate limit exceeded');
    assert.ok(headers['Retry-After'] !== undefined);
});
