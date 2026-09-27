import * as z from 'zod';

export const exerciseImportSchema = z.strictObject({
  id: z.string().trim().min(1),

  name: z.string().trim().min(1),

  bodyPart: z.string().trim().min(1),

  equipment: z.string().trim().min(1),

  target: z.string().trim().min(1),

  secondaryMuscles: z.array(z.string().trim().min(1)),

  instructions: z.array(z.string().trim().min(1)).min(1),

  description: z.string().trim().min(1),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),

  category: z.enum([
    'balance',
    'cardio',
    'mobility',
    'plyometrics',
    'rehabilitation',
    'strength',
    'stretching',
  ]),
});

export type ExerciseImportInput = z.infer<typeof exerciseImportSchema>;
