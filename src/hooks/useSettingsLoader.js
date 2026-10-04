import { useEffect, useState } from 'react';
import { getBusinessSettings } from '../services/online/settingsService';
import { appStore } from '../store/appStore';

export function useSettingsLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getBusinessSettings()
      .then((settings) => {
        if (!mounted) return;
        appStore.setBusinessSettings(settings);
      })
      .catch((error) => console.error('Unable to load business settings:', error))
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, []);

  return { loading };
}
