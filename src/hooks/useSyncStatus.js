import { useState, useEffect, useCallback } from 'react';
import { localDb } from '../services/indexeddb/db.js';
import { syncEngine } from '../services/sync/syncEngine.js';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('retailer_last_sync_time') : null
  );

  const fetchQueueCount = useCallback(async () => {
    try {
      const queue = await localDb.getSyncQueue();
      setPendingCount(queue.length);
    } catch (e) {
      console.error('Error fetching queue count:', e);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchQueueCount();

    // Listen for custom SyncEngine events
    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncComplete = (e) => {
      setIsSyncing(false);
      setLastSyncTime(localStorage.getItem('retailer_last_sync_time'));
      fetchQueueCount();
    };

    const handleSyncError = () => {
      setIsSyncing(false);
      fetchQueueCount();
    };

    const handleDbUpdated = () => {
      fetchQueueCount();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('retailer:sync-start', handleSyncStart);
      window.addEventListener('retailer:sync-complete', handleSyncComplete);
      window.addEventListener('retailer:sync-error', handleSyncError);
      window.addEventListener('retailer:db-updated', handleDbUpdated);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('retailer:sync-start', handleSyncStart);
        window.removeEventListener('retailer:sync-complete', handleSyncComplete);
        window.removeEventListener('retailer:sync-error', handleSyncError);
        window.removeEventListener('retailer:db-updated', handleDbUpdated);
      }
    };
  }, [fetchQueueCount]);

  const syncNow = useCallback(async () => {
    return await syncEngine.sync();
  }, []);

  return {
    pendingCount,
    isSyncing,
    lastSyncTime,
    syncNow,
    refreshCount: fetchQueueCount
  };
}
