import { getDB } from '../indexeddb/db';
import { generateId } from '../../utils/generateInvoiceNumber';

const MAX_RETRIES = 8;

export async function addToSyncQueue(action, payload) {
  const db = await getDB();
  const entry = {
    id: generateId('queue'),
    action,
    payload,
    idempotencyKey: payload?.idempotencyKey || (action === 'INVENTORY_ADJUST' ? payload?.id : null),
    status: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    nextRetryAt: new Date().toISOString(),
  };
  await db.add('sync_queue', entry);
  return entry;
}

export async function getPendingSyncItems() {
  const db = await getDB();
  const now = Date.now();
  const all = await db.getAll('sync_queue');

  return all
    .filter((item) => {
      if (item.status === 'pending') return true;
      if (item.status !== 'failed') return false;
      if ((item.retryCount || 0) >= MAX_RETRIES) return false;
      return !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function getSyncQueueCount() {
  const pending = await getPendingSyncItems();
  return pending.length;
}

export async function markSyncItemComplete(id) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    await db.put('sync_queue', {
      ...item,
      status: 'completed',
      completedAt: new Date().toISOString(),
      error: null,
    });
  }
}

export async function markSyncItemFailed(id, error) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (!item) return;

  const retryCount = (item.retryCount || 0) + 1;
  const delayMs = Math.min(60 * 60 * 1000, 5_000 * (2 ** Math.min(retryCount - 1, 8)));

  await db.put('sync_queue', {
    ...item,
    status: 'failed',
    error: error instanceof Error ? error.message : String(error),
    retryCount,
    nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
  });
}

export async function resetFailedItems() {
  const db = await getDB();
  const failed = await db.getAllFromIndex('sync_queue', 'status', 'failed');
  const tx = db.transaction('sync_queue', 'readwrite');
  for (const item of failed) {
    if ((item.retryCount || 0) < MAX_RETRIES) {
      await tx.store.put({
        ...item,
        status: 'pending',
        nextRetryAt: new Date().toISOString(),
      });
    }
  }
  await tx.done;
}
