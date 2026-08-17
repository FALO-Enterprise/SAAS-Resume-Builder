import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';

const router = Router();
const paymentController = new PaymentController();

// Webhook endpoint (must not be gated by user authentication)
router.post('/webhook', paymentController.handleWebhook);

// Authenticated user endpoints
router.use(isAuthenticated);
router.get('/subscription', paymentController.getSubscription);
router.post('/checkout-session', paymentController.createCheckoutSession);
router.post('/sync-checkout', paymentController.syncCheckout);
router.post('/cancel', paymentController.cancelSubscription);

export const paymentRouter = router;
