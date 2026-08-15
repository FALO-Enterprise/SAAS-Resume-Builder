import nodemailer from 'nodemailer';

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export async function sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
    locale: 'en' | 'ar' = 'en',
) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromAddress = process.env.EMAIL_FROM || 'no-reply@resumax.local';
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/${locale}/resetpassword?token=${encodeURIComponent(token)}`;

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
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

    const safeName = escapeHtml(name);

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: locale === 'ar'
            ? 'إعادة تعيين كلمة مرور ResuMax'
            : 'Reset your ResuMax password',
        html: locale === 'ar'
            ? `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #111827;">
                    <h2>مرحباً ${safeName}،</h2>
                    <p>تلقينا طلباً لإعادة تعيين كلمة مرور حسابك في ResuMax.</p>
                    <p style="margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; border-radius: 10px; background: #F5A623; padding: 14px 22px; color: #111827; font-weight: 700; text-decoration: none;">
                            إعادة تعيين كلمة المرور
                        </a>
                    </p>
                    <p>تنتهي صلاحية الرابط خلال 15 دقيقة ويمكن استخدامه مرة واحدة فقط.</p>
                    <p style="color: #6B7280;">إذا لم تطلب تغيير كلمة المرور، تجاهل هذه الرسالة.</p>
                </div>
            `
            : `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #111827;">
                    <h2>Hello ${safeName},</h2>
                    <p>We received a request to reset your ResuMax account password.</p>
                    <p style="margin: 30px 0;">
                        <a href="${resetUrl}" style="display: inline-block; border-radius: 10px; background: #F5A623; padding: 14px 22px; color: #111827; font-weight: 700; text-decoration: none;">
                            Reset password
                        </a>
                    </p>
                    <p>This link expires in 15 minutes and can only be used once.</p>
                    <p style="color: #6B7280;">If you did not request a password change, you can ignore this email.</p>
                </div>
            `,
    });
}
