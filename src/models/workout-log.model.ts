import { model, Schema, Types, Document, Model } from 'mongoose';

interface ILoggedSet {
  _id: Types.ObjectId;
  weight?: number;
  reps: number;
}

export interface IWorkoutLog extends Document {
  userId: Types.ObjectId;
  workoutDate: Date;
  exerciseId: Types.ObjectId;
  sets: ILoggedSet[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const loggedSetSchema = new Schema<ILoggedSet>({
  weight: {
    type: Number,
    min: 0,
    // Protect writes that bypass request validation, including Infinity.
    validate: { validator: Number.isFinite, message: 'weight must be finite' },
  },

  reps: {
    type: Number,
    required: true,
    min: 1,
    // Number permits fractions; completed reps must be whole numbers.
    validate: {
      validator: Number.isInteger,
      message: 'reps must be a whole number',
    },
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
    workoutDate: {
      type: Date,
      required: true,
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    sets: {
      type: [loggedSetSchema],
      default: [],
      // An empty array is valid while editing, but not in a saved log.
      validate: {
        validator: (sets: ILoggedSet[]) => sets.length > 0,
        message: 'Log at least one set',
      },
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
