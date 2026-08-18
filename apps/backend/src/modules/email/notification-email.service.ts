import nodemailer from 'nodemailer';
import prisma from '../../prisma/prisma.service';

export interface UserNotificationSettings {
    welcomeEmails: boolean;
    planUpdates: boolean;
    resumeExported: boolean;
    securityAlerts: boolean;
    weeklyTips: boolean;
    productUpdates: boolean;
}

export const DEFAULT_USER_NOTIFICATION_SETTINGS: UserNotificationSettings = {
    welcomeEmails: true,
    planUpdates: true,
    resumeExported: true,
    securityAlerts: true,
    weeklyTips: false,
    productUpdates: true,
};

function escapeHtml(value: string) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getTransporter() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
        return null;
    }

    return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });
}

export class NotificationEmailService {
    public async getUserPreferences(userId: string): Promise<UserNotificationSettings> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { notificationSettings: true },
            });

            if (user?.notificationSettings && typeof user.notificationSettings === 'object') {
                return {
                    ...DEFAULT_USER_NOTIFICATION_SETTINGS,
                    ...(user.notificationSettings as Record<string, boolean>),
                };
            }
        } catch (err) {
            console.warn('[NotificationEmailService] Failed to read user notification settings:', err);
        }

        return DEFAULT_USER_NOTIFICATION_SETTINGS;
    }

    public async updateUserPreferences(
        userId: string,
        settings: Partial<UserNotificationSettings>,
    ): Promise<UserNotificationSettings> {
        const current = await this.getUserPreferences(userId);
        const updated: UserNotificationSettings = {
            ...current,
            ...settings,
        };

        await prisma.user.update({
            where: { id: userId },
            data: {
                notificationSettings: updated as unknown as Record<string, boolean>,
            },
        });

        return updated;
    }

    public async sendWelcomeEmail(
        user: { id?: string; email: string; name: string },
        locale: 'en' | 'ar' = 'en',
    ): Promise<boolean> {
        if (user.id) {
            const prefs = await this.getUserPreferences(user.id);
            if (!prefs.welcomeEmails) {
                console.log(`[NotificationEmailService] Skipped welcome email for ${user.email} (disabled in preferences)`);
                return false;
            }
        }

        let targetName = user.name;
        if ((!targetName || !targetName.trim()) && user.id) {
            const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
            if (dbUser?.name) targetName = dbUser.name;
        }

        const fromAddress = process.env.EMAIL_FROM || 'ResuMax <no-reply@resumax.local>';
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const dashboardUrl = `${frontendUrl}/${locale}/dashboard`;
        const safeName = escapeHtml(targetName?.trim() || (locale === 'ar' ? 'المستخدم' : 'User'));
        const transporter = getTransporter();

        if (!transporter) {
            console.log(`[DEV] Welcome email triggered for ${user.email} (${user.name}) -> Dashboard: ${dashboardUrl}`);
            return true;
        }

        try {
            await transporter.sendMail({
                from: fromAddress,
                to: user.email,
                subject: locale === 'ar'
                    ? 'مرحباً بك في ResuMax! 🚀 فلنأنشئ سيرتك الذاتية احترافياً'
                    : 'Welcome to ResuMax! 🚀 Build Your Professional Resume',
                html: locale === 'ar'
                    ? `
                        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #d97706; font-size: 26px; font-weight: 900; margin: 0;">ResuMax</h1>
                            </div>
                            <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin-top: 0;">مرحباً ${safeName}،</h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
                                يسعدنا انضمامك إلى <strong>ResuMax</strong>! لقد أصبحت الآن جاهزاً لإنشاء سيرة ذاتية احترافية تتوافق مع معايير ATS العالمية وتقدمك بأفضل صورة أمام مسؤولي التوظيف.
                            </p>
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #f3f4f6;">
                                <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 0;">خطواتك الأولى:</h3>
                                <ul style="padding-right: 20px; margin: 0; font-size: 14px; color: #4b5563; line-height: 1.8;">
                                    <li>أدخل خبراتك ومهاراتك في لوحة التحكم.</li>
                                    <li>اختر من بين القوالب الاحترافية المعتمدة (Classic ATS, Developer Sidebar, Executive Teal, إلخ).</li>
                                    <li>استخدم الذكاء الاصطناعي لإعادة صياغة السيرة الذاتية حسب الهدف الوظيفي.</li>
                                    <li>قم بتحميل سيرتك الذاتية بصيغة PDF أو JPG بضغطة زر.</li>
                                </ul>
                            </div>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${dashboardUrl}" style="display: inline-block; border-radius: 12px; background-color: #f59e0b; padding: 14px 28px; color: #111827; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                                    البدء الآن في لوحة التحكم
                                </a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                                نتمنى لك كل التوفيق في مسيرتك المهنية!<br />فريق ResuMax
                            </p>
                        </div>
                    `
                    : `
                        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #d97706; font-size: 26px; font-weight: 900; margin: 0;">ResuMax</h1>
                            </div>
                            <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin-top: 0;">Hello ${safeName},</h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
                                Welcome to <strong>ResuMax</strong>! We're excited to have you on board. You're now ready to craft global, ATS-ready resumes that showcase your expertise to top recruiters.
                            </p>
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #f3f4f6;">
                                <h3 style="font-size: 16px; font-weight: 700; color: #111827; margin-top: 0;">Get Started in 3 Quick Steps:</h3>
                                <ul style="padding-left: 20px; margin: 0; font-size: 14px; color: #4b5563; line-height: 1.8;">
                                    <li>Fill in your experience, skills, and education in the dashboard.</li>
                                    <li>Select a design from our high-fidelity templates (Classic ATS, Developer, Executive, etc.).</li>
                                    <li>Leverage Gemini AI to tailor your resume summary & bullet points per career goal.</li>
                                    <li>Download high-resolution PDF or JPG copies instantly.</li>
                                </ul>
                            </div>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${dashboardUrl}" style="display: inline-block; border-radius: 12px; background-color: #f59e0b; padding: 14px 28px; color: #111827; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                                    Go to Dashboard
                                </a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                                Wishing you the utmost success in your career journey!<br />The ResuMax Team
                            </p>
                        </div>
                    `,
            });
            console.log(`[NotificationEmailService] Welcome email sent to ${user.email}`);
            return true;
        } catch (error) {
            console.error(`[NotificationEmailService] Failed to send welcome email to ${user.email}:`, error);
            return false;
        }
    }

    public async sendPlanUpdateEmail(
        user: { id?: string; email: string; name: string },
        newPlanName: string,
        previousPlanName?: string,
        locale: 'en' | 'ar' = 'en',
    ): Promise<boolean> {
        if (user.id) {
            const prefs = await this.getUserPreferences(user.id);
            if (!prefs.planUpdates) {
                console.log(`[NotificationEmailService] Skipped plan update email for ${user.email} (disabled in preferences)`);
                return false;
            }
        }

        let targetName = user.name;
        if ((!targetName || !targetName.trim()) && user.id) {
            const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true } });
            if (dbUser?.name) targetName = dbUser.name;
        }

        const fromAddress = process.env.EMAIL_FROM || 'ResuMax <no-reply@resumax.local>';
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
        const dashboardUrl = `${frontendUrl}/${locale}/dashboard`;
        const safeName = escapeHtml(targetName?.trim() || (locale === 'ar' ? 'المستخدم' : 'User'));
        const safePlanName = escapeHtml(newPlanName.toUpperCase());
        const safePrevPlanName = previousPlanName ? escapeHtml(previousPlanName.toUpperCase()) : null;
        const transporter = getTransporter();

        if (!transporter) {
            console.log(`[DEV] Plan update email triggered for ${user.email} (${user.name}) -> New Plan: ${safePlanName}`);
            return true;
        }

        try {
            await transporter.sendMail({
                from: fromAddress,
                to: user.email,
                subject: locale === 'ar'
                    ? `تم تحديث خطتك في ResuMax إلى ${safePlanName} ⚡`
                    : `Your ResuMax Plan Has Been Updated to ${safePlanName} ⚡`,
                html: locale === 'ar'
                    ? `
                        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #d97706; font-size: 26px; font-weight: 900; margin: 0;">ResuMax</h1>
                            </div>
                            <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin-top: 0;">مرحباً ${safeName}،</h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
                                نود إعلامك بأنه تم تحديث اشتراك حسابك في ResuMax بنجاح.
                            </p>
                            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #fde68a; text-align: center;">
                                <span style="font-size: 12px; font-weight: 800; uppercase; color: #92400e; letter-spacing: 1px;">الخطة الحالية</span>
                                <h2 style="font-size: 28px; font-weight: 900; color: #78350f; margin: 6px 0 0;">${safePlanName}</h2>
                                ${safePrevPlanName ? `<p style="font-size: 13px; color: #b45309; margin: 4px 0 0;">(الخطة السابقة: ${safePrevPlanName})</p>` : ''}
                            </div>
                            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
                                ${safePlanName === 'PRO' || safePlanName === 'ENTERPRISE'
                                    ? 'يمكنك الآن الاستمتاع بتصادير غير محدودة، إزالة العلامة المائية، واستخدام جميع القوالب الاحترافية والذكاء الاصطناعي بدون قيود.'
                                    : 'تم تحويل حسابك إلى الخطة المجانية. يمكنك الترقية مجدداً في أي وقت للاستفادة من مميزات Pro الكاملة.'}
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${dashboardUrl}" style="display: inline-block; border-radius: 12px; background-color: #f59e0b; padding: 14px 28px; color: #111827; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                                    الذهاب إلى لوحة التحكم
                                </a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                                شكراً لاستخدامك ResuMax!<br />فريق ResuMax
                            </p>
                        </div>
                    `
                    : `
                        <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #111827; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #d97706; font-size: 26px; font-weight: 900; margin: 0;">ResuMax</h1>
                            </div>
                            <h2 style="font-size: 20px; font-weight: 800; color: #111827; margin-top: 0;">Hello ${safeName},</h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #374151;">
                                This email confirms that your ResuMax account subscription has been successfully updated.
                            </p>
                            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #fde68a; text-align: center;">
                                <span style="font-size: 12px; font-weight: 800; uppercase; color: #92400e; letter-spacing: 1px;">ACTIVE PLAN</span>
                                <h2 style="font-size: 28px; font-weight: 900; color: #78350f; margin: 6px 0 0;">${safePlanName}</h2>
                                ${safePrevPlanName ? `<p style="font-size: 13px; color: #b45309; margin: 4px 0 0;">(Previous Plan: ${safePrevPlanName})</p>` : ''}
                            </div>
                            <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
                                ${safePlanName === 'PRO' || safePlanName === 'ENTERPRISE'
                                    ? 'You now have full access to unlimited exports, watermark removal, premium templates, and purpose-driven AI rewriting.'
                                    : 'Your account is now on the Free plan. You can upgrade to Pro anytime to restore full unlimited exports and premium features.'}
                            </p>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${dashboardUrl}" style="display: inline-block; border-radius: 12px; background-color: #f59e0b; padding: 14px 28px; color: #111827; font-size: 15px; font-weight: 800; text-decoration: none; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);">
                                    Access Dashboard
                                </a>
                            </div>
                            <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                                Thank you for choosing ResuMax!<br />The ResuMax Team
                            </p>
                        </div>
                    `,
            });
            console.log(`[NotificationEmailService] Plan update email sent to ${user.email} -> ${safePlanName}`);
            return true;
        } catch (error) {
            console.error(`[NotificationEmailService] Failed to send plan update email to ${user.email}:`, error);
            return false;
        }
    }
}

export const notificationEmailService = new NotificationEmailService();
