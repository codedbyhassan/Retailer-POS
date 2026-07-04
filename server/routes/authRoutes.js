import express from 'express';
import {
  login,
  logout,
  getCurrentUser,
  getUsers,
  createUser,
  updateUser,
  refreshAccessToken,
} from '../controllers/authController.js';
import {
  authenticateToken,
  requireAdmin,
  asyncHandler,
} from '../middleware/authMiddleware.js';
import {
  validateLogin,
  validateUser,
} from '../validators/productValidator.js';

const router = express.Router();

// Public auth endpoints
router.post('/auth/login', validateLogin, asyncHandler(login));
router.post('/auth/refresh', asyncHandler(refreshAccessToken));

// Protected auth endpoints
router.post('/auth/logout', authenticateToken, logout);
router.get('/auth/me', authenticateToken, getCurrentUser);

// User management endpoints (admin only)
router.get('/users', authenticateToken, requireAdmin, asyncHandler(getUsers));
router.post('/users', authenticateToken, requireAdmin, validateUser, asyncHandler(createUser));
router.put('/users/:id', authenticateToken, requireAdmin, asyncHandler(updateUser));

export default router;
