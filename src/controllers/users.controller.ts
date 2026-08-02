import { Request, Response } from 'express';

import BaseController from './base.controller';

import User from '../models/user.model';

class UsersController extends BaseController {
  constructor() {
    super(User);
  }
  async getMe(req: Request, res: Response) {
    if (!req.auth) {
      return res.status(401).json({
        message: 'Unauthorized',
      });
    }

    try {
      const user = await User.findOne({
        _id: req.auth.userId,
      });

      if (!user) {
        return res.status(401).json({
          message: 'User not found',
        });
      }
      return res.status(200).json({
        message: 'Current user retrieved sucessfully',
      });
    } catch {
      return res.status(500).json({
        message: 'Unable to retrieve user',
      });
    }
  }
}

const usersController = new UsersController();

export default usersController;
