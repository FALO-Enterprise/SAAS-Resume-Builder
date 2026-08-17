import { Request, Response } from 'express';
import { paddleService, PaddleWebhookEvent } from './paddle.service';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import prisma from '../../prisma/prisma.service';
import { HttpErrorStatus } from '../../common/utils/util.types';

export class PaymentController {
    /**
     * Webhook receiver for Paddle v2 billing events
     */
    handleWebhook = async (req: Request, res: Response) => {
        const signatureHeader = req.headers['paddle-signature'] as string | undefined;
        const rawBody = (req as Request & { rawBody?: Buffer | string }).rawBody || JSON.stringify(req.body);

        const isValid = paddleService.verifyWebhookSignature(rawBody, signatureHeader);
        if (!isValid) {
            console.error('[PaymentController] Invalid Paddle webhook signature');
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        try {
            const event = req.body as PaddleWebhookEvent;
            const result = await paddleService.processWebhookEvent(event);
            return res.status(200).json(result);
        } catch (error) {
            console.error('[PaymentController] Error processing Paddle webhook:', error);
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Internal webhook error',
            });
        }
    };

    /**
     * Retrieves current user subscription details & management links
     */
    getSubscription = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.error({ message: 'Unauthorized', statusCode: HttpErrorStatus.Unauthorized });
            }

            const details = await paddleService.getUserSubscriptionDetails(userId);
            return res.ok(details);
        } catch (error) {
            console.error('[PaymentController] Error fetching subscription details:', error);
            return res.error({
                message: error instanceof Error ? error.message : 'Failed to fetch subscription',
                statusCode: HttpErrorStatus.InternalServerError,
            });
        }
    };

    /**
     * Prepares checkout configuration for client Paddle.js overlay
     */
    createCheckoutSession = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            const userEmail = req.user?.email;
            const { planId } = req.body as { planId?: string };

            if (!userId) {
                return res.error({ message: 'Unauthorized', statusCode: HttpErrorStatus.Unauthorized });
            }

            const targetPlan = (planId?.toUpperCase() as PlanType) || PlanType.PRO;
            const priceId = paddleService.getPriceIdForPlan(targetPlan);

            return res.ok({
                clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || process.env.PADDLE_CLIENT_TOKEN || '',
                environment: process.env.PADDLE_ENVIRONMENT || 'sandbox',
                priceId,
                planId: targetPlan,
                customData: {
                    userId,
                    userEmail,
                    planId: targetPlan,
                },
            });
        } catch (error) {
            console.error('[PaymentController] Error creating checkout session:', error);
            return res.error({
                message: error instanceof Error ? error.message : 'Failed to create checkout session',
                statusCode: HttpErrorStatus.InternalServerError,
            });
        }
    };

    /**
     * Synchronizes and immediately activates plan after client checkout completion
     */
    syncCheckout = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.error({ message: 'Unauthorized', statusCode: HttpErrorStatus.Unauthorized });
            }

            const { planId, transactionId } = req.body as { planId?: string; transactionId?: string };
            const targetPlanType = (planId?.toUpperCase() as PlanType) || PlanType.PRO;

            const targetPlan = await prisma.plan.findUnique({ where: { name: targetPlanType } });
            if (!targetPlan) {
                return res.error({ message: 'Plan not found', statusCode: HttpErrorStatus.NotFound });
            }

            const subscription = await prisma.subscription.upsert({
                where: { userId },
                update: {
                    planId: targetPlan.id,
                    status: SubscriptionStatus.ACTIVE,
                    paddleTransactionId: transactionId || null,
                    startDate: new Date(),
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    canceledAt: null,
                    cancelAtPeriodEnd: false,
                },
                create: {
                    userId,
                    planId: targetPlan.id,
                    status: SubscriptionStatus.ACTIVE,
                    paddleTransactionId: transactionId || null,
                    startDate: new Date(),
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
                include: { Plan: true },
            });

            return res.ok({
                success: true,
                plan: subscription.Plan.name,
                status: subscription.status,
                transactionId: subscription.paddleTransactionId,
                currentPeriodEnd: subscription.currentPeriodEnd,
            });
        } catch (error) {
            console.error('[PaymentController] Error syncing checkout:', error);
            return res.error({
                message: error instanceof Error ? error.message : 'Failed to sync checkout',
                statusCode: HttpErrorStatus.InternalServerError,
            });
        }
    };

    /**
     * Cancels subscription
     */
    cancelSubscription = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.error({ message: 'Unauthorized', statusCode: HttpErrorStatus.Unauthorized });
            }

            const { immediately } = req.body as { immediately?: boolean };
            const effectiveFrom = immediately ? 'immediately' : 'next_billing_period';

            const result = await paddleService.cancelUserSubscription(userId, effectiveFrom);
            return res.ok(result);
        } catch (error) {
            console.error('[PaymentController] Error canceling subscription:', error);
            return res.error({
                message: error instanceof Error ? error.message : 'Failed to cancel subscription',
                statusCode: HttpErrorStatus.InternalServerError,
            });
        }
    };
}
