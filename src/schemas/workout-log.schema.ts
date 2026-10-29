import { Types } from 'mongoose';
import * as z from 'zod';

const objectIdSchema = z
  .string()
  .refine((value) => Types.ObjectId.isValid(value), {
    error: 'Invalid MongoDB ObjectId',
  });

const loggedSetSchema = z.strictObject({
  reps: z.number().int().min(1, 'reps must be at least 1'),
  // Omitted weight means unspecified; zero and fractional pounds are valid.
  weight: z.number().min(0, 'weight must be at least 0').optional(),
});

export const createWorkoutLogSchema = z.strictObject({
  // JSON carries a string; validate the calendar date before making a Date.
  // Date-only ISO strings become midnight UTC; calendar display must use UTC too.
  workoutDate: z.iso.date().transform((value) => new Date(value)),
  exerciseId: objectIdSchema,
  sets: z.array(loggedSetSchema).min(1, 'Log at least one set'),
  notes: z.string().trim().optional(),
});

// This is the parsed shape: workoutDate is a Date after validation.
// MongoDB generates _id; userId must come from the authenticated user.
export type CreateWorkoutLogInput = z.infer<typeof createWorkoutLogSchema>;
