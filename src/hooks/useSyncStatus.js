import { useState, useEffect, useCallback } from 'react';
import { getSyncQueueCount } from '../services/sync/syncQueue';
import { getLastSyncTime } from '../services/sync/syncEngine';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(getLastSyncTime());

  const refresh = useCallback(async () => {
    const count = await getSyncQueueCount();
    setPendingCount(count);
    setLastSync(getLastSyncTime());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { pendingCount, lastSync, refresh };
}
