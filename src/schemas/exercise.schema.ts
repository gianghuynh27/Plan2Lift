import { Types } from 'mongoose';
import * as z from 'zod';

const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), {
    error: 'Invalid MongoDB ObjectId',
  });

export const exerciseParamsSchema = z.strictObject({
  id: objectIdSchema,
});

export const exerciseQuerySchema = z.strictObject({
  search: z
    .string()
    .trim()
    .min(1, 'Search cannot be empty')
    .max(100, 'Search is too long')
    .optional(),

  muscleGroup: z
    .string()
    .trim()
    .min(1, 'Muscle group cannot be empty')
    .max(100, 'Muscle group is too long')
    .optional(),
});

export type ExerciseQueryInput = z.infer<typeof exerciseQuerySchema>;
