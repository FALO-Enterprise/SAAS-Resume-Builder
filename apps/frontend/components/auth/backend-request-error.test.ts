import assert from 'node:assert/strict';
import test from 'node:test';

import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import {
  createApiRequestError,
  createAuthenticatedRequestError,
  isUnauthorizedBackendError,
} from '@/lib/backend';
import { generateResume } from '@/lib/api/resumes';

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

test('preserves the normalized Axios status and backend message', () => {
  const error = createApiRequestError(
    { status: 503, message: 'AI generation is temporarily unavailable' },
    'Could not generate your resume',
  );

  assert.equal(error.message, 'AI generation is temporarily unavailable');
  assert.equal((error as { status?: number }).status, 503);
});

test('classifies a normalized Axios 401 as an expired session', () => {
  const error = createApiRequestError(
    { status: 401, message: 'Invalid token' },
    'Could not generate your resume',
  );

  assert.equal(error.message, 'Your session has expired. Please sign in again.');
  assert.equal(isUnauthorizedBackendError(error), true);
});

test('generates through the shared Axios client with an AI-safe timeout', async () => {
  const originalPost = apiClient.post;
  let requestedUrl = '';
  let requestedTimeout = 0;

  apiClient.post = (async (
    url: string,
    _input: unknown,
    config?: { timeout?: number },
  ) => {
    requestedUrl = url;
    requestedTimeout = config?.timeout ?? 0;
    return {
      data: {
        success: true,
        data: {
          id: 'resume-1',
          title: 'Alex Resume',
          templateId: 'minimal',
          userId: 'user-1',
          createdAt: '2026-08-13T00:00:00.000Z',
          updatedAt: '2026-08-13T00:00:00.000Z',
        },
      },
    };
  }) as unknown as typeof apiClient.post;

  try {
    const resume = await generateResume({
      title: 'Alex Resume',
      templateId: 'minimal',
    });

    assert.equal(resume.id, 'resume-1');
    assert.equal(requestedUrl, API_ENDPOINTS.resumes.generate);
    assert.equal(requestedTimeout, 75_000);
  } finally {
    apiClient.post = originalPost;
  }
});
