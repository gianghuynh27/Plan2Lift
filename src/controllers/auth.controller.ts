import { Request, Response } from 'express';
import type { JwtPayload } from 'jsonwebtoken';

import BaseController from './base.controller';
import AuthToken from '../models/auth-token.model';
import { hashPassword, verifyPassword } from '../utils/auth.util';
import emailVerificationService, {
  VerificationEmailCooldownError,
} from '../services/email-verification.service';

import {
  REFRESH_TOKEN_COOKIE,
  createRefreshCookieOptions,
  hashRefreshToken,
  refreshTokenCookieOptions,
} from '../utils/refresh-token.util';

type DuplicateKeyError = {
  code: 11000;
  keyPattern?: Record<string, number>;
};

function getTokenExpiration(decoded: string | JwtPayload): Date {
  if (typeof decoded === 'string' || typeof decoded.exp !== 'number') {
    throw new Error('Refresh token has no expiration');
  }
  return new Date(decoded.exp * 1000);
}
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

      const decodedRefreshToken = this.jwt.verifyRefreshToken(
        tokens.refreshToken,
      );

      const expiresAt = getTokenExpiration(decodedRefreshToken);

      const refreshTokenHash = hashRefreshToken(tokens.refreshToken);

      await this.model.findOneAndUpdate(
        { userId: user._id },
        {
          $set: {
            refreshToken: refreshTokenHash,
            expiresAt,
            revokedAt: null,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        },
      );

      res.cookie(
        REFRESH_TOKEN_COOKIE,
        tokens.refreshToken,
        createRefreshCookieOptions(expiresAt),
      );

      this.logger.info('User logged in successfully', {
        userId: user._id.toString(),
      });

      res.status(200).json({
        message: 'User logged in successfully',
        tokens: {
          accessToken: tokens.accessToken,
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
      const { token } = req.body;

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
  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (typeof refreshToken !== 'string') {
      return res.status(401).json({
        message: 'No refresh token provided',
      });
    }

    let decodedRefreshToken;

    try {
      decodedRefreshToken = this.jwt.verifyRefreshToken(refreshToken);
    } catch {
      res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);

      this.logger.warn('Refresh rejected: invalid token');

      return res.status(401).json({
        message: 'Invalid or expired refresh token',
      });
    }

    if (
      typeof decodedRefreshToken === 'string' ||
      typeof decodedRefreshToken.userId !== 'string'
    ) {
      res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);

      return res.status(401).json({
        message: 'Invalid refresh token',
      });
    }

    try {
      const userModel = this.registry.get('user:model');

      const user = await userModel.findOne({
        _id: decodedRefreshToken.userId,
        deletedAt: null,
        isVerified: true,
      });

      if (!user) {
        res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);

        return res.status(401).json({
          message: 'Refresh session is no longer valid',
        });
      }

      const currentTokenHash = hashRefreshToken(refreshToken);

      const newTokens = this.jwt.createTokens({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
      });

      const decodedNewRefreshToken = this.jwt.verifyRefreshToken(
        newTokens.refreshToken,
      );

      const newExpiresAt = getTokenExpiration(decodedNewRefreshToken);

      const newRefreshTokenHash = hashRefreshToken(newTokens.refreshToken);

      /*
       * This update succeeds only if the
       * submitted refresh token is still
       * the active token in MongoDB.
       */
      const rotatedToken = await this.model.findOneAndUpdate(
        {
          userId: user._id,
          refreshToken: currentTokenHash,
          revokedAt: null,
          expiresAt: {
            $gt: new Date(),
          },
        },
        {
          $set: {
            refreshToken: newRefreshTokenHash,
            expiresAt: newExpiresAt,
          },
        },
        {
          new: true,
        },
      );

      if (!rotatedToken) {
        res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);

        this.logger.warn('Refresh rejected: token is no longer active', {
          userId: user._id.toString(),
        });

        return res.status(401).json({
          message: 'Refresh session is no longer valid',
        });
      }

      res.cookie(
        REFRESH_TOKEN_COOKIE,
        newTokens.refreshToken,
        createRefreshCookieOptions(newExpiresAt),
      );

      this.logger.info('Refresh token rotated', {
        userId: user._id.toString(),
      });

      return res.status(200).json({
        message: 'Session refreshed successfully',
        tokens: {
          accessToken: newTokens.accessToken,
        },
      });
    } catch (error) {
      this.logger.error('Unable to refresh session', {
        error,
      });

      return res.status(500).json({
        message: 'Unable to refresh session',
      });
    }
  }
  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

    try {
      if (typeof refreshToken === 'string') {
        const refreshTokenHash = hashRefreshToken(refreshToken);

        await this.model.deleteOne({
          refreshToken: refreshTokenHash,
        });
      }

      this.logger.info('User logged out');
    } catch (error) {
      this.logger.error('Unable to remove refresh session', {
        error,
      });
    } finally {
      /*
       * Clear the browser cookie even if
       * the database record was already
       * missing.
       */
      res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions);
    }

    return res.status(204).send();
  }

  // async forgotPassword() {}

  async checkDuplicate(req: Request, res: Response) {
    try {
      const duplicateType = req.params.type as 'username' | 'email';
      const duplicateValue = req.query.value as string;

      const userModel = this.registry.get('user:model');

      const isDuplicate = await userModel.exists({
        [duplicateType]: duplicateValue,
      });

      if (isDuplicate) throw new Error('Duplicate found');

      res.status(200).json({
        message: `${req.params.type} is available`,
        duplicate: false,
      });
    } catch (error) {
      this.logger.error('Duplicate check failed', {
        error,
      });

      if (error instanceof Error && error.message === 'Duplicate found') {
        return res.status(409).json({
          message: `${req.params.type} is already in use`,
        });
      }

      res.status(500).json({
        message: 'Unable to check for duplicates',
      });
    }
  }
}

const authController = new AuthController();

export default authController;
