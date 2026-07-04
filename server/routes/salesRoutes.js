import express from 'express';
import { getSales, createSale } from '../controllers/salesController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateSale } from '../validators/saleValidator.js';

const router = express.Router();

router.get('/', authenticateToken, getSales);
router.post('/', authenticateToken, validateSale, createSale);

export default router;
