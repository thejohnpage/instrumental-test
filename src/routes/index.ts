import { Router } from 'express';
import UserRouter from './Users';
import AuthRouter from './Auth';
import MonitorRouter from './Monitor';

// Init router and path
const router = Router();

// Add sub-routes
router.use('/users', UserRouter);
router.use('/auth', AuthRouter);
router.use('/monitor', MonitorRouter);

// Export the base-router
export default router;
