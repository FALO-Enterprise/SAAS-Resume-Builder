import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import type { AddressInfo } from 'node:net';
import app from '../../app';
import { sendVerificationCode, _resetVerificationStore } from './util/verification.util';
import { verifyRateLimiter } from '../../common/middlewares/rate-limit.middleware';

beforeEach(() => {
    _resetVerificationStore();
    verifyRateLimiter._resetStore();
});

async function postVerify(body: { email?: string; code?: string }) {
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise<void>((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });

        const address = server.address() as AddressInfo;
        return await fetch(`http://127.0.0.1:${address.port}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => (error ? reject(error) : resolve()));
        });
    }
}

test('returns 400 when email or code is missing in /api/auth/verify', async () => {
    const response = await postVerify({});
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.error.message, 'Email and code are required');
});

test('returns 400 when invalid code is submitted for existing email', async () => {
    const email = 'user1@example.com';
    await sendVerificationCode(email);

    const response = await postVerify({ email, code: '000000' });
    assert.equal(response.status, 400);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.equal(data.error.message, 'Invalid verification code');
});

test('locks out after 5 consecutive incorrect code guesses and returns 429 on 5th failure', async () => {
    const email = 'victim@example.com';
    const validCode = await sendVerificationCode(email);

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
        const response = await postVerify({ email, code: `11111${i}` });
        assert.equal(response.status, 400);
        const data = await response.json();
        assert.equal(data.success, false);
        assert.equal(data.error.message, 'Invalid verification code');
    }

    // 5th failed attempt -> locked out with 429
    const lockoutResponse = await postVerify({ email, code: '111115' });
    assert.equal(lockoutResponse.status, 429);
    const lockoutData = await lockoutResponse.json();
    assert.equal(lockoutData.success, false);
    assert.match(lockoutData.error.message, /Too many failed verification attempts/);

    // 6th attempt with actual correct code fails because the code was invalidated
    const reuseResponse = await postVerify({ email, code: validCode });
    assert.equal(reuseResponse.status, 400);
    const reuseData = await reuseResponse.json();
    assert.equal(reuseData.success, false);
    assert.equal(reuseData.error.message, 'Invalid or expired verification code');
});

test('rate limits /api/auth/verify after 10 requests from the same IP', async () => {
    // Send 10 verification requests
    for (let i = 1; i <= 10; i++) {
        const res = await postVerify({ email: `random${i}@example.com`, code: '123456' });
        assert.equal(res.status, 400);
    }

    // 11th request from the same IP should be blocked by rate limiter
    const blockedRes = await postVerify({ email: 'another@example.com', code: '123456' });
    assert.equal(blockedRes.status, 429);
    const blockedData = await blockedRes.json();
    assert.equal(blockedData.success, false);
    assert.match(blockedData.error.message, /Too many verification attempts/i);
});

