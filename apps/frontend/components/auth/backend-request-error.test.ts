import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createAuthenticatedRequestError,
  isUnauthorizedBackendError,
} from '@/lib/backend';

test('classifies an authenticated 401 as an expired session without exposing HTML', () => {
  const error = createAuthenticatedRequestError(
    new Response(null, { status: 401 }),
    '<!DOCTYPE html><html><body>Invalid token stack</body></html>',
    'Could not save your dashboard',
  );

  assert.equal(error.status, 401);
  assert.equal(error.message, 'Your session has expired. Please sign in again.');
  assert.equal(isUnauthorizedBackendError(error), true);
  assert.equal(error.message.includes('<html>'), false);
});

test('does not classify another backend failure as an expired session', () => {
  const error = createAuthenticatedRequestError(
    new Response(null, { status: 403 }),
    {
      success: false,
      error: {
        statusCode: 403,
        message: 'Your plan does not include this action',
      },
    },
    'Request failed',
  );

  assert.equal(error.status, 403);
  assert.equal(error.message, 'Your plan does not include this action');
  assert.equal(isUnauthorizedBackendError(error), false);
});
