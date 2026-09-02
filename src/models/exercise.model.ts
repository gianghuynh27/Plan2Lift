import { model, Schema, Document, Model } from 'mongoose';

export interface IExercise extends Document {
  name: string;
  muscleGroup: string;
  equipment?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExercise>(
  {
    name: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    equipment: { type: String },
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
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
