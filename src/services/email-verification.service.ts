import config from '../config/config';
import EmailVerificationToken from '../models/email-verification-token.model';
import User from '../models/user.model';
import {
  generateVerificationToken,
  hashVerificationToken,
} from '../utils/verify-token.util';
import emailService from './email.service';

type SendVerificationEmailInput = {
  userId: string;
  email: string;
  enforceCooldown?: boolean;
};

export class VerificationEmailCooldownError extends Error {
  constructor() {
    super('Verification email was sent recently');
    this.name = 'VerificationEmailCooldownError';
  }
}

class EmailVerificationService {
  async sendVerificationEmail({
    userId,
    email,
    enforceCooldown = false,
  }: SendVerificationEmailInput): Promise<void> {
    if (enforceCooldown) {
      const cooldownStart = new Date(
        Date.now() - config.emailVerificationResendCooldownSeconds * 1000,
      );

      const recentlyCreatedToken = await EmailVerificationToken.findOne({
        userId,
        updatedAt: {
          $gte: cooldownStart,
        },
      });

      if (recentlyCreatedToken) {
        throw new VerificationEmailCooldownError();
      }
    }

    const token = generateVerificationToken();
    const tokenHash = hashVerificationToken(token);
    const expiresAt = new Date(
      Date.now() + config.emailVerificationTtlMinutes * 60 * 1000,
    );
    await EmailVerificationToken.findOneAndUpdate(
      { userId },
      {
        $set: {
          tokenHash,
          expiresAt,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const verificationUrl = new URL(
      '/api/v1/auth/verify-email',
      config.appPublicUrl,
    );

    verificationUrl.searchParams.set('token', token);

    await emailService.sendVerificationEmail(email, verificationUrl.toString());
  }
  async verifyEmail(token: string): Promise<boolean> {
    const tokenHash = hashVerificationToken(token);

    const verificationToken = await EmailVerificationToken.findOne({
      tokenHash,
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (!verificationToken) {
      return false;
    }

    const user = await User.findOneAndUpdate(
      {
        _id: verificationToken.userId,
        isVerified: false,
      },
      {
        $set: {
          isVerified: true,
        },
      },
      {
        new: true,
      },
    );

    if (!user) {
      const existingUser = await User.findById(verificationToken.userId);

      if (!existingUser?.isVerified) {
        return false;
      }
    }

    await EmailVerificationToken.deleteMany({
      userId: verificationToken.userId,
    });

    return true;
  }
}
const emailVerificationService = new EmailVerificationService();

export default emailVerificationService;
