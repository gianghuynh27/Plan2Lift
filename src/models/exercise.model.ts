import { model, Schema, Document, Model, Types } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  muscleGroup: string;
  equipment?: string;
  createdBy?: Types.ObjectId;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseScheme = new Schema<IExercise>(
  {
    name: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    equipment: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

const Exercise: Model<IExercise> = model<IExercise>('Exercise', exerciseScheme);

export default Exercise;
