import { z } from 'zod';

/** Topics the help-center form offers. Kept in sync with the frontend select. */
export const SUPPORT_TOPICS = [
    'account',
    'billing',
    'technical',
    'feedback',
    'other',
] as const;

export type SupportTopic = typeof SUPPORT_TOPICS[number];

export const contactSupportSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Please tell us your name')
        .max(80, 'Name is too long'),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email('Please enter a valid email address')
        .max(160, 'Email is too long'),

    topic: z.enum(SUPPORT_TOPICS),

    message: z
        .string()
        .trim()
        .min(20, 'Please give us a little more detail')
        .max(4000, 'Message is too long'),

    /**
     * Honeypot. Real users never see this field, so anything in it means a bot
     * filled the form blindly. Named plausibly on purpose — `honeypot` would be
     * skipped by anything that reads field names.
     *
     * Deliberately accepts any string rather than enforcing emptiness here: a
     * validation failure would answer the bot with a 400 naming this field,
     * which teaches it to leave the field alone next time. The controller
     * inspects it instead and answers 200 as though nothing happened.
     */
    website: z.string().optional(),
});

export type ContactSupportInput = z.infer<typeof contactSupportSchema>;
