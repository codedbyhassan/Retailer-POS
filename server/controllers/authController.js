import { serverDb } from '../config/db.js';

export const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = serverDb.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.active) {
    return res.status(403).json({ error: 'This account has been deactivated' });
  }

  res.json({
    token: `token_${user.id}`,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

export const getCurrentUser = (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// User Management (Admin Only)
export const getUsers = (req, res) => {
  const users = serverDb.getUsers().map(({ passwordHash, ...rest }) => rest);
  res.json(users);
};

export const createUser = (req, res) => {
  const { name, email, role, password, active } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required' });
  }

  const exists = serverDb.getUsers().some(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    role,
    passwordHash: password,
    active: active !== undefined ? active : true,
    createdAt: new Date().toISOString()
  };

  serverDb.addUser(newUser);
  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json(safeUser);
};

export const updateUser = (req, res) => {
  const targetUserId = req.params.id;
  const existing = serverDb.getUsers().find(u => u.id === targetUserId);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, email, role, password, active } = req.body;

  const updated = {
    ...existing,
    name: name || existing.name,
    email: email ? email.toLowerCase() : existing.email,
    role: role || existing.role,
    passwordHash: password || existing.passwordHash,
    active: active !== undefined ? active : existing.active
  };

  serverDb.updateUser(updated);
  const { passwordHash, ...safeUser } = updated;
  res.json(safeUser);
};
