import { Router, RequestHandler } from 'express';
import { supportController } from './support.controller';
import { createRateLimiter } from '../../common/middlewares/rate-limit.middleware';

const router = Router();

/**
 * Public endpoint, so it is rate limited by IP. Five messages per fifteen
 * minutes is generous for a person with a genuine problem and useless to a
 * spammer. The honeypot in the schema catches the rest.
 */
const contactRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'You have sent several messages already. Please wait a few minutes before sending another.',
});

// POST /api/support/contact — help-centre contact form. Intentionally
// unauthenticated: people who cannot sign in are exactly who needs it most.
router.post('/contact', contactRateLimiter, supportController.contact as RequestHandler);

export const supportRouter = router;
