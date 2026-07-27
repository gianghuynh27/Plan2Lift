import { Request, Response } from 'express';

import BaseController from './base.controller';
import AuthToken from '../models/auth-token.model';

class AuthController extends BaseController {
  constructor() {
    super(AuthToken);
  }

  async register(req: Request, res: Response) {
    const { username, email, password } = req.body;
    const userModel = this.registry.get('user:model');
    const user = new userModel({ username, email, password });

    const savedUser = await user.save();

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
  }
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const userModel = this.registry.get('user:model');
    const user = await userModel.findOne({
      email: email,
      password: 'SA' + password + 'LT',
    });

    if (!user) {
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
