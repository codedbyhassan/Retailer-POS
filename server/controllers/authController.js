import crypto from 'node:crypto';
import { createAuthToken, verifyAuthToken } from '../utils/authToken.js';
import { getUserByEmail } from '../services/userService.js';

const LEGACY_USERS = {
  'admin@retailer.com': { id: 'admin_1', name: 'Admin User', email: 'admin@retailer.com', role: 'admin' },
  'cashier@retailer.com': { id: 'cashier_1', name: 'Cashier User', email: 'cashier@retailer.com', role: 'cashier' },
};

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function verifyPbkdf2(password, storedHash, storedSalt) {
  if (!password || !storedHash || !storedSalt) return false;
  try {
    const expected = Buffer.from(storedHash, 'base64');
    const salt = Buffer.from(storedSalt, 'base64');
    const derived = crypto.pbkdf2Sync(password, salt, 120_000, 32, 'sha256');
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

function legacyPassword(email) {
  if (email === 'admin@retailer.com') return process.env.RETAILER_ADMIN_PASSWORD;
  if (email === 'cashier@retailer.com') return process.env.RETAILER_CASHIER_PASSWORD;
  return null;
}

export async function login(req, res) {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;
  if (!email || typeof password !== 'string') return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await getUserByEmail(email);
    if (!user || user.active === false) return res.status(401).json({ message: 'Invalid credentials' });

    let valid = verifyPbkdf2(password, user.password_hash, user.password_salt);
    if (!valid && !user.password_hash) valid = safeEqual(password, legacyPassword(email));
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = createAuthToken(sessionUser);
    return res.json({ user: sessionUser, token, expiresIn: 60 * 60 * 12 });
  } catch (error) {
    return res.status(503).json({ message: error.message || 'Authentication service unavailable' });
  }
}

export function logout(_req, res) {
  res.json({ message: 'Logged out' });
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const user = verifyAuthToken(auth.slice(7));
    if (!user) return res.status(401).json({ message: 'Invalid or expired token' });
    req.user = { id: user.sub, name: user.name, email: user.email, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
