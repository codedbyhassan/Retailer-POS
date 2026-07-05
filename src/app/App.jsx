import { useEffect } from 'react';
import { ToastProvider, useToast } from '../components/ui/Toast';
import { appStore } from '../store/appStore';
import { startSyncEngine } from '../services/sync/syncEngine';
import { useSettingsLoader } from '../hooks/useSettingsLoader';
import AppRoutes from './AppRoutes';

function AppInitializer() {
  const toast = useToast();
  const { loading } = useSettingsLoader();

  useEffect(() => {
    appStore.initTheme();
    return startSyncEngine(({ synced, failed }) => {
      if (synced > 0) toast.success(`Synced ${synced} item(s)`);
      if (failed > 0) toast.error(`${failed} sync item(s) failed`);
    });
  }, [toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary dark:bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-sm font-medium text-gray-500">Loading Retailer...</p>
        </div>
      </div>
    );
  }

  return <AppRoutes />;
}

export default function App() {
  return (
    <ToastProvider>
      <AppInitializer />
    </ToastProvider>
  );
}
