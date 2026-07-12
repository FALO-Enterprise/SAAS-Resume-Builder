import { RequestHandler, Router } from "express";
import { authController } from "./auth.controller";
import { uploadSingle } from "../../config/multer.config";

const router = Router();


router.post('/register', uploadSingle('avatar'), authController.register.bind(authController) as RequestHandler);
router.post('/verify', authController.verify.bind(authController) as RequestHandler);
router.post('/resend-code', authController.resendCode.bind(authController) as RequestHandler);
router.post('/login', authController.login.bind(authController) as RequestHandler);
router.post('/login-jwt', authController.loginWithJWT.bind(authController) as RequestHandler);

export const authRouter = router;