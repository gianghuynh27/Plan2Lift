import { Request, Response } from 'express';

import BaseController from './base.controller';

import User from '../models/user.model';

class UsersController extends BaseController {
  constructor() {
    super(User);
  }
  async getMe(req: Request, res: Response) {
    if (!req.auth) {
      this.logger.warn('Current-user request missing authentication context');
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    try {
      const user = await User.findOne({
        _id: req.auth.userId,
      });

      if (!user) {
        this.logger.warn('Authenticated user was not found', {
          userId: req.auth.userId,
        });
        return res.status(401).json({
          message: 'User not found',
        });
      }

      this.logger.debug('Current user retrieved', {
        userId: req.auth.userId,
      });
      return res.status(200).json({
        message: 'Current user retrieved successfully',
        data: user,
      });
    } catch {
      this.logger.error('Failed to retrieve user', {
        userId: req.auth.userId,
      });
      return res.status(500).json({
        message: 'Unable to retrieve user',
      });
    }
  }
}

const usersController = new UsersController();

export default usersController;
