import { supabase } from '../../lib/supabase';

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, active')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}
