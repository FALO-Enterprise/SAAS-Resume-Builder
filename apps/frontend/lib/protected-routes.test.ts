import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isProtectedRoute,
  resolveGatedArea,
  resolveLocale,
} from '@/lib/protected-routes';

/**
 * The gate used to be `pathname.includes("/dashboard")`. That let two bugs
 * through at once: `/drafts` was never listed, so the drafts area was reachable
 * signed out, and any public route with "dashboard" in its slug was locked.
 */
test('the gated areas are protected in every locale', () => {
  for (const pathname of [
    '/en/dashboard',
    '/ar/dashboard',
    '/en/dashboard/some-resume-id',
    '/en/drafts',
    '/ar/drafts',
    '/en/onboarding',
    '/ar/onboarding',
  ]) {
    assert.equal(isProtectedRoute(pathname), true, pathname);
  }
});

test('a missing locale prefix still matches', () => {
  assert.equal(isProtectedRoute('/dashboard'), true);
  assert.equal(isProtectedRoute('/drafts'), true);
});

test('public routes that merely contain a gated word stay open', () => {
  for (const pathname of [
    '/en',
    '/ar',
    '/en/blog/my-dashboard-tips',
    '/en/blog/drafts-guide',
    '/en/dashboardfoo',
    '/en/pricing',
    '/en/templates',
  ]) {
    assert.equal(isProtectedRoute(pathname), false, pathname);
  }
});

test('the redirect keeps the visitor in their own locale', () => {
  assert.equal(resolveLocale('/ar/dashboard'), 'ar');
  assert.equal(resolveLocale('/en/dashboard'), 'en');
});

test('an unknown or absent locale falls back to the default', () => {
  assert.equal(resolveLocale('/dashboard'), 'en');
  assert.equal(resolveLocale('/fr/dashboard'), 'en');
});

/**
 * The toast names where the visitor was headed, so /drafts must not resolve to
 * "dashboard" — that mismatch is what made both links read the same.
 */
test('the gated area is read off the path, not assumed', () => {
  assert.equal(resolveGatedArea('/en/drafts'), 'drafts');
  assert.equal(resolveGatedArea('/ar/drafts'), 'drafts');
  assert.equal(resolveGatedArea('/en/dashboard'), 'dashboard');
  assert.equal(resolveGatedArea('/en/dashboard/some-resume-id'), 'dashboard');
  assert.equal(resolveGatedArea('/ar/onboarding'), 'onboarding');
});

test('a public route resolves to no area', () => {
  assert.equal(resolveGatedArea('/en'), null);
  assert.equal(resolveGatedArea('/en/blog/my-dashboard-tips'), null);
  assert.equal(resolveGatedArea('/en/pricing'), null);
});
