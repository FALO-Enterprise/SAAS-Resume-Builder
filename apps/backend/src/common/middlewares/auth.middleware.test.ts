import assert from 'node:assert/strict';
import test from 'node:test';
import type { AddressInfo } from 'node:net';

import app from '../../app';

async function requestDashboard(authorization?: string) {
    const server = app.listen(0, '127.0.0.1');

    try {
        await new Promise<void>((resolve, reject) => {
            server.once('listening', resolve);
            server.once('error', reject);
        });

        const address = server.address() as AddressInfo;
        return await fetch(`http://127.0.0.1:${address.port}/api/dashboard`, {
            headers: authorization ? { Authorization: authorization } : undefined,
        });
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
        });
    }
}

test('returns a JSON 401 for an invalid bearer token', async () => {
    const response = await requestDashboard('Bearer definitely-invalid');

    assert.equal(response.status, 401);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i);
    assert.deepEqual(await response.json(), {
        success: false,
        error: {
            statusCode: 401,
            message: 'Invalid token',
        },
    });
});

test('returns a JSON 401 when authentication is missing', async () => {
    const response = await requestDashboard();

    assert.equal(response.status, 401);
    assert.match(response.headers.get('content-type') ?? '', /application\/json/i);
    assert.deepEqual(await response.json(), {
        success: false,
        error: {
            statusCode: 401,
            message: 'user is not Authenticated',
        },
    });
});
