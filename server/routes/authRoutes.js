import express from 'express';
import { login, logout, getCurrentUser, getUsers, createUser, updateUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Auth paths
router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', authenticateToken, getCurrentUser);

// User paths
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.post('/users', authenticateToken, requireAdmin, createUser);
router.put('/users/:id', authenticateToken, requireAdmin, updateUser);

export default router;
