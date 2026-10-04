import { getDB } from '../indexeddb/db';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'retailer_token';
const CURSOR_KEY = 'retailer_sync_cursor';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function isProtectedByPendingChange(change, pending) {
  const id = change.entity_id;
  return pending.some((item) => {
    const p = item.payload || {};
    if (change.entity_type === 'products') {
      return (item.action === 'CREATE_PRODUCT' || item.action === 'UPDATE_PRODUCT' || item.action === 'ARCHIVE_PRODUCT') && p.id === id
        || item.action === 'CREATE_SALE' && (p.items || []).some((i) => i.product_id === id)
        || item.action === 'INVENTORY_ADJUST' && p.product_id === id;
    }
    if (change.entity_type === 'users') {
      return ['CREATE_USER', 'UPDATE_USER', 'DEACTIVATE_USER'].includes(item.action) && p.id === id;
    }
    if (change.entity_type === 'sales') return item.action === 'CREATE_SALE' && p.sale?.id === id;
    if (change.entity_type === 'sale_items') return item.action === 'CREATE_SALE' && (p.items || []).some((i) => i.id === id);
    if (change.entity_type === 'inventory_logs') return item.action === 'INVENTORY_ADJUST' && p.id === id;
    return false;
  });
}

async function applyChange(db, change) {
  const storeMap = {
    products: 'products',
    sales: 'sales',
    sale_items: 'sale_items',
    inventory_logs: 'inventory_logs',
    users: 'users',
    customers: 'customers',
    product_images: 'product_images',
  };

  if (change.entity_type === 'settings') {
    if (change.operation === 'delete') {
      await db.delete('settings', change.entity_id);
    } else {
      const data = change.data || {};
      await db.put('settings', { key: data.key || change.entity_id, value: data.value || {} });
    }
    return;
  }

  const store = storeMap[change.entity_type];
  if (!store) return;

  if (change.operation === 'delete') {
    await db.delete(store, change.entity_id);
    return;
  }

  const data = change.data;
  if (!data) return;
  if (change.entity_type === 'customers' || change.entity_type === 'product_images') {
    await db.put(store, { ...data, id: change.entity_id });
  } else {
    await db.put(store, data);
  }
}

export async function pullCloudChanges() {
  if (!navigator.onLine) return { pulled: 0, blocked: false, cursor: getCursor() };

  const token = getToken();
  if (!token || token.startsWith('local_')) return { pulled: 0, blocked: false, cursor: getCursor() };

  const db = await getDB();
  const pending = (await db.getAll('sync_queue')).filter((item) => item.status !== 'completed');
  let cursor = getCursor();
  let pulled = 0;

  while (true) {
    const res = await fetch(`${API_BASE}/api/sync/pull?cursor=${encodeURIComponent(cursor)}&limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `Sync pull failed: ${res.status}`);
    const body = await res.json();
    const changes = body.changes || [];
    if (!changes.length) {
      localStorage.setItem(CURSOR_KEY, String(body.nextCursor ?? cursor));
      break;
    }

    let appliedThrough = cursor;
    let blocked = false;

    for (const change of changes) {
      if (isProtectedByPendingChange(change, pending)) {
        blocked = true;
        break;
      }
      await applyChange(db, change);
      appliedThrough = Number(change.sequence);
      pulled++;
    }

    if (appliedThrough !== cursor) {
      cursor = appliedThrough;
      localStorage.setItem(CURSOR_KEY, String(cursor));
    }

    if (blocked || !body.hasMore) return { pulled, blocked, cursor };
  }

  return { pulled, blocked: false, cursor };
}

export function getCursor() {
  return Number(localStorage.getItem(CURSOR_KEY) || 0);
}

export function resetSyncCursor() {
  localStorage.removeItem(CURSOR_KEY);
}
