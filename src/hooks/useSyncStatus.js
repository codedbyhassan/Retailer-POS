import { useState, useEffect, useCallback } from 'react';
import { getSyncQueueCount, getSyncConflicts } from '../services/sync/syncQueue';
import { getLastSyncTime } from '../services/sync/syncEngine';

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSync, setLastSync] = useState(getLastSyncTime());
  const [conflictCount, setConflictCount] = useState(0);

  const refresh = useCallback(async () => {
    const [count, conflicts] = await Promise.all([getSyncQueueCount(), getSyncConflicts()]);
    setPendingCount(count);
    setConflictCount(conflicts.length);
    setLastSync(getLastSyncTime());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { pendingCount, conflictCount, lastSync, refresh };
}
