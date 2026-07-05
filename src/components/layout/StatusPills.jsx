import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useSyncStatus } from '../../hooks/useSyncStatus';

export default function StatusPills({ compact = false }) {
  const { isOnline } = useOfflineStatus();
  const { pendingCount, lastSync } = useSyncStatus();

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span
        className={`ios-pill flex items-center gap-1.5 ${
          isOnline
            ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'
          }`}
        />
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {pendingCount > 0 && (
        <span className="ios-pill bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
          {pendingCount} pending
        </span>
      )}

      {!compact && lastSync && (
        <span className="text-[0.6875rem] font-medium text-gray-400 dark:text-gray-500">
          Synced {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
