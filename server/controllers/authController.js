import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '../utils/auth.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Login user with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.validatedData;

    const user = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

    if (user.length === 0) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const foundUser = user[0];

    if (!foundUser.active) {
      logger.warn(`Login attempt from deactivated user: ${foundUser.id}`);
      return res.status(403).json({ error: 'This account has been deactivated' });
    }

    const passwordValid = await comparePassword(password, foundUser.password_hash);
    if (!passwordValid) {
      logger.warn(`Failed login attempt for user: ${foundUser.email}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(foundUser.id, foundUser.email, foundUser.role);
    const refreshToken = generateRefreshToken(foundUser.id);

    logger.info(`User logged in successfully: ${foundUser.email}`);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        email: foundUser.email,
        role: foundUser.role,
      },
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { verifyToken } = await import('../utils/auth.js');
    const decoded = verifyToken(refreshToken, 'refresh');

    const user = await db.select().from(users).where(eq(users.id, decoded.userId));

    if (user.length === 0 || !user[0].active) {
      return res.status(403).json({ error: 'User not found or deactivated' });
    }

    const foundUser = user[0];
    const newAccessToken = generateAccessToken(foundUser.id, foundUser.email, foundUser.role);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Logout user
 */
export const logout = (req, res) => {
  logger.info(`User logged out: ${req.user?.email}`);
  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * Get current authenticated user
 */
export const getCurrentUser = (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      active: req.user.active,
    },
  });
};

/**
 * Get all users (admin only)
 */
export const getUsers = async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    const safeUsers = allUsers.map(({ password_hash, ...rest }) => rest);
    res.json(safeUsers);
  } catch (error) {
    logger.error(`Error fetching users: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * Create new user (admin only)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.validatedData;

    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const userId = `usr_${crypto.randomBytes(12).toString('hex')}`;

    await db.insert(users).values({
      id: userId,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: role || 'cashier',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info(`New user created: ${email}`);

    const newUser = await db.select().from(users).where(eq(users.id, userId));

    if (newUser.length > 0) {
      const { password_hash, ...safeUser } = newUser[0];
      return res.status(201).json(safeUser);
    }
  } catch (error) {
    logger.error(`Error creating user: ${error.message}`);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update user (admin only)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, active } = req.body;

    const existing = await db.select().from(users).where(eq(users.id, id));

    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {
      name: name || existing[0].name,
      email: email ? email.toLowerCase() : existing[0].email,
      role: role || existing[0].role,
      active: active !== undefined ? active : existing[0].active,
      updated_at: new Date(),
    };

    if (password) {
      updates.password_hash = await hashPassword(password);
    }

    await db.update(users).set(updates).where(eq(users.id, id));

    logger.info(`User updated: ${id}`);

    const updated = await db.select().from(users).where(eq(users.id, id));

    if (updated.length > 0) {
      const { password_hash, ...safeUser } = updated[0];
      return res.json(safeUser);
    }
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(500).json({ error: 'Failed to update user' });
  }
};
