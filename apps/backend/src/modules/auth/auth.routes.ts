import { RequestHandler, Router } from "express";
import { authController } from "./auth.controller";
import { uploadSingle } from "../../config/multer.config";
import { oauthController } from "./oauth.controller";

const router = Router();


router.post('/register', uploadSingle('avatar'), authController.register.bind(authController) as RequestHandler);
router.post('/verify', authController.verify.bind(authController) as RequestHandler);
router.post('/resend-code', authController.resendCode.bind(authController) as RequestHandler);
router.post('/forgot-password', authController.forgotPassword.bind(authController) as RequestHandler);
router.post('/validate-reset-token', authController.validateResetToken.bind(authController) as RequestHandler);
router.post('/reset-password', authController.resetPassword.bind(authController) as RequestHandler);
router.post('/login', authController.login.bind(authController) as RequestHandler);
router.post('/login-jwt', authController.loginWithJWT.bind(authController) as RequestHandler);
router.get('/oauth/:provider', oauthController.start.bind(oauthController) as RequestHandler);
router.get('/oauth/:provider/callback', oauthController.callback.bind(oauthController) as RequestHandler);
router.post('/oauth/exchange', oauthController.exchange.bind(oauthController) as RequestHandler);

export const authRouter = router;
