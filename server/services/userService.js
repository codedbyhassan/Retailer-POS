import { supabase, isSupabaseConfigured } from '../config/db.js';

const memoryUsers = new Map([
  ['admin@retailer.com', { id: 'admin_1', name: 'Admin User', email: 'admin@retailer.com', role: 'admin', active: true }],
  ['cashier@retailer.com', { id: 'cashier_1', name: 'Cashier User', email: 'cashier@retailer.com', role: 'cashier', active: true }],
]);

export async function getUserByEmail(email) {
  const normalized = email?.trim().toLowerCase();
  if (!normalized) return null;
  if (!isSupabaseConfigured()) return memoryUsers.get(normalized) || null;
  const { data, error } = await supabase.from('users').select('id,name,email,role,active,password_hash,password_salt,password_algorithm').eq('email', normalized).maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function upsertUser(user) {
  const record = {
    id: user.id,
    name: user.name,
    email: user.email.trim().toLowerCase(),
    role: user.role || 'cashier',
    active: user.active !== false,
    password_hash: user.passwordHash ?? user.password_hash ?? null,
    password_salt: user.passwordSalt ?? user.password_salt ?? null,
    password_algorithm: user.passwordAlgorithm ?? user.password_algorithm ?? null,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) {
    memoryUsers.set(record.email, { ...memoryUsers.get(record.email), ...record });
    return { ok: true };
  }
  const { error } = await supabase.from('users').upsert(record);
  if (error) throw error;
  return { ok: true };
}
