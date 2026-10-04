import { useEffect, useState } from 'react';

export function useSyncStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return { pendingCount: 0, conflictCount: 0, lastSync: online ? new Date().toISOString() : null, online, refresh: async () => {} };
}
