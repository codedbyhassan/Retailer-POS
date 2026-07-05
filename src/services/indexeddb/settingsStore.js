import { getDB } from './db';
import { generateId } from '../../utils/generateInvoiceNumber';

const DEFAULT_BUSINESS_SETTINGS = {
  business_name: 'My Retail Shop',
  currency: 'USD',
  tax_rate: 10,
  receipt_footer: 'Thank you for shopping with us!',
  low_stock_threshold: 10,
  preset: 'classic-blue',
};

export async function getBusinessSettings() {
  const db = await getDB();
  const record = await db.get('settings', 'business');
  return { ...DEFAULT_BUSINESS_SETTINGS, ...(record?.value ?? {}) };
}

export async function saveBusinessSettings(value) {
  const db = await getDB();
  await db.put('settings', { key: 'business', value });
  return value;
}

export async function getAllUsers() {
  const db = await getDB();
  return db.getAll('users');
}

export async function createUser(data) {
  const db = await getDB();
  const user = {
    id: generateId('user'),
    name: data.name,
    email: data.email.toLowerCase(),
    password: data.password,
    role: data.role || 'cashier',
    active: true,
    created_at: new Date().toISOString(),
  };
  await db.add('users', user);
  return user;
}

export async function updateUser(id, data) {
  const db = await getDB();
  const existing = await db.get('users', id);
  if (!existing) throw new Error('User not found');
  const updated = {
    ...existing,
    ...data,
    id,
    email: existing.email,
    password: data.password || existing.password,
  };
  await db.put('users', updated);
  return updated;
}

export async function deactivateUser(id) {
  return updateUser(id, { active: false });
}
