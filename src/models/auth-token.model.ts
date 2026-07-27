import { Model, model, Schema, Document } from 'mongoose';

interface IAuthToken extends Document {
  userId: string;
  refreshToken: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

const authTokenSchema: Schema = new Schema(
  {
    userId: { ref: 'User', type: Schema.Types.ObjectId, required: true },
    refreshToken: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const AuthToken: Model<IAuthToken> = model<IAuthToken>(
  'AuthToken',
  authTokenSchema,
);

export default AuthToken;
