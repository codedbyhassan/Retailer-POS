import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/online/authService';
import { ROLES } from '../constants/roles';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfile(data.session.user.id);
        setUser({ ...profile, auth_user_id: data.session.user.id });
      } catch {
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const profile = await getProfile(session.user.id);
        setUser({ ...profile, auth_user_id: session.user.id });
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    const profile = await getProfile(data.user.id);
    const sessionUser = { ...profile, auth_user_id: data.user.id };
    setUser(sessionUser);
    return sessionUser;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    isAdmin: ['owner', 'admin', 'manager'].includes(user?.role),
    isCashier: user?.role === ROLES.CASHIER,
    isAuthenticated: !!user,
  };
}
