import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.BETTER_AUTH_SECRET;
const JWT_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

if (!JWT_SECRET) {
  throw new Error('BETTER_AUTH_SECRET is not set in environment variables');
}

/**
 * Hash a password with bcrypt
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token, type = 'access') => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== type) {
      throw new Error(`Invalid token type: expected ${type}, got ${decoded.type}`);
    }
    return decoded;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};
