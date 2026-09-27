import { model, Schema, Document, Model } from 'mongoose';

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseCategory =
  | 'balance'
  | 'cardio'
  | 'mobility'
  | 'plyometrics'
  | 'rehabilitation'
  | 'strength'
  | 'stretching';

export interface IExercise extends Document {
  source?: string;
  sourceID?: string;

  name: string;
  muscleGroup: string;
  bodyPart?: string;
  equipment?: string;

  secondaryMuscles: string[];
  instructions: string[];

  description?: string;
  difficulty?: ExerciseDifficulty;
  category?: ExerciseCategory;

  isArchived: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    source: {
      type: String,
      trim: true,
    },

    sourceID: {
      type: String,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    muscleGroup: {
      type: String,
      required: true,
      trim: true,
    },

    bodyPart: {
      type: String,
      trim: true,
    },

    equipment: {
      type: String,
      trim: true,
    },

    secondaryMuscles: {
      type: [String],
      default: [],
    },

    instructions: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
    },

    category: {
      type: String,
      enum: [
        'balance',
        'cardio',
        'mobility',
        'plyometrics',
        'rehabilitation',
        'strength',
        'stretching',
      ],
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Existing manually created exercises may not have
 * source/sourceID, so use a partial unique index.
 */
exerciseSchema.index(
  {
    source: 1,
    sourceID: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      source: {
        $type: 'string',
      },
      sourceID: {
        $type: 'string',
      },
    },
  },
);

exerciseSchema.index({
  isArchived: 1,
  name: 1,
});

exerciseSchema.index({
  isArchived: 1,
  muscleGroup: 1,
  name: 1,
});

const Exercise: Model<IExercise> = model<IExercise>('Exercise', exerciseSchema);

export default Exercise;
