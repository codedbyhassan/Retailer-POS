import express from 'express';
import { getProducts } from '../controllers/productController.js';
import { authenticateToken, asyncHandler } from '../middleware/authMiddleware.js';
import { validateProduct } from '../validators/productValidator.js';

const router = express.Router();

// All product routes require authentication
router.get('/', authenticateToken, asyncHandler(getProducts));
router.post('/', authenticateToken, validateProduct, asyncHandler(getProducts)); // Placeholder for creating products

export default router;
