import { Router } from 'express';

import usersRoutes from './users.routes';
import authRoutes from './auth.routes';
import workoutPlansRoutes from './workout-plans.routes';
import exercisesRoutes from './exercises.routes';

const router = Router();

router.use('/users', usersRoutes);
router.use('/auth', authRoutes);

router.use('/workout-plans', workoutPlansRoutes);

router.use('/exercises', exercisesRoutes);

export default router;
