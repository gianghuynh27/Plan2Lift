import { Router } from 'express';

import { usersController } from '../../../controllers';

const router = Router();

router
  .route('/')
  .get(usersController.list.bind(usersController))
  .post(usersController.create.bind(usersController));

// add custom routes here

router
  .route('/:_id')
  .get(usersController.getById.bind(usersController))
  .put(usersController.update.bind(usersController))
  .delete(usersController.delete.bind(usersController));

export default router;
