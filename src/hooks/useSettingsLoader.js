import { useEffect, useState, useCallback } from 'react';
import { getBusinessSettings, saveBusinessSettings } from '../services/indexeddb/settingsStore';
import { appStore } from '../store/appStore';

export function useSettingsLoader() {
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const settings = await getBusinessSettings();
    appStore.setBusinessSettings(settings);
    setLoading(false);
    return settings;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, refresh };
}

export async function persistBusinessSettings(form) {
  const saved = await saveBusinessSettings(form);
  appStore.setBusinessSettings(saved);
  return saved;
}
