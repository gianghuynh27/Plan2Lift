import { Request, Response } from 'express';

import BaseController from './base.controller';

import WorkoutPlan from '../models/workout-plan.model';
import Exercise from '../models/exercise.model';

import type {
  CreateWorkoutPlanInput,
  UpdateWorkoutPlanInput,
} from '../schemas/workout-plan.schema';

class WorkoutPlansController extends BaseController {
  constructor() {
    super(WorkoutPlan);
  }

  private async exercisesAreAvailable(
    days: CreateWorkoutPlanInput['days'],
  ): Promise<boolean> {
    const uniqueExerciseIds = [
      ...new Set(
        days.flatMap((day) =>
          day.exercises.map((exercise) => exercise.exerciseId),
        ),
      ),
    ];

    if (uniqueExerciseIds.length === 0) {
      return true;
    }

    const exerciseCount = await Exercise.countDocuments({
      _id: {
        $in: uniqueExerciseIds,
      },

      isArchived: false,
    });

    return exerciseCount === uniqueExerciseIds.length;
  }

  /*
   * POST /workout-plans
   */
  async createWorkoutPlan(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const userId = req.auth.userId;

    try {
      const input = req.body as CreateWorkoutPlanInput;

      const exercisesAreAvailable = await this.exercisesAreAvailable(
        input.days,
      );

      if (!exercisesAreAvailable) {
        this.logger.warn('Workout plan contains unavailable exercises', {
          userId,
        });

        return res.status(400).json({
          message: 'One or more exercises are unavailable',
        });
      }

      const workoutPlan = await WorkoutPlan.create({
        /*
         * Never accept userId from req.body.
         * It always comes from the access token.
         */
        userId,

        name: input.name,
        description: input.description,
        days: input.days,
        isActive: input.isActive,
      });

      this.logger.info('Workout plan created', {
        userId,
        workoutPlanId: workoutPlan._id.toString(),
      });

      return res.status(201).json({
        message: 'Workout plan created successfully',
        data: workoutPlan,
      });
    } catch (error) {
      this.logger.error('Failed to create workout plan', {
        userId,
        error,
      });

      return res.status(500).json({
        message: 'Unable to create workout plan',
      });
    }
  }

  /*
   * GET /workout-plans
   */
  async listWorkoutPlans(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const userId = req.auth.userId;

    try {
      const workoutPlans = await WorkoutPlan.find({
        userId,
        deletedAt: null,
      })
        .sort({
          createdAt: -1,
        })
        .populate({
          path: 'days.exercises.exerciseId',
          model: Exercise,
          select: 'name muscleGroup equipment',
        });

      this.logger.debug('Workout plans retrieved', {
        userId,
        count: workoutPlans.length,
      });
      return res.status(200).json({
        message: 'Workout plans retrieved successfully',
        data: workoutPlans,
        total: workoutPlans.length,
      });
    } catch (error) {
      this.logger.error('Failed to retrieve workout plans', {
        userId,
        error,
      });

      return res.status(500).json({
        message: 'Unable to retrieve workout plans',
      });
    }
  }

  /*
   * GET /workout-plans/:id
   */
  async getWorkoutPlanById(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const userId = req.auth.userId;
    const workoutPlanId = req.params.id;

    try {
      /*
       * userId is part of the database query.
       * Another user's plan will not be returned.
       */
      const workoutPlan = await WorkoutPlan.findOne({
        _id: workoutPlanId,
        userId,
        deletedAt: null,
      }).populate({
        path: 'days.exercises.exerciseId',
        model: Exercise,
        select: 'name muscleGroup equipment',
      });

      if (!workoutPlan) {
        return res.status(404).json({
          message: 'Workout plan not found',
        });
      }

      this.logger.debug('Workout plan retrieved', {
        userId,
        workoutPlanId,
      });

      return res.status(200).json({
        message: 'Workout plan retrieved successfully',
        data: workoutPlan,
      });
    } catch (error) {
      this.logger.error('Failed to retrieve workout plan', {
        userId,
        workoutPlanId,
        error,
      });

      return res.status(500).json({
        message: 'Unable to retrieve workout plan',
      });
    }
  }

  /*
   * PATCH /workout-plans/:id
   */
  async updateWorkoutPlan(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const userId = req.auth.userId;
    const workoutPlanId = req.params.id;

    try {
      const input = req.body as UpdateWorkoutPlanInput;

      if (input.days !== undefined) {
        const exercisesAreAvailable = await this.exercisesAreAvailable(
          input.days,
        );

        if (!exercisesAreAvailable) {
          return res.status(400).json({
            message: 'One or more exercises are unavailable',
          });
        }
      }

      /*
       * Explicitly construct the update object.
       * Do not spread req.body into the database query.
       */
      const update: Record<string, unknown> = {};

      if (input.name !== undefined) {
        update.name = input.name;
      }

      if (input.description !== undefined) {
        update.description = input.description;
      }

      if (input.days !== undefined) {
        update.days = input.days;
      }

      if (input.isActive !== undefined) {
        update.isActive = input.isActive;
      }

      const workoutPlan = await WorkoutPlan.findOneAndUpdate(
        {
          _id: workoutPlanId,
          userId,
          deletedAt: null,
        },
        {
          $set: update,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!workoutPlan) {
        return res.status(404).json({
          message: 'Workout plan not found',
        });
      }

      this.logger.info('Workout plan updated', {
        userId,
        workoutPlanId,
      });

      return res.status(200).json({
        message: 'Workout plan updated successfully',
        data: workoutPlan,
      });
    } catch (error) {
      this.logger.error('Failed to update workout plan', {
        userId,
        workoutPlanId,
        error,
      });

      return res.status(500).json({
        message: 'Unable to update workout plan',
      });
    }
  }

  /*
   * DELETE /workout-plans/:id
   *
   * This is a soft delete because your model
   * already contains deletedAt.
   */
  async deleteWorkoutPlan(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const userId = req.auth.userId;
    const workoutPlanId = req.params.id;

    try {
      const workoutPlan = await WorkoutPlan.findOneAndUpdate(
        {
          _id: workoutPlanId,
          userId,
          deletedAt: null,
        },
        {
          $set: {
            deletedAt: new Date(),
            isActive: false,
          },
        },
        {
          new: true,
        },
      );

      if (!workoutPlan) {
        return res.status(404).json({
          message: 'Workout plan not found',
        });
      }

      this.logger.info('Workout plan deleted', {
        userId,
        workoutPlanId,
      });

      return res.status(204).send();
    } catch (error) {
      this.logger.error('Failed to delete workout plan', {
        userId,
        workoutPlanId,
        error,
      });

      return res.status(500).json({
        message: 'Unable to delete workout plan',
      });
    }
  }
}

const workoutPlansController = new WorkoutPlansController();

export default workoutPlansController;
