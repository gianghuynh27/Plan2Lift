import { Router } from 'express';

import authController from '../../../controllers/auth.controller';
import {
  validateLogin,
  validateRegister,
} from '../../../middleware/auth-validation.middleware';

const router = Router();

router.post(
  '/register',
  validateRegister,
  authController.register.bind(authController),
);
router.post('/login', validateLogin, authController.login.bind(authController));

export default router;
