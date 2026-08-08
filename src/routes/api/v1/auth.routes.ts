import { Router } from 'express';

import authController from '../../../controllers/auth.controller';
import {
  validateLogin,
  validateRegister,
  validateResendVerification,
  validateVerificationToken,
} from '../../../middleware/auth-validation.middleware';

const router = Router();

router.post(
  '/register',
  validateRegister,
  authController.register.bind(authController),
);
router.post('/login', validateLogin, authController.login.bind(authController));

router.get(
  '/verify-email',
  validateVerificationToken,
  authController.verifyEmail.bind(authController),
);

router.post(
  '/resend-verification',
  validateResendVerification,
  authController.resendVerification.bind(authController),
);

export default router;
