import { useState, useEffect, useCallback } from 'react';
import { User } from '../types.js';
import { localDb } from '../services/indexeddb/db.js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('retailer_auth_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Check online status
      if (navigator.onLine) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          // Update local DB cache for offline access
          await localDb.saveUser(data.user);
          setLoading(false);
          return;
        }
      }

      // If offline or server is unreachable, try to retrieve from IndexedDB cache
      const userId = token.replace('token_', '');
      const users = await localDb.getUsers();
      const cachedUser = users.find(u => u.id === userId);
      
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        // Clear stale token
        localStorage.removeItem('retailer_auth_token');
        setUser(null);
      }
    } catch (e) {
      console.error('Error verifying auth session:', e);
      // Fallback to cache
      const userId = token.replace('token_', '');
      const users = await localDb.getUsers();
      const cachedUser = users.find(u => u.id === userId);
      if (cachedUser) {
        setUser(cachedUser);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      // 1. Try online login if connected
      if (navigator.onLine) {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (response.ok) {
            localStorage.setItem('retailer_auth_token', data.token);
            setUser(data.user);
            await localDb.saveUser(data.user); // Cache on success
            setLoading(false);
            return { success: true };
          } else {
            // Server rejected credentials
            setLoading(false);
            setError(data.error || 'Invalid credentials');
            return { success: false, error: data.error || 'Invalid credentials' };
          }
        } catch (serverErr) {
          console.warn('[Auth] Server login failed, falling back to offline check:', serverErr);
        }
      }

      // 2. Offline login fallback
      const localUsers = await localDb.getUsers();
      // Wait, in localDb we store Users but wait, the password is not stored in localDb users for security reasons (they sync from server).
      // However, to allow offline-first login in the demo, we can check if they matches our pre-seeded users.
      // Let's check: admin@retailer.com with admin123, or cashier@retailer.com with cashier123
      const isDemoAdmin = email.toLowerCase() === 'admin@retailer.com' && password === 'admin123';
      const isDemoCashier = email.toLowerCase() === 'cashier@retailer.com' && password === 'cashier123';

      if (isDemoAdmin || isDemoCashier) {
        const matchingCachedUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        const mockUser: User = matchingCachedUser || {
          id: isDemoAdmin ? 'usr_admin' : 'usr_cashier',
          name: isDemoAdmin ? 'Amina Diallo' : 'Kofi Mensah',
          email: email.toLowerCase(),
          role: isDemoAdmin ? 'admin' : 'cashier',
          active: true,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('retailer_auth_token', `token_${mockUser.id}`);
        setUser(mockUser);
        await localDb.saveUser(mockUser);
        setLoading(false);
        return { success: true };
      }

      // If we are fully offline and credentials do not match default ones
      const matchingCachedUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchingCachedUser && password === 'cashier123') { // standard default offline password for newly created cashiers
        localStorage.setItem('retailer_auth_token', `token_${matchingCachedUser.id}`);
        setUser(matchingCachedUser);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      setError('You are offline, and these credentials do not match cached accounts. Try admin@retailer.com/admin123 or cashier@retailer.com/cashier123.');
      return { success: false, error: 'User check failed' };
    } catch (e: any) {
      setLoading(false);
      setError(e.message || 'An error occurred during login');
      return { success: false, error: e.message };
    }
  };

  const logout = useCallback(async () => {
    localStorage.removeItem('retailer_auth_token');
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    loading,
    error,
    login,
    logout,
    refreshUser: fetchCurrentUser
  };
}
