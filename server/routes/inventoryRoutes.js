import express from 'express';
import { getInventory, adjustStock } from '../controllers/inventoryController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', authenticateToken, getInventory);
router.post('/', authenticateToken, adjustStock);

export default router;
