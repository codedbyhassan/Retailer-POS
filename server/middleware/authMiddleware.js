import { extractTokenFromHeader, verifyToken } from '../utils/auth.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      logger.warn('Missing authentication token', { path: req.path });
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = verifyToken(token, 'access');
    const user = await db.select().from(users).where(eq(users.id, decoded.userId));

    if (!user || user.length === 0) {
      logger.warn(`User not found for token`, { userId: decoded.userId });
      return res.status(403).json({ error: 'User not found' });
    }

    if (!user[0].active) {
      logger.warn(`Inactive user attempted access`, { userId: decoded.userId });
      return res.status(403).json({ error: 'User account is deactivated' });
    }

    req.user = user[0];
    req.token = decoded;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};

/**
 * Middleware to check user role (RBAC)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt`, { 
        userId: req.user.id, 
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to handle async errors in routes
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
