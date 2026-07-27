import { Router } from 'express';

import apiRoutes from './api';

const router = Router();

router.use('/api', apiRoutes);
// router.use("/uploads")
// router.use('/static)
// router.use("/redirects")

export default router;
