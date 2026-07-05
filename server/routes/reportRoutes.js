import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);
router.get('/daily', (_req, res) => res.json({ revenue: 0, profit: 0, count: 0 }));
export default router;
