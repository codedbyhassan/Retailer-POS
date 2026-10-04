import { useState, useEffect, useCallback } from 'react';
import { getDB, seedDatabase } from '../services/indexeddb/db';
import { verifyPassword } from '../utils/password';
import { ROLES } from '../constants/roles';

const SESSION_KEY = 'retailer_session';
const TOKEN_KEY = 'retailer_token';
const API_BASE = import.meta.env.VITE_API_URL || '';

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function tryServerLogin(email, password) {
  if (!navigator.onLine) return null;

  let response;
  try {
    response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    error.code = 'NETWORK_ERROR';
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      response.status === 401 || response.status === 403 ? 'Invalid email or password' : 'Unable to sign in'
    );
    error.code = response.status === 401 || response.status === 403 ? 'AUTH_REJECTED' : 'SERVER_ERROR';
    throw error;
  }

  return response.json();
}

export function useAuth() {
  const [user, setUser] = useState(getStoredSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedDatabase().finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const serverSession = await tryServerLogin(normalizedEmail, password);
      if (serverSession?.user && serverSession?.token) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(serverSession.user));
        localStorage.setItem(TOKEN_KEY, serverSession.token);
        setUser(serverSession.user);
        return serverSession.user;
      }
      if (navigator.onLine) throw new Error('Unable to sign in');
    } catch (error) {
      if (error.code !== 'NETWORK_ERROR') throw error;
      // Only network failures may fall back to the local credential store.
    }

    const db = await getDB();
    const users = await db.getAllFromIndex('users', 'email', normalizedEmail);
    const found = users.find((u) => u.email === normalizedEmail && u.active);

    const valid = found && await verifyPassword(password, found.passwordHash, found.passwordSalt);
    if (!valid) {
      throw new Error('Invalid email or password');
    }

    const session = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      offline: true,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(TOKEN_KEY, `local_${found.id}`);
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('retailer_last_sync');
    setUser(null);
  }, []);

  const isAdmin = user?.role === ROLES.ADMIN;
  const isCashier = user?.role === ROLES.CASHIER;

  return { user, loading, login, logout, isAdmin, isCashier, isAuthenticated: !!user };
}
