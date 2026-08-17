import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { PaddleService } from './paddle.service';

test('verifies valid Paddle webhook signature', () => {
    const service = new PaddleService();
    const secret = 'pdl_ntfset_01testsecret1234567890';
    process.env.PADDLE_WEBHOOK_SECRET_KEY = secret;

    const payload = JSON.stringify({
        event_id: 'evt_01j7abc',
        event_type: 'subscription.created',
        occurred_at: '2026-08-17T12:00:00Z',
        data: {
            id: 'sub_01j7xyz',
        },
    });

    const timestamp = '1723896000';
    const signedPayload = `${timestamp}:${payload}`;
    const hash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const signatureHeader = `ts=${timestamp};h1=${hash}`;

    const isValid = service.verifyWebhookSignature(payload, signatureHeader);
    assert.equal(isValid, true);
});

test('rejects tampered Paddle webhook signature', () => {
    const service = new PaddleService();
    const secret = 'pdl_ntfset_01testsecret1234567890';
    process.env.PADDLE_WEBHOOK_SECRET_KEY = secret;

    const payload = JSON.stringify({ event: 'subscription.created' });
    const signatureHeader = 'ts=1723896000;h1=invalidhash123456';

    const isValid = service.verifyWebhookSignature(payload, signatureHeader);
    assert.equal(isValid, false);
});

test('resolves plan from price ID correctly', () => {
    const service = new PaddleService();
    assert.equal(service.getPlanFromPriceId('pri_pro_123'), 'PRO');
    assert.equal(service.getPlanFromPriceId('pri_enterprise_456'), 'ENTERPRISE');
});
