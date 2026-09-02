import { Request, Response } from 'express';
import type { QueryFilter } from 'mongoose';

import BaseController from './base.controller';
import Exercise, { IExercise } from '../models/exercise.model';

import type { ExerciseQueryInput } from '../schemas/exercise.schema';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ExercisesController extends BaseController {
  constructor() {
    super(Exercise);
  }

  async listExercises(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    try {
      const query =
        (res.locals.validatedQuery as ExerciseQueryInput | undefined) ?? {};

      const filter: QueryFilter<IExercise> = {
        isArchived: false,
      };

      if (query.search) {
        filter.name = {
          $regex: escapeRegex(query.search),

          $options: 'i',
        };
      }

      if (query.muscleGroup) {
        filter.muscleGroup = {
          $regex: `^${escapeRegex(query.muscleGroup)}$`,

          $options: 'i',
        };
      }

      const exercises = await Exercise.find(filter)
        .sort({
          name: 1,
        })
        .lean();

      this.logger.debug('Exercises retrieved', {
        userId: req.auth.userId,

        count: exercises.length,

        search: query.search,

        muscleGroup: query.muscleGroup,
      });

      return res.status(200).json({
        message: 'Exercises retrieved successfully',

        data: exercises,

        total: exercises.length,
      });
    } catch (error) {
      this.logger.error('Failed to retrieve exercises', {
        userId: req.auth.userId,

        error:
          error instanceof Error
            ? {
                name: error.name,

                message: error.message,

                stack: error.stack,
              }
            : error,
      });

      return res.status(500).json({
        message: 'Unable to retrieve exercises',
      });
    }
  }

  async getExerciseById(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    const exerciseId = req.params.id;

    try {
      const exercise = await Exercise.findOne({
        _id: exerciseId,
        isArchived: false,
      }).lean();

      if (!exercise) {
        return res.status(404).json({
          message: 'Exercise not found',
        });
      }

      this.logger.debug('Exercise retrieved', {
        userId: req.auth.userId,

        exerciseId,
      });

      return res.status(200).json({
        message: 'Exercise retrieved successfully',

        data: exercise,
      });
    } catch (error) {
      this.logger.error('Failed to retrieve exercise', {
        userId: req.auth.userId,

        exerciseId,

        error: error instanceof Error ? error.message : error,
      });

      return res.status(500).json({
        message: 'Unable to retrieve exercise',
      });
    }
  }
}

const exercisesController = new ExercisesController();

export default exercisesController;
