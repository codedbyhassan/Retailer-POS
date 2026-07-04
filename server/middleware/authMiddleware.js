import { serverDb } from '../config/db.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = serverDb.getUsers().find(u => u.id === token || `token_${u.id}` === token);
  if (!user || !user.active) {
    return res.status(403).json({ error: 'Invalid or deactivated user token' });
  }

  req.user = user;
  next();
};
