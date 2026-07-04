import express from 'express';
import { syncQueue } from '../controllers/syncController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateToken, syncQueue);

export default router;
