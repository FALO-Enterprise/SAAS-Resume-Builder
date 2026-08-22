import { escapeHtml, getTransporter } from '../email/notification-email.service';
import type { ContactSupportInput, SupportTopic } from './support.schema';

const TOPIC_LABELS: Record<SupportTopic, string> = {
    account: 'Account & access',
    billing: 'Billing & plans',
    technical: 'Something is broken',
    feedback: 'Feedback or idea',
    other: 'Something else',
};

export class SupportService {
    /**
     * Delivers a help-centre message to the support inbox.
     *
     * Returns `delivered: false` (not an error) when SMTP is unconfigured, so
     * local development can exercise the whole form flow without a mail server
     * while still logging what would have been sent.
     */
    public async sendContactMessage(
        input: ContactSupportInput,
        meta: { locale?: string } = {},
    ): Promise<{ delivered: boolean }> {
        const supportInbox =
            process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'hello@resumax.io';
        const fromAddress =
            process.env.EMAIL_FROM || 'ResuMax <no-reply@resumax.local>';

        const transporter = getTransporter();
        const topicLabel = TOPIC_LABELS[input.topic];

        if (!transporter) {
            console.log(
                `[DEV] Support message from ${input.name} <${input.email}> [${topicLabel}]: ${input.message.slice(0, 140)}`,
            );
            return { delivered: false };
        }

        const safeName = escapeHtml(input.name);
        const safeEmail = escapeHtml(input.email);
        // Newlines survive as <br> so the agent reads the message as written.
        const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br>');

        await transporter.sendMail({
            from: fromAddress,
            to: supportInbox,
            // Lets an agent answer the user directly from the notification.
            replyTo: `${input.name} <${input.email}>`,
            subject: `[Support · ${topicLabel}] ${input.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; color: #111827;">
                    <h2 style="margin-top: 0; font-size: 18px; color: #111827;">New support message</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 16px;">
                        <tr><td style="padding: 6px 0; color: #6b7280;">From</td><td style="padding: 6px 0;"><strong>${safeName}</strong> &lt;${safeEmail}&gt;</td></tr>
                        <tr><td style="padding: 6px 0; color: #6b7280;">Topic</td><td style="padding: 6px 0;">${escapeHtml(topicLabel)}</td></tr>
                        <tr><td style="padding: 6px 0; color: #6b7280;">Language</td><td style="padding: 6px 0;">${escapeHtml(meta.locale || 'en')}</td></tr>
                    </table>
                    <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; font-size: 15px; line-height: 1.7; color: #374151;">
                        ${safeMessage}
                    </div>
                </div>
            `,
        });

        // Acknowledgement to the sender. Deliberately non-blocking: the message
        // already reached support, so a failure here must not surface to the
        // user as a failed submission.
        void this.sendAcknowledgement(input, meta.locale === 'ar' ? 'ar' : 'en').catch(
            (err) => console.warn('[SupportService] Acknowledgement email failed:', err),
        );

        return { delivered: true };
    }

    private async sendAcknowledgement(
        input: ContactSupportInput,
        locale: 'en' | 'ar',
    ): Promise<void> {
        const transporter = getTransporter();
        if (!transporter) return;

        const fromAddress =
            process.env.EMAIL_FROM || 'ResuMax <no-reply@resumax.local>';
        const safeName = escapeHtml(input.name);
        const safeMessage = escapeHtml(input.message).replace(/\n/g, '<br>');
        const isArabic = locale === 'ar';

        await transporter.sendMail({
            from: fromAddress,
            to: input.email,
            subject: isArabic
                ? 'وصلتنا رسالتك — فريق ResuMax'
                : 'We got your message — ResuMax Support',
            html: `
                <div dir="${isArabic ? 'rtl' : 'ltr'}" style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #111827; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d97706; font-size: 24px; font-weight: 900; margin: 0;">ResuMax</h1>
                    </div>
                    <h2 style="font-size: 18px; margin-top: 0;">${isArabic ? `مرحباً ${safeName}،` : `Hi ${safeName},`}</h2>
                    <p style="font-size: 15px; line-height: 1.7; color: #374151;">
                        ${isArabic
                            ? 'وصلتنا رسالتك وسيردّ عليك شخص من فريقنا خلال 24 ساعة. لا حاجة لإعادة الإرسال.'
                            : 'Your message reached us, and a real person will reply within 24 hours. No need to send it again.'}
                    </p>
                    <div style="background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 12px; padding: 16px; font-size: 14px; line-height: 1.7; color: #6b7280;">
                        ${safeMessage}
                    </div>
                </div>
            `,
        });
    }
}

export const supportService = new SupportService();
