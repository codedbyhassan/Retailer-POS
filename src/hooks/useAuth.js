import { useState, useEffect, useCallback } from 'react';
import { getDB, seedDatabase } from '../services/indexeddb/db';
import { ROLES } from '../constants/roles';

const SESSION_KEY = 'retailer_session';

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState(getStoredSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDatabase().finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const db = await getDB();
    const users = await db.getAllFromIndex('users', 'email', email.toLowerCase());
    const found = users.find((u) => u.email === email.toLowerCase() && u.active);

    if (!found || found.password !== password) {
      throw new Error('Invalid email or password');
    }

    const session = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem('retailer_token', `local_${found.id}`);
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('retailer_token');
    setUser(null);
  }, []);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCashier = user?.role === ROLES.CASHIER;

  return { user, loading, login, logout, isAdmin, isCashier, isAuthenticated: !!user };
}
