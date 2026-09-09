import assert from 'node:assert/strict';
import test from 'node:test';

import { queryKeys } from '@/lib/query/queryKeys';

/**
 * These lock in the two properties the flat key factory did not have. The
 * drafts list is scoped server-side by the bearer token, so a key without the
 * user id let a second user in the same tab read the first one's cached list.
 */
test('user-owned keys carry the user id', () => {
  const a = queryKeys.drafts.list('user-a');
  const b = queryKeys.drafts.list('user-b');

  assert.notDeepEqual(a, b);
  assert.ok(a.includes('user-a'));

  assert.notDeepEqual(
    queryKeys.users.detail('user-a'),
    queryKeys.users.detail('user-b'),
  );
  assert.notDeepEqual(
    queryKeys.billing.subscription('user-a'),
    queryKeys.billing.subscription('user-b'),
  );
  assert.notDeepEqual(
    queryKeys.users.preferences('user-a'),
    queryKeys.users.preferences('user-b'),
  );
});

test('the dashboard draft key separates resumes as well as users', () => {
  // Saving draft A's content under draft B's id was a real corruption path;
  // distinct cache entries are the structural half of that fix.
  assert.notDeepEqual(
    queryKeys.dashboardDraft.detail('user-a', 'resume-1'),
    queryKeys.dashboardDraft.detail('user-a', 'resume-2'),
  );

  // No resumeId means "the current draft", which is its own entry.
  assert.deepEqual(queryKeys.dashboardDraft.detail('user-a'), [
    'dashboard-draft',
    'detail',
    'user-a',
    'current',
  ]);
});

test('entity roots prefix their members so invalidation by prefix works', () => {
  const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
    prefix.every((segment, index) => key[index] === segment);

  assert.ok(startsWith(queryKeys.drafts.list('user-a'), queryKeys.drafts.all));
  assert.ok(startsWith(queryKeys.users.detail('user-a'), queryKeys.users.all));
  assert.ok(
    startsWith(queryKeys.users.preferences('user-a'), queryKeys.users.all),
  );
  assert.ok(
    startsWith(queryKeys.billing.subscription('user-a'), queryKeys.billing.all),
  );
  assert.ok(startsWith(queryKeys.plans.list(), queryKeys.plans.all));
  assert.ok(
    startsWith(
      queryKeys.dashboardDraft.detail('user-a', 'resume-1'),
      queryKeys.dashboardDraft.all,
    ),
  );
});

test('the public plan catalogue is deliberately not user-scoped', () => {
  assert.deepEqual(queryKeys.plans.list(), ['plans', 'list']);
});
