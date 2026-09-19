import express from 'express';
import { getAdminOverview, getAdminUsers } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Protect all admin routes with JWT and 'admin' role check
router.use(protect);
router.use(authorize('admin'));

router.get('/overview', getAdminOverview);
router.get('/users', getAdminUsers);

export default router;
