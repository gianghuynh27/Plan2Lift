import { model, Schema, Types, Document, Model } from 'mongoose';

type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

type LoggedExerciseStatus = 'NOT_STARTED' | 'COMPLETED' | 'SKIPPED';

interface ILoggedSet {
  _id: Types.ObjectId;
  weight?: number;
  reps: number;
}
// Weight represents optional external load, not body weight.
interface ILoggedExercise {
  _id: Types.ObjectId;
  exerciseId: Types.ObjectId;
  exerciseName: string;
  status: LoggedExerciseStatus;
  sets: ILoggedSet[];
  notes?: string;
}

export interface IWorkoutLog extends Document {
  userId: Types.ObjectId;

  workoutPlanId?: Types.ObjectId;
  planDayId?: Types.ObjectId;

  name: string;
  status: WorkoutStatus;

  startedAt: Date;
  completedAt?: Date;

  exercises: ILoggedExercise[];
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

const loggedSetSchema = new Schema<ILoggedSet>({
  weight: {
    type: Number,
    min: 0,
  },

  reps: {
    type: Number,
    required: true,
    min: 1,
  },
});

const loggedExerciseSchema = new Schema<ILoggedExercise>({
  exerciseId: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true,
  },

  exerciseName: {
    type: String,
    required: true,
    trim: true,
  },

  status: {
    type: String,
    enum: ['NOT_STARTED', 'COMPLETED', 'SKIPPED'],
    default: 'NOT_STARTED',
  },

  sets: {
    type: [loggedSetSchema],
    default: [],
  },

  notes: {
    type: String,
    trim: true,
  },
});

const workoutLogSchema = new Schema<IWorkoutLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    workoutPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkoutPlan',
    },

    planDayId: {
      type: Schema.Types.ObjectId,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
    },

    exercises: {
      type: [loggedExerciseSchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const WorkoutLog: Model<IWorkoutLog> = model<IWorkoutLog>(
  'WorkoutLog',
  workoutLogSchema,
);

export default WorkoutLog;
