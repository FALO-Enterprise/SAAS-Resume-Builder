import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ApiError,
  getErrorMessage,
  isClientError,
  readErrorStatus,
} from '@/lib/api/errors';
import { unwrap, unwrapOptional } from '@/lib/api/envelope';

test('reads the message from every envelope shape the backend emits', () => {
  assert.equal(getErrorMessage({ message: 'plain' }, 'fb'), 'plain');
  assert.equal(getErrorMessage({ error: 'string form' }, 'fb'), 'string form');

  // The nested object form. The extractors this replaced all missed it, so a
  // 403 quota refusal surfaced as the generic fallback.
  assert.equal(
    getErrorMessage(
      { success: false, error: { statusCode: 403, message: 'nested form' } },
      'fb',
    ),
    'nested form',
  );

  // A raw AxiosError that never reached the interceptor.
  assert.equal(
    getErrorMessage({ response: { data: { message: 'from response' } } }, 'fb'),
    'from response',
  );

  assert.equal(getErrorMessage(new Error('real error'), 'fb'), 'real error');
  assert.equal(getErrorMessage(undefined, 'fb'), 'fb');
  assert.equal(getErrorMessage({ message: '   ' }, 'fb'), 'fb');
});

test('ApiError is a real Error so instanceof guards keep the message', () => {
  const error = new ApiError('plan does not include this', {
    status: 403,
    code: 'PLAN_LIMIT',
  });

  // This is the whole point of the type: ~8 call sites guard on instanceof
  // Error, and the old plain-object rejection made every one of them fall
  // through to a generic fallback.
  assert.ok(error instanceof Error);
  assert.equal(error.message, 'plan does not include this');
  assert.equal(error.status, 403);
  assert.equal(error.code, 'PLAN_LIMIT');
});

test('classifies status for retry decisions', () => {
  assert.equal(readErrorStatus(new ApiError('x', { status: 500 })), 500);
  assert.equal(readErrorStatus({ statusCode: 404 }), 404);
  assert.equal(readErrorStatus({ response: { status: 401 } }), 401);
  assert.equal(readErrorStatus({}), undefined);

  // 4xx must not be retried; 5xx and network failures must be.
  assert.equal(isClientError(new ApiError('bad', { status: 422 })), true);
  assert.equal(isClientError(new ApiError('boom', { status: 503 })), false);
  assert.equal(isClientError(new Error('network down')), false);
});

test('unwrap returns envelope data and throws the backend message', () => {
  assert.deepEqual(unwrap({ success: true, data: { id: 'a' } }, 'fb'), {
    id: 'a',
  });

  // A bare (non-envelope) payload passes through untouched.
  assert.deepEqual(unwrap({ id: 'b' }, 'fb'), { id: 'b' });

  assert.throws(
    () => unwrap({ success: false, error: { message: 'quota reached' } }, 'fb'),
    (error: unknown) =>
      error instanceof ApiError && error.message === 'quota reached',
  );

  assert.throws(() => unwrap(undefined, 'nothing came back'), {
    message: 'nothing came back',
  });

  // success:true with no data is a malformed response, not an empty success.
  assert.throws(() => unwrap({ success: true }, 'fb'), { message: 'fb' });
});

test('unwrapOptional treats an empty body as success', () => {
  // 204 No Content — the delete/rename endpoints answer this way.
  assert.equal(unwrapOptional(undefined, 'fb'), undefined);
  assert.equal(unwrapOptional(null, 'fb'), undefined);

  assert.throws(() => unwrapOptional({ success: false, error: 'nope' }, 'fb'), {
    message: 'nope',
  });
});
