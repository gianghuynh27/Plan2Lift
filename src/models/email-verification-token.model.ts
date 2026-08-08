import { Document, Model, model, Schema, Types } from 'mongoose';

interface IEmailVerificationToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationTokenSchema = new Schema<IEmailVerificationToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

emailVerificationTokenSchema.index({ userId: 1 }, { unique: true });

emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken: Model<IEmailVerificationToken> =
  model<IEmailVerificationToken>(
    'EmailVerificationToken',
    emailVerificationTokenSchema,
  );

export default EmailVerificationToken;
