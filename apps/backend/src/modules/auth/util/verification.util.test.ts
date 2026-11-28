import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import {
    sendVerificationCode,
    verifyVerificationCode,
    MAX_VERIFICATION_ATTEMPTS,
    _resetVerificationStore,
    _getVerificationEntry,
    CODE_TTL_MS,
} from './verification.util';

beforeEach(() => {
    _resetVerificationStore();
});

test('successfully verifies a valid code and deletes entry after single use', async () => {
    const email = 'user@example.com';
    const code = await sendVerificationCode(email);

    const result = verifyVerificationCode(email, code);
    assert.equal(result.success, true);
    if (result.success) {
        assert.equal(result.entry.code, code);
    }

    // Code cannot be reused after verification
    const reuseResult = verifyVerificationCode(email, code);
    assert.equal(reuseResult.success, false);
    if (!reuseResult.success) {
        assert.equal(reuseResult.reason, 'NOT_FOUND');
    }
});

test('returns NOT_FOUND when verifying an email with no active code', () => {
    const result = verifyVerificationCode('unknown@example.com', '123456');
    assert.equal(result.success, false);
    if (!result.success) {
        assert.equal(result.reason, 'NOT_FOUND');
    }
});

test('tracks failed attempts and reports remaining attempts', async () => {
    const email = 'victim@example.com';
    await sendVerificationCode(email);

    const result1 = verifyVerificationCode(email, '000000');
    assert.equal(result1.success, false);
    if (!result1.success) {
        assert.equal(result1.reason, 'INVALID_CODE');
        assert.equal(result1.remainingAttempts, MAX_VERIFICATION_ATTEMPTS - 1);
    }

    const entry = _getVerificationEntry(email);
    assert.equal(entry?.attempts, 1);
});

test('invalidates code and locks out after reaching MAX_VERIFICATION_ATTEMPTS', async () => {
    const email = 'target@example.com';
    const validCode = await sendVerificationCode(email);

    // Fail 4 times
    for (let i = 1; i <= MAX_VERIFICATION_ATTEMPTS - 1; i++) {
        const result = verifyVerificationCode(email, `99999${i}`);
        assert.equal(result.success, false);
        if (!result.success) {
            assert.equal(result.reason, 'INVALID_CODE');
            assert.equal(result.remainingAttempts, MAX_VERIFICATION_ATTEMPTS - i);
        }
    }

    // 5th failed attempt should trigger lockout and delete code entry
    const finalFailResult = verifyVerificationCode(email, 'wrong-code');
    assert.equal(finalFailResult.success, false);
    if (!finalFailResult.success) {
        assert.equal(finalFailResult.reason, 'TOO_MANY_ATTEMPTS');
        assert.equal(finalFailResult.remainingAttempts, 0);
    }

    // Subsequent attempt even with the correct code should fail because code is revoked
    const correctGuessAfterLockout = verifyVerificationCode(email, validCode);
    assert.equal(correctGuessAfterLockout.success, false);
    if (!correctGuessAfterLockout.success) {
        assert.equal(correctGuessAfterLockout.reason, 'NOT_FOUND');
    }

    assert.equal(_getVerificationEntry(email), undefined);
});

test('rejects expired verification codes', async () => {
    const email = 'expired@example.com';
    const code = await sendVerificationCode(email);

    const entry = _getVerificationEntry(email);
    if (entry) {
        // Manually simulate expiration
        entry.expiresAt = Date.now() - 1000;
    }

    const result = verifyVerificationCode(email, code);
    assert.equal(result.success, false);
    if (!result.success) {
        assert.equal(result.reason, 'EXPIRED');
    }
});

test('case insensitivity and whitespace trimming on email', async () => {
    const code = await sendVerificationCode('  Target.User@Example.COM  ');
    const result = verifyVerificationCode('target.user@example.com', code);
    assert.equal(result.success, true);
});
