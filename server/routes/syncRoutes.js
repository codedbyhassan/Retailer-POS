import { Router } from 'express';
import { handleSync, handleSyncPull } from '../controllers/syncController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/pull', authMiddleware, handleSyncPull);
router.post('/', authMiddleware, handleSync);
export default router;
