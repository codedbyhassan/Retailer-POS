import { useState, useEffect, useCallback } from 'react';
import { localDb } from '../services/indexeddb/db.js';
import { apiClient } from '../services/api.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    const hasToken = apiClient.isAuthenticated();
    if (!hasToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Try to fetch from server if online
      if (navigator.onLine) {
        const response = await apiClient.getCurrentUser();
        if (response.data) {
          setUser(response.data.user);
          await localDb.saveUser(response.data.user);
          setLoading(false);
          return;
        }
      }

      // Fall back to cached user
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const users = await localDb.getUsers();
        if (users.length > 0) {
          setUser(users[0]);
          setLoading(false);
          return;
        }
      }

      setUser(null);
    } catch (e) {
      console.error('[v0] Error verifying auth session:', e);
      const users = await localDb.getUsers();
      if (users.length > 0) {
        setUser(users[0]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      if (navigator.onLine) {
        const response = await apiClient.login(email, password);
        if (response.data) {
          setUser(response.data.user);
          await localDb.saveUser(response.data.user);
          setLoading(false);
          return { success: true };
        } else {
          setLoading(false);
          const errorMsg = response.error || 'Login failed';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }
      } else {
        // Offline login - check local cache
        const localUsers = await localDb.getUsers();
        const matchingUser = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (matchingUser) {
          setUser(matchingUser);
          apiClient.setAccessToken(`offline_${matchingUser.id}`);
          setLoading(false);
          return { success: true };
        }

        setLoading(false);
        const errorMsg = 'You are offline and this account is not cached';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (e) {
      setLoading(false);
      const errorMsg = e.message || 'An error occurred during login';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (e) {
      console.error('[v0] Logout error:', e);
    } finally {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
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
