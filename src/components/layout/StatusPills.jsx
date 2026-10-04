import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export default function StatusPills() {
  const { isOnline } = useOfflineStatus();

  return (
    <div className="hidden items-center sm:flex">
      <span className={`ios-pill flex items-center gap-1.5 ${isOnline ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-orange-500/10 text-orange-700 dark:text-orange-400'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-orange-500'}`} />
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
