import { Request, Response } from 'express';

import BaseController from './base.controller';
import AuthToken from '../models/auth-token.model';
import { hashPassword, verifyPassword } from '../utils/auth.util';

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

      const tokens = this.jwt.createTokens({
        userId: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      });

      const authToken = new this.model({
        userId: savedUser._id,
        refreshToken: tokens.refreshToken,
      });

      await authToken.save();

      res.status(201).json({
        message: 'User registered successfully',
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    } catch (error) {
      console.error('Registration failed:', error);

      return res.status(500).json({
        message: 'Unable to register user',
      });
    }
  }
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const userModel = this.registry.get('user:model');
    const user = await userModel
      .findOne({
        email: email.trim().toLowerCase(),
      })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password',
      });
    }

    const isMatch = await verifyPassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
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

    res.status(200).json({
      message: 'User logged in successfully',
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  }
  // async refresh() {}
  // async logout() {}
  // async verifyEmail() {}
  // async forgotPassword() {}
}

const authController = new AuthController();

export default authController;
