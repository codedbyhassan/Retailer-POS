import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();
router.use(authMiddleware);
router.get('/', (_req, res) => res.json([]));
export default router;
