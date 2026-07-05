import {
  getPendingSyncItems,
  markSyncItemComplete,
  markSyncItemFailed,
} from './syncQueue';

const API_BASE = import.meta.env.VITE_API_URL || '';

let isSyncing = false;

export async function runSync() {
  if (!navigator.onLine || isSyncing) return { synced: 0, failed: 0 };

  isSyncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await getPendingSyncItems();

    for (const item of pending) {
      try {
        const res = await fetch(`${API_BASE}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });

        if (!res.ok) throw new Error(`Sync failed: ${res.status}`);

        await markSyncItemComplete(item.id);
        synced++;
      } catch (err) {
        await markSyncItemFailed(item.id, err.message);
        failed++;
      }
    }

    if (synced > 0) {
      localStorage.setItem('retailer_last_sync', new Date().toISOString());
    }
  } finally {
    isSyncing = false;
  }

  return { synced, failed };
}

export function startSyncEngine(onSyncComplete) {
  const trySync = async () => {
    if (navigator.onLine) {
      const result = await runSync();
      if (result.synced > 0 || result.failed > 0) {
        onSyncComplete?.(result);
      }
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
