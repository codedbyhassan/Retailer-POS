import {
  getPendingSyncItems,
  markSyncItemComplete,
  markSyncItemFailed,
  markSyncItemConflict,
} from './syncQueue';
import { pullCloudChanges } from './syncPull';

const API_BASE = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'retailer_token';

let isSyncing = false;

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export async function runSync() {
  if (!navigator.onLine || isSyncing) return { synced: 0, failed: 0 };

  const token = getAuthToken();
  if (!token || token.startsWith('local_')) {
    // An offline-only session must not be trusted by the server. The user will
    // get a server token the next time they authenticate while online.
    return { synced: 0, failed: 0 };
  }

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingSyncItems();

    // Process strictly oldest-first. If an action fails, stop here so later
    // mutations cannot overtake it and create inconsistent state.
    for (const item of pending) {
      try {
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        };
        if (item.idempotencyKey) headers['X-Idempotency-Key'] = item.idempotencyKey;

        const res = await fetch(`${API_BASE}/api/sync`, {
          method: 'POST',
          headers,
          body: JSON.stringify(item),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          const message = body?.message || `Sync failed: ${res.status}`;
          if (res.status === 409) {
            await markSyncItemConflict(item.id, message, { status: res.status, serverMessage: message });
            failed++;
            break;
          }
          throw new Error(message);
        }

        await markSyncItemComplete(item.id);
        synced++;
      } catch (err) {
        await markSyncItemFailed(item.id, err);
        failed++;
        break;
      }
    }

    const remaining = await getPendingSyncItems();
    let pulled = 0;
    let blocked = false;
    if (remaining.length === 0 && failed === 0) {
      const pullResult = await pullCloudChanges();
      pulled = pullResult.pulled;
      blocked = pullResult.blocked;
    }

    if (synced > 0 || pulled > 0) {
      localStorage.setItem('retailer_last_sync', new Date().toISOString());
    }

    return { synced, failed, pulled, blocked };
  } finally {
    isSyncing = false;
  }

}

export function startSyncEngine(onSyncComplete) {
  const trySync = async () => {
    if (navigator.onLine) {
      const result = await runSync();
      if (result.synced > 0 || result.failed > 0 || result.pulled > 0 || result.blocked) onSyncComplete?.(result);
    }
  };

  window.addEventListener('online', trySync);
  const interval = setInterval(trySync, 30_000);
  trySync();

  return () => {
    window.removeEventListener('online', trySync);
    clearInterval(interval);
  };
}

export function getLastSyncTime() {
  return localStorage.getItem('retailer_last_sync');
}
