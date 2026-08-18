import crypto from 'crypto';
import prisma from '../../prisma/prisma.service';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import { planUsageService } from '../plan/plan-usage.service';
import { notificationEmailService } from '../email/notification-email.service';

export type PaddleEnvironment = 'sandbox' | 'production';

export interface PaddleWebhookEvent {
    event_id: string;
    event_type: string;
    occurred_at: string;
    data: {
        id: string;
        status?: string;
        customer_id?: string;
        address_id?: string;
        business_id?: string;
        currency_code?: string;
        created_at?: string;
        updated_at?: string;
        started_at?: string;
        first_billed_at?: string;
        next_billed_at?: string;
        paused_at?: string;
        canceled_at?: string;
        current_billing_period?: {
            starts_at: string;
            ends_at: string;
        };
        billing_cycle?: {
            frequency: number;
            interval: string;
        };
        scheduled_change?: {
            action: string;
            effective_at: string;
            resume_at?: string;
        } | null;
        management_urls?: {
            update_payment_method?: string;
            cancel?: string;
        };
        items?: Array<{
            price?: {
                id: string;
                product_id: string;
                description?: string;
            };
            quantity?: number;
        }>;
        custom_data?: {
            userId?: string;
            planId?: string;
            userEmail?: string;
            [key: string]: unknown;
        };
        transaction_id?: string;
    };
}

export class PaddleService {
    private get apiKey(): string {
        return process.env.PADDLE_API_KEY || '';
    }

    private get webhookSecretKey(): string {
        return process.env.PADDLE_WEBHOOK_SECRET_KEY || '';
    }

    private get environment(): PaddleEnvironment {
        return (process.env.PADDLE_ENVIRONMENT as PaddleEnvironment) || 'sandbox';
    }

    private get baseUrl(): string {
        return this.environment === 'production'
            ? 'https://api.paddle.com'
            : 'https://sandbox-api.paddle.com';
    }

    public getPriceIdForPlan(planType: PlanType): string {
        if (planType === PlanType.PRO) {
            return process.env.PADDLE_PRICE_ID_PRO || process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || 'pri_pro_default';
        }
        if (planType === PlanType.ENTERPRISE) {
            return process.env.PADDLE_PRICE_ID_ENTERPRISE || process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE || 'pri_enterprise_default';
        }
        return '';
    }

    public getPlanFromPriceId(priceId?: string): PlanType {
        if (!priceId) return PlanType.PRO;

        const proPriceId = this.getPriceIdForPlan(PlanType.PRO);
        const enterprisePriceId = this.getPriceIdForPlan(PlanType.ENTERPRISE);

        if (priceId === enterprisePriceId || priceId.toLowerCase().includes('enterprise')) {
            return PlanType.ENTERPRISE;
        }
        if (priceId === proPriceId || priceId.toLowerCase().includes('pro')) {
            return PlanType.PRO;
        }
        return PlanType.PRO;
    }

    /**
     * Verifies the Paddle webhook signature header (Paddle-Signature: ts=...;h1=...).
     */
    public verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string | undefined): boolean {
        if (!signatureHeader || !this.webhookSecretKey) {
            // If secret is not set in non-production, log and allow testing
            if (process.env.NODE_ENV !== 'production' && !this.webhookSecretKey) {
                console.warn('[PaddleService] PADDLE_WEBHOOK_SECRET_KEY is not set. Allowing in development mode.');
                return true;
            }
            return false;
        }

        try {
            const parts = signatureHeader.split(';');
            let ts = '';
            let h1 = '';

            for (const part of parts) {
                const [key, value] = part.split('=');
                if (key && value && key.trim() === 'ts') ts = value.trim();
                if (key && value && key.trim() === 'h1') h1 = value.trim();
            }

            if (!ts || !h1) return false;

            const bodyString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
            const signedPayload = `${ts}:${bodyString}`;
            const expectedHash = crypto
                .createHmac('sha256', this.webhookSecretKey)
                .update(signedPayload)
                .digest('hex');

            const h1Buffer = Buffer.from(h1, 'utf8');
            const expectedBuffer = Buffer.from(expectedHash, 'utf8');

            if (h1Buffer.length !== expectedBuffer.length) {
                return false;
            }

            return crypto.timingSafeEqual(h1Buffer, expectedBuffer);
        } catch (error) {
            console.error('[PaddleService] Error verifying webhook signature:', error);
            return false;
        }
    }

    /**
     * Processes Paddle Webhook Events
     */
    public async processWebhookEvent(event: PaddleWebhookEvent): Promise<{ success: boolean; message: string }> {
        const { event_type, data } = event;
        console.log(`[PaddleService] Processing event: ${event_type} (Subscription ID: ${data.id})`);

        switch (event_type) {
            case 'subscription.created':
            case 'subscription.activated':
            case 'subscription.imported':
                return this.handleSubscriptionActivated(data);

            case 'subscription.updated':
                return this.handleSubscriptionUpdated(data);

            case 'subscription.canceled':
                return this.handleSubscriptionCanceled(data);

            case 'subscription.past_due':
                return this.handleSubscriptionPastDue(data);

            case 'transaction.completed':
                return this.handleTransactionCompleted(data);

            default:
                return { success: true, message: `Event ${event_type} acknowledged` };
        }
    }

    private async handleSubscriptionActivated(data: PaddleWebhookEvent['data']) {
        const userId = data.custom_data?.userId || await this.findUserIdByCustomer(data.customer_id, data.custom_data?.userEmail);
        if (!userId) {
            console.warn(`[PaddleService] No userId found for subscription ${data.id}`);
            return { success: false, message: 'User not found' };
        }

        const priceId = data.items?.[0]?.price?.id;
        const planType = data.custom_data?.planId
            ? (data.custom_data.planId.toUpperCase() as PlanType)
            : this.getPlanFromPriceId(priceId);

        const plan = await prisma.plan.findUnique({ where: { name: planType } });
        if (!plan) {
            console.error(`[PaddleService] Plan not found for type: ${planType}`);
            return { success: false, message: 'Plan not found' };
        }

        const periodStart = data.current_billing_period?.starts_at ? new Date(data.current_billing_period.starts_at) : new Date();
        const periodEnd = data.current_billing_period?.ends_at ? new Date(data.current_billing_period.ends_at) : undefined;

        await prisma.subscription.upsert({
            where: { userId },
            update: {
                planId: plan.id,
                status: SubscriptionStatus.ACTIVE,
                startDate: periodStart,
                endDate: periodEnd,
                canceledAt: null,
                paddleCustomerId: data.customer_id || null,
                paddleSubscriptionId: data.id,
                paddlePriceId: priceId || null,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                updatePaymentUrl: data.management_urls?.update_payment_method || null,
                cancelUrl: data.management_urls?.cancel || null,
            },
            create: {
                userId,
                planId: plan.id,
                status: SubscriptionStatus.ACTIVE,
                startDate: periodStart,
                endDate: periodEnd,
                paddleCustomerId: data.customer_id || null,
                paddleSubscriptionId: data.id,
                paddlePriceId: priceId || null,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                updatePaymentUrl: data.management_urls?.update_payment_method || null,
                cancelUrl: data.management_urls?.cancel || null,
            },
        });

        console.log(`[PaddleService] Subscription activated for user ${userId} -> Plan: ${planType}`);
        
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } });
        if (user) {
            void notificationEmailService.sendPlanUpdateEmail(user, planType).catch((err) => {
                console.warn('Failed to send plan update email:', err);
            });
        }
        return { success: true, message: `Subscription activated for user ${userId}` };
    }

    private async handleSubscriptionUpdated(data: PaddleWebhookEvent['data']) {
        const subscription = await prisma.subscription.findUnique({
            where: { paddleSubscriptionId: data.id },
            include: { Plan: true },
        });

        if (!subscription) {
            // If subscription record doesn't exist by paddleSubscriptionId yet, try activating
            return this.handleSubscriptionActivated(data);
        }

        const priceId = data.items?.[0]?.price?.id;
        const planType = data.custom_data?.planId
            ? (data.custom_data.planId.toUpperCase() as PlanType)
            : this.getPlanFromPriceId(priceId);

        const targetPlan = await prisma.plan.findUnique({ where: { name: planType } }) || subscription.Plan;

        const periodStart = data.current_billing_period?.starts_at ? new Date(data.current_billing_period.starts_at) : subscription.currentPeriodStart;
        const periodEnd = data.current_billing_period?.ends_at ? new Date(data.current_billing_period.ends_at) : subscription.currentPeriodEnd;
        const isScheduledCancel = data.scheduled_change?.action === 'cancel';

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                planId: targetPlan.id,
                status: data.status === 'active' ? SubscriptionStatus.ACTIVE : (data.status === 'past_due' ? SubscriptionStatus.PAST_DUE : SubscriptionStatus.ACTIVE),
                endDate: periodEnd,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: isScheduledCancel,
                paddlePriceId: priceId || subscription.paddlePriceId,
                updatePaymentUrl: data.management_urls?.update_payment_method || subscription.updatePaymentUrl,
                cancelUrl: data.management_urls?.cancel || subscription.cancelUrl,
            },
        });

        console.log(`[PaddleService] Subscription updated for ${subscription.userId} -> Plan: ${targetPlan.name}`);

        const user = await prisma.user.findUnique({ where: { id: subscription.userId }, select: { id: true, email: true, name: true } });
        if (user) {
            void notificationEmailService.sendPlanUpdateEmail(user, targetPlan.name, subscription.Plan.name).catch((err) => {
                console.warn('Failed to send plan update email:', err);
            });
        }
        return { success: true, message: `Subscription updated for ${subscription.userId}` };
    }

    private async handleSubscriptionCanceled(data: PaddleWebhookEvent['data']) {
        const subscription = await prisma.subscription.findUnique({
            where: { paddleSubscriptionId: data.id },
            include: { Plan: true },
        });

        if (!subscription) {
            console.warn(`[PaddleService] Subscription not found for cancellation: ${data.id}`);
            return { success: true, message: 'Subscription not found' };
        }

        const freePlan = await prisma.plan.findUnique({ where: { name: PlanType.FREE } });

        // Update status to canceled and revert user to free plan
        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: SubscriptionStatus.CANCELED,
                canceledAt: data.canceled_at ? new Date(data.canceled_at) : new Date(),
                cancelAtPeriodEnd: false,
                ...(freePlan ? { planId: freePlan.id } : {}),
            },
        });

        console.log(`[PaddleService] Subscription canceled for user ${subscription.userId}`);

        const user = await prisma.user.findUnique({ where: { id: subscription.userId }, select: { id: true, email: true, name: true } });
        if (user) {
            void notificationEmailService.sendPlanUpdateEmail(user, 'FREE', subscription.Plan.name).catch((err) => {
                console.warn('Failed to send plan update email:', err);
            });
        }
        return { success: true, message: `Subscription canceled for user ${subscription.userId}` };
    }

    private async handleSubscriptionPastDue(data: PaddleWebhookEvent['data']) {
        const subscription = await prisma.subscription.findUnique({
            where: { paddleSubscriptionId: data.id },
        });

        if (subscription) {
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: SubscriptionStatus.PAST_DUE },
            });
        }

        return { success: true, message: `Subscription ${data.id} marked as past due` };
    }

    private async handleTransactionCompleted(data: PaddleWebhookEvent['data']) {
        if (data.id && data.custom_data?.userId) {
            await prisma.subscription.updateMany({
                where: { userId: data.custom_data.userId },
                data: { paddleTransactionId: data.id },
            });
        }
        return { success: true, message: `Transaction ${data.id} recorded` };
    }

    private async findUserIdByCustomer(customerId?: string, email?: string): Promise<string | null> {
        if (customerId) {
            const sub = await prisma.subscription.findFirst({
                where: { paddleCustomerId: customerId },
                select: { userId: true },
            });
            if (sub) return sub.userId;
        }

        if (email) {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true },
            });
            if (user) return user.id;
        }

        return null;
    }

    /**
     * Fetch user subscription details with billing management URLs
     */
    public async getUserSubscriptionDetails(userId: string) {
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
            include: { Plan: true },
        });

        if (!subscription) {
            const freePlan = await prisma.plan.findUnique({ where: { name: PlanType.FREE } });
            const usage = await planUsageService.getUserUsage(userId, PlanType.FREE);
            return {
                plan: PlanType.FREE,
                status: 'ACTIVE',
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
                updatePaymentUrl: null,
                cancelUrl: null,
                paddleSubscriptionId: null,
                price: freePlan?.price ?? 0,
                usage,
            };
        }

        const usage = await planUsageService.getUserUsage(userId, subscription.Plan.name);

        return {
            plan: subscription.Plan.name,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd || subscription.endDate,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            updatePaymentUrl: subscription.updatePaymentUrl,
            cancelUrl: subscription.cancelUrl,
            paddleSubscriptionId: subscription.paddleSubscriptionId,
            price: subscription.Plan.price,
            usage,
        };
    }

    /**
     * Cancels subscription in Paddle API and updates local record
     */
    public async cancelUserSubscription(userId: string, effectiveFrom: 'immediately' | 'next_billing_period' = 'next_billing_period') {
        const subscription = await prisma.subscription.findUnique({
            where: { userId },
            include: { Plan: true },
        });

        if (!subscription || !subscription.paddleSubscriptionId) {
            // Local downgrade to free
            const freePlan = await prisma.plan.findUnique({ where: { name: PlanType.FREE } });
            if (freePlan) {
                await prisma.subscription.update({
                    where: { userId },
                    data: {
                        planId: freePlan.id,
                        status: SubscriptionStatus.CANCELED,
                        canceledAt: new Date(),
                    },
                });
            }
            return { success: true, message: 'Subscription canceled successfully' };
        }

        // Call Paddle API if API key exists
        if (this.apiKey) {
            try {
                const response = await fetch(`${this.baseUrl}/subscriptions/${subscription.paddleSubscriptionId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        effective_from: effectiveFrom,
                    }),
                });

                if (!response.ok) {
                    const err = await response.json();
                    console.error('[PaddleService] Paddle cancel API error:', err);
                }
            } catch (err) {
                console.error('[PaddleService] Network error canceling in Paddle:', err);
            }
        }

        if (effectiveFrom === 'immediately') {
            const freePlan = await prisma.plan.findUnique({ where: { name: PlanType.FREE } });
            await prisma.subscription.update({
                where: { userId },
                data: {
                    status: SubscriptionStatus.CANCELED,
                    canceledAt: new Date(),
                    ...(freePlan ? { planId: freePlan.id } : {}),
                },
            });
        } else {
            await prisma.subscription.update({
                where: { userId },
                data: {
                    cancelAtPeriodEnd: true,
                },
            });
        }

        return { success: true, message: 'Subscription scheduled for cancellation' };
    }
}

export const paddleService = new PaddleService();
