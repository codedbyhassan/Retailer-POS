const users = [
  { id: 'admin_1', name: 'Admin User', email: 'admin@retailer.com', role: 'admin' },
  { id: 'cashier_1', name: 'Cashier User', email: 'cashier@retailer.com', role: 'cashier' },
];

export function login(req, res) {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email?.toLowerCase());
  const validPassword =
    (email === 'admin@retailer.com' && password === 'admin123') ||
    (email === 'cashier@retailer.com' && password === 'cashier123');

  if (!user || !validPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.json({ user, token: `token_${user.id}` });
}

export function logout(_req, res) {
  res.json({ message: 'Logged out' });
}

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = auth.slice(7);
  const userId = token.replace('local_', '').replace('token_', '');
  const user = users.find((u) => u.id.includes(userId) || token.includes(u.id));
  if (!user && !token.startsWith('local_') && !token.startsWith('token_')) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  req.user = user || { id: userId, role: 'admin' };
  next();
}
