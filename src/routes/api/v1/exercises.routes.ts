import { Router } from 'express';

import exercisesController from '../../../controllers/exercises.controller';

import { requireAuth } from '../../../middleware/auth.middleware';
import { validate } from '../../../middleware/validate.middleware';

import {
  exerciseParamsSchema,
  exerciseQuerySchema,
} from '../../../schemas/exercise.schema';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  validate(exerciseQuerySchema, 'query'),
  exercisesController.listExercises.bind(exercisesController),
);

router.get(
  '/:id',
  validate(exerciseParamsSchema, 'params'),
  exercisesController.getExerciseById.bind(exercisesController),
);

export default router;
