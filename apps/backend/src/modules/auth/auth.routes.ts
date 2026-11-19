import { RequestHandler, Router } from "express";
import { authController } from "./auth.controller";
import { uploadSingle } from "../../config/multer.config";
import { oauthController } from "./oauth.controller";
import {
    verifyRateLimiter,
    resendCodeRateLimiter,
    registerRateLimiter,
    loginRateLimiter,
    passwordResetRateLimiter,
} from "../../common/middlewares/rate-limit.middleware";

const router = Router();

router.post('/register', registerRateLimiter, uploadSingle('avatar'), authController.register.bind(authController) as RequestHandler);
router.post('/verify', verifyRateLimiter, authController.verify.bind(authController) as RequestHandler);
router.post('/resend-code', resendCodeRateLimiter, authController.resendCode.bind(authController) as RequestHandler);
router.post('/forgot-password', passwordResetRateLimiter, authController.forgotPassword.bind(authController) as RequestHandler);
router.post('/validate-reset-token', authController.validateResetToken.bind(authController) as RequestHandler);
router.post('/reset-password', passwordResetRateLimiter, authController.resetPassword.bind(authController) as RequestHandler);
router.post('/login', loginRateLimiter, authController.login.bind(authController) as RequestHandler);
router.post('/login-jwt', loginRateLimiter, authController.loginWithJWT.bind(authController) as RequestHandler);
router.get('/oauth/:provider', oauthController.start.bind(oauthController) as RequestHandler);
router.get('/oauth/:provider/callback', oauthController.callback.bind(oauthController) as RequestHandler);
router.post('/oauth/exchange', oauthController.exchange.bind(oauthController) as RequestHandler);

export const authRouter = router;
