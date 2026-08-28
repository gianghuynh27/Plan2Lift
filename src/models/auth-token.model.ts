import { Model, model, Schema, Document } from 'mongoose';

interface IAuthToken extends Document {
  userId: string;
  refreshToken: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const authTokenSchema: Schema = new Schema(
  {
    userId: { ref: 'User', type: Schema.Types.ObjectId, required: true },
    refreshToken: { type: String, required: true, unique: true },
    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

authTokenSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  },
);

const AuthToken: Model<IAuthToken> = model<IAuthToken>(
  'AuthToken',
  authTokenSchema,
);

export default AuthToken;
