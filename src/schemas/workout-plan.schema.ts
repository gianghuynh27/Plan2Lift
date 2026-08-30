import { Types } from 'mongoose';
import * as z from 'zod';

const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), {
    error: 'Invalid MongoDB ObjectId',
  });

const plannedExerciseSchema = z.strictObject({
  /*
   * Optional so existing embedded-document IDs can
   * be preserved when replacing the days array.
   */
  _id: objectIdSchema.optional(),

  exerciseId: objectIdSchema,

  targetSets: z.number().int().min(1, 'targetSets must be at least 1'),

  targetReps: z.number().int().min(1, 'targetReps must be at least 1'),
});

const workoutDaySchema = z.strictObject({
  _id: objectIdSchema.optional(),

  name: z.string().trim().min(1, 'Day name is required'),

  exercises: z.array(plannedExerciseSchema).default([]),
});
const workoutPlanFields = {
  name: z.string().trim().min(1, 'Workout plan name is required'),

  description: z.string().trim().optional(),

  days: z.array(workoutDaySchema),

  isActive: z.boolean(),
};
export const createWorkoutPlanSchema = z.strictObject({
  name: z.string().trim().min(1, 'Workout plan name is required'),

  description: z.string().trim().optional(),

  days: z.array(workoutDaySchema).default([]),

  isActive: z.boolean().default(false),
});

export const updateWorkoutPlanSchema = z
  .strictObject(workoutPlanFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    error: 'Provide at least one field to update',
  });
export const workoutPlanParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export type CreateWorkoutPlanInput = z.infer<typeof createWorkoutPlanSchema>;

export type UpdateWorkoutPlanInput = z.infer<typeof updateWorkoutPlanSchema>;
