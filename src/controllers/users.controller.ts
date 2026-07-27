import BaseController from './base.controller';

import User from '../models/user.model';

class UsersController extends BaseController {
  constructor() {
    super(User);
  }
}

const usersController = new UsersController();

export default usersController;
