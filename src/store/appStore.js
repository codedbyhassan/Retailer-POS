import { useState, useEffect } from 'react';

const getInitialTheme = () => {
  const stored = localStorage.getItem('retailer_theme');
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getInitialSidebar = () => localStorage.getItem('retailer_sidebar_collapsed') === 'true';
const DEFAULT_PRESET = 'classic-blue';

function applyPreset(preset = DEFAULT_PRESET) {
  document.documentElement.dataset.preset = preset || DEFAULT_PRESET;
}

let state = {
  theme: getInitialTheme(),
  businessSettings: null,
  sidebarCollapsed: getInitialSidebar(),
  listeners: new Set(),
};

function notify() {
  state.listeners.forEach((fn) => fn(state));
}

export const appStore = {
  getState: () => state,

  subscribe: (fn) => {
    state.listeners.add(fn);
    return () => state.listeners.delete(fn);
  },

  setTheme: (theme) => {
    localStorage.setItem('retailer_theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    state = { ...state, theme };
    notify();
  },

  toggleTheme: () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    appStore.setTheme(next);
  },

  setBusinessSettings: (settings) => {
    applyPreset(settings?.preset);
    state = { ...state, businessSettings: settings };
    notify();
  },

  toggleSidebar: () => {
    const next = !state.sidebarCollapsed;
    localStorage.setItem('retailer_sidebar_collapsed', String(next));
    state = { ...state, sidebarCollapsed: next };
    notify();
  },

  setSidebarCollapsed: (collapsed) => {
    localStorage.setItem('retailer_sidebar_collapsed', String(collapsed));
    state = { ...state, sidebarCollapsed: collapsed };
    notify();
  },

  initTheme: () => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    applyPreset(state.businessSettings?.preset);
  },
};

export function useAppStore() {
  const [, forceUpdate] = useState(state);

  useEffect(() => appStore.subscribe(() => forceUpdate({ ...state })), []);

  return {
    theme: state.theme,
    businessSettings: state.businessSettings,
    sidebarCollapsed: state.sidebarCollapsed,
    setTheme: appStore.setTheme,
    toggleTheme: appStore.toggleTheme,
    setBusinessSettings: appStore.setBusinessSettings,
    toggleSidebar: appStore.toggleSidebar,
    setSidebarCollapsed: appStore.setSidebarCollapsed,
  };
}
