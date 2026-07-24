import { model, Schema, Types, Document, Model } from 'mongoose';

interface IPlannedExercise {
  _id: Types.ObjectId;
  exerciseId: Types.ObjectId;

  targetSets: number;
  targetReps: number;
}

interface IWorkoutDay {
  _id: Types.ObjectId;
  name: string;
  exercises: IPlannedExercise[];
}

export interface IWorkoutPlan extends Document {
  userId: Types.ObjectId;

  name: string;
  description?: string;
  days: IWorkoutDay[];

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const plannedExerciseSchema = new Schema<IPlannedExercise>({
  exerciseId: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },

  targetSets: {
    type: Number,
    required: true,
    min: 1,
  },

  targetReps: {
    type: Number,
    required: true,
    min: 1,
  },
});

const workoutDaySchema = new Schema<IWorkoutDay>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    exercises: {
      type: [plannedExerciseSchema],
      default: [],
    },
  },
  {
    _id: true,
  },
);

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    days: {
      type: [workoutDaySchema],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const WorkoutPlan: Model<IWorkoutPlan> = model<IWorkoutPlan>(
  'WorkoutPlan',
  workoutPlanSchema,
);

export default WorkoutPlan;
