import { useEffect } from 'react';
import { ToastProvider } from '../components/ui/Toast';
import { appStore } from '../store/appStore';
import { useSettingsLoader } from '../hooks/useSettingsLoader';
import AppRoutes from './AppRoutes';

function AppInitializer() {
  const { loading } = useSettingsLoader();

  useEffect(() => {
    appStore.initTheme();
    return undefined;
  }, []);

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
