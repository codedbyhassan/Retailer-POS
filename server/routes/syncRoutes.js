import { Router } from 'express';
import { handleSync } from '../controllers/syncController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/', authMiddleware, handleSync);
export default router;
