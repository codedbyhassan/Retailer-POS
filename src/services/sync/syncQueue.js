import { getDB } from '../indexeddb/db';
import { generateId } from '../../utils/generateInvoiceNumber';

export async function addToSyncQueue(action, payload) {
  const db = await getDB();
  const entry = {
    id: generateId('queue'),
    action,
    payload,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  await db.add('sync_queue', entry);
  return entry;
}

export async function getPendingSyncItems() {
  const db = await getDB();
  const all = await db.getAllFromIndex('sync_queue', 'status', 'pending');
  return all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function getSyncQueueCount() {
  const pending = await getPendingSyncItems();
  return pending.length;
}

export async function markSyncItemComplete(id) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    await db.put('sync_queue', { ...item, status: 'completed' });
  }
}

export async function markSyncItemFailed(id, error) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (item) {
    await db.put('sync_queue', { ...item, status: 'failed', error, retryCount: (item.retryCount || 0) + 1 });
  }
}

export async function resetFailedItems() {
  const db = await getDB();
  const failed = await db.getAllFromIndex('sync_queue', 'status', 'failed');
  const tx = db.transaction('sync_queue', 'readwrite');
  for (const item of failed) {
    if ((item.retryCount || 0) < 5) {
      await tx.store.put({ ...item, status: 'pending' });
    }
  }
  await tx.done;
}
