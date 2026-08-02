import { Router } from 'express';

import { usersController } from '../../../controllers';
import { requireAuth } from '../../../middleware/auth.middleware';

const router = Router();

//router.route('/').get(usersController.list.bind(usersController));

// add custom routes here
router.get('/me', requireAuth, usersController.getMe.bind(usersController));
// router
//   .route('/:_id')
//   .get(usersController.getById.bind(usersController))
//   .put(usersController.update.bind(usersController))
//   .delete(usersController.delete.bind(usersController));

export default router;
