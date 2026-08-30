import { Router } from 'express';

import usersRoutes from './users.routes';
import authRoutes from './auth.routes';
import workoutPlansRoutes from './workout-plans.routes';
const router = Router();

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);
router.use('/workout-plans', workoutPlansRoutes);
export default router;
