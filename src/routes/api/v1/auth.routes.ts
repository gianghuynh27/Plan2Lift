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
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post(
  '/verify-email',
  validateVerificationToken,
  authController.verifyEmail.bind(authController),
);
router.post(
  '/resend-verification',
  validateResendVerification,
  authController.resendVerification.bind(authController),
);
router.get(
  '/duplicate/:type',
  authController.checkDuplicate.bind(authController),
);

export default router;
