import express from 'express';
import { getReportSummary } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getReportSummary);

export default router;
