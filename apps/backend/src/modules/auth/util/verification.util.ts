import { randomInt, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';

export interface VerificationEntry {
    code: string;
    expiresAt: number;
    attempts: number;
}

export type VerificationFailureReason = 'NOT_FOUND' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'INVALID_CODE';

export type VerificationResult =
    | { success: true; entry: VerificationEntry }
    | { success: false; reason: VerificationFailureReason; message: string; remainingAttempts?: number };

const verificationCodes = new Map<string, VerificationEntry>();
export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_VERIFICATION_ATTEMPTS = 5;

function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

function generateCode() {
    return randomInt(0, 1000000).toString().padStart(6, '0');
}

function safeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
}

export function _resetVerificationStore() {
    verificationCodes.clear();
}

export function _getVerificationEntry(email: string): VerificationEntry | undefined {
    return verificationCodes.get(normalizeEmail(email));
}

export async function sendVerificationCode(email: string) {
    const normalizedEmail = normalizeEmail(email);
    const code = generateCode();

    verificationCodes.set(normalizedEmail, {
        code,
        expiresAt: Date.now() + CODE_TTL_MS,
        attempts: 0,
    });

    console.log(`Verification code generated for ${normalizedEmail}: ${code}`);
    await sendVerificationEmail(normalizedEmail, code);
    return code;
}

export async function resendVerificationCode(email: string) {
    return sendVerificationCode(email);
}

export function verifyVerificationCode(email: string, code: string): VerificationResult {
    const normalizedEmail = normalizeEmail(email);
    const entry = verificationCodes.get(normalizedEmail);

    console.log(`Verifying code for ${normalizedEmail}. Found entry:`, !!entry);

    if (!entry) {
        console.log(`No verification code found for ${normalizedEmail}`);
        return {
            success: false,
            reason: 'NOT_FOUND',
            message: 'Invalid or expired verification code',
        };
    }

    if (Date.now() > entry.expiresAt) {
        verificationCodes.delete(normalizedEmail);
        console.log(`Verification code expired for ${normalizedEmail}`);
        return {
            success: false,
            reason: 'EXPIRED',
            message: 'Verification code has expired. Please request a new code.',
        };
    }

    if (entry.attempts >= MAX_VERIFICATION_ATTEMPTS) {
        verificationCodes.delete(normalizedEmail);
        console.log(`Verification code exceeded maximum attempts for ${normalizedEmail}`);
        return {
            success: false,
            reason: 'TOO_MANY_ATTEMPTS',
            message: 'Too many failed verification attempts. This code is no longer valid. Please request a new code.',
        };
    }

    entry.attempts += 1;

    if (!safeCompare(entry.code, code)) {
        console.log(`Code mismatch for ${normalizedEmail}. Attempt ${entry.attempts}/${MAX_VERIFICATION_ATTEMPTS}`);
        if (entry.attempts >= MAX_VERIFICATION_ATTEMPTS) {
            verificationCodes.delete(normalizedEmail);
            return {
                success: false,
                reason: 'TOO_MANY_ATTEMPTS',
                message: 'Too many failed verification attempts. This code is no longer valid. Please request a new code.',
                remainingAttempts: 0,
            };
        }

        return {
            success: false,
            reason: 'INVALID_CODE',
            message: 'Invalid verification code',
            remainingAttempts: MAX_VERIFICATION_ATTEMPTS - entry.attempts,
        };
    }

    // Code matched - delete entry to prevent reuse
    verificationCodes.delete(normalizedEmail);
    console.log(`Code verified successfully for ${normalizedEmail}`);
    return {
        success: true,
        entry,
    };
}

async function sendVerificationEmail(email: string, code: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromAddress = process.env.EMAIL_FROM || 'no-reply@resumax.local';

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log(`[DEV] Verification code for ${email}: ${code}`);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: 'Your Resumax verification code',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #f0ede8; padding: 40px 20px;">

            <!-- Header / Logo -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <div style="background-color: #F5A623; border-radius: 8px; width: 36px; height: 36px; display: inline-block; text-align: center; line-height: 36px;">
                        <span style="color: white; font-weight: bold; font-size: 18px;">R</span>
                    </div>
                    <span style="font-size: 22px; font-weight: bold; color: #111827;">Resu<span style="color: #F5A623;">Max</span></span>
                </div>
            </div>

            <!-- Card -->
            <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,0.06);">

                <!-- Title -->
                <h2 style="color: #111827; font-size: 22px; font-weight: bold; margin: 0 0 12px 0;">
                    Verify your account
                </h2>
                <p style="color: #6B7280; font-size: 15px; margin: 0 0 30px 0;">
                    Use the code below to complete your <strong style="color: #111827;">ResuMax</strong> registration. 
                    This code expires in <strong style="color: #F5A623;">10 minutes</strong>.
                </p>

                <!-- Code Box -->
                <div style="background-color: #f0ede8; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 30px;">
                    <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">
                        Verification Code
                    </p>
                    <div style="font-size: 40px; letter-spacing: 12px; font-weight: bold; color: #F5A623;">
                        ${code}
                    </div>
                </div>

                <!-- Warning -->
                <div style="background-color: #FFF7ED; border-left: 4px solid #F5A623; border-radius: 4px; padding: 12px 16px; margin-bottom: 24px;">
                    <p style="color: #92400E; font-size: 13px; margin: 0;">
                        ⚠️ If you didn't request this code, you can safely ignore this email.
                    </p>
                </div>

                <p style="color: #9CA3AF; font-size: 13px; margin: 0;">
                    This code is valid for one-time use only.
                </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 24px;">
                <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 4px 0;">
                    Build Resumes That <span style="color: #F5A623;">Open Doors</span>
                </p>
                <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} ResuMax. All rights reserved.
                </p>
            </div>

        </div>
    `,
    });
}
