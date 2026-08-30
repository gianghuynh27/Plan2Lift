import { Router } from 'express';

import workoutPlansController from '../../../controllers/workout-plans.controller';

import { requireAuth } from '../../../middleware/auth.middleware';
import { validate } from '../../../middleware/validate.middleware';

import {
  createWorkoutPlanSchema,
  updateWorkoutPlanSchema,
  workoutPlanParamsSchema,
} from '../../../schemas/workout-plan.schema';

const router = Router();

router.use(requireAuth);

router
  .route('/')
  .post(
    validate(createWorkoutPlanSchema, 'body'),
    workoutPlansController.createWorkoutPlan.bind(workoutPlansController),
  )
  .get(workoutPlansController.listWorkoutPlans.bind(workoutPlansController));

router
  .route('/:id')
  .get(
    validate(workoutPlanParamsSchema, 'params'),
    workoutPlansController.getWorkoutPlanById.bind(workoutPlansController),
  )
  .patch(
    validate(workoutPlanParamsSchema, 'params'),
    validate(updateWorkoutPlanSchema, 'body'),
    workoutPlansController.updateWorkoutPlan.bind(workoutPlansController),
  )
  .delete(
    validate(workoutPlanParamsSchema, 'params'),
    workoutPlansController.deleteWorkoutPlan.bind(workoutPlansController),
  );

export default router;
