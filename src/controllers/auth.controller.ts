import { Request, Response } from 'express';

import BaseController from './base.controller';
import AuthToken from '../models/auth-token.model';
import { hashPassword, verifyPassword } from '../utils/auth.util';
import emailVerificationService, {
  VerificationEmailCooldownError,
} from '../services/email-verification.service';

type DuplicateKeyError = {
  code: 11000;
  keyPattern?: Record<string, number>;
};

function isDuplicateKeyError(error: unknown): error is DuplicateKeyError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

class AuthController extends BaseController {
  constructor() {
    super(AuthToken);
  }

  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      const userModel = this.registry.get('user:model');
      const user = new userModel({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password: await hashPassword(password),
      });

      let savedUser;

      try {
        savedUser = await user.save();
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          const duplicateField = Object.keys(error.keyPattern ?? {})[0];

          this.logger.warn('Registration rejected: duplicate account field', {
            duplicateField: duplicateField ?? 'unknown',
          });

          const message =
            duplicateField === 'username'
              ? 'That username is already in use'
              : duplicateField === 'email'
                ? 'That email is already in use'
                : 'That username or email is already in use';

          return res.status(409).json({ message });
        }
        throw error;
      }

      let emailSent = true;

      try {
        await emailVerificationService.sendVerificationEmail({
          userId: savedUser._id.toString(),
          email: savedUser.email,
        });
      } catch (error) {
        emailSent = false;

        this.logger.error('Unable to send registration verification email', {
          userId: savedUser._id.toString(),
          error,
        });
      }

      this.logger.info('User registered successfully', {
        userId: savedUser._id.toString(),
        verificationEmailSent: emailSent,
      });

      return res.status(201).json({
        message: emailSent
          ? 'User registered successfully. Check your email to verify your account.'
          : 'User registered successfully, but the verification email could not be sent. Please request another verification email.',
        emailSent,
      });
      // const tokens = this.jwt.createTokens({
      //   userId: savedUser._id,
      //   username: savedUser.username,
      //   email: savedUser.email,
      // });

      // const authToken = new this.model({
      //   userId: savedUser._id,
      //   refreshToken: tokens.refreshToken,
      // });

      // await authToken.save();

      // this.logger.info('User registered successfully', {
      //   userId: savedUser._id.toString(),
      // });

      // res.status(201).json({
      //   message: 'User registered successfully',
      //   tokens: {
      //     accessToken: tokens.accessToken,
      //     refreshToken: tokens.refreshToken,
      //   },
      // });
    } catch (error) {
      this.logger.error('Registration failed:', { error });

      return res.status(500).json({
        message: 'Unable to register user',
      });
    }
  }
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const userModel = this.registry.get('user:model');

      const user = await userModel
        .findOne({
          email: email.trim().toLowerCase(),
        })
        .select('+password');

      if (!user) {
        this.logger.warn('Login rejected: invalid credentials');

        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }

      const isMatch = await verifyPassword(password, user.password);

      if (!isMatch) {
        this.logger.warn('Login rejected: invalid credentials');

        return res.status(401).json({
          message: 'Invalid email or password',
        });
      }
      if (!user.isVerified) {
        this.logger.warn('Login rejected: email is not verified', {
          userId: user._id.toString(),
        });

        return res.status(403).json({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Verify your email address before logging in',
        });
      }
      const tokens = this.jwt.createTokens({
        userId: user._id,
        username: user.username,
        email: user.email,
      });

      const findToken = await this.model.findOne({ userId: user._id });

      if (findToken) {
        await this.model.findByIdAndUpdate(findToken._id, {
          $set: {
            refreshToken: tokens.refreshToken,
          },
        });
      } else {
        const authToken = new this.model({
          userId: user._id,
          refreshToken: tokens.refreshToken,
        });
        await authToken.save();
      }

      this.logger.info('User logged in successfully', {
        userId: user._id.toString(),
      });

      res.status(200).json({
        message: 'User logged in successfully',
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      this.logger.error('Login failed:', { error });

      return res.status(500).json({
        message: 'Unable to login user',
      });
    }
  }
  async verifyEmail(req: Request, res: Response) {
    try {
      const token = req.query.token as string;

      const verified = await emailVerificationService.verifyEmail(token);

      res.set('Cache-Control', 'no-store');

      if (!verified) {
        return res.status(400).json({
          code: 'INVALID_OR_EXPIRED_VERIFICATION_TOKEN',
          message: 'The verification link is invalid or has expired',
        });
      }

      return res.status(200).json({
        message: 'Email verified successfully',
      });
    } catch (error) {
      this.logger.error('Email verification failed', {
        error,
      });

      return res.status(500).json({
        message: 'Unable to verify email',
      });
    }
  }

  async resendVerification(req: Request, res: Response) {
    const acceptedResponse = {
      message:
        'If the account exists and requires verification, a verification email will be sent.',
    };

    try {
      const { email } = req.body;
      const userModel = this.registry.get('user:model');

      const user = await userModel.findOne({
        email,
      });

      if (!user || user.isVerified) {
        return res.status(202).json(acceptedResponse);
      }

      try {
        await emailVerificationService.sendVerificationEmail({
          userId: user._id.toString(),
          email: user.email,
          enforceCooldown: true,
        });
      } catch (error) {
        if (!(error instanceof VerificationEmailCooldownError)) {
          this.logger.error('Unable to resend verification email', {
            userId: user._id.toString(),
            error,
          });
        }
      }

      return res.status(202).json(acceptedResponse);
    } catch (error) {
      this.logger.error('Verification email resend request failed', {
        error,
      });

      // Preserve the generic response so callers cannot use
      // this endpoint to discover registered email addresses.
      return res.status(202).json(acceptedResponse);
    }
  }
  // async refresh() {}
  // async logout() {}

  // async forgotPassword() {}
}

const authController = new AuthController();

export default authController;
