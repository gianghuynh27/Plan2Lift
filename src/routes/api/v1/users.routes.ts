import { Router } from 'express';

import { usersController } from '../../../controllers';

const router = Router();

router.use((req, res, next) => {
  // Add any middleware logic here if needed
  // add express defigintion in express.d.ts to avoid typescript error
  // req.meta.user = {
  //   "testing": "test"
  // }
  next();
});

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
