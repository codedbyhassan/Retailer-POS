import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  const styles = {
    success: 'bg-emerald-600/95 text-white dark:bg-emerald-600',
    error: 'bg-red-500/95 text-white dark:bg-red-500',
    info: 'bg-gray-900/95 text-white dark:bg-surface-dark/95 dark:border dark:border-white/[0.08]',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-4 z-[100] flex flex-col gap-2 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-fade-up rounded-2xl px-4 py-3 text-sm font-semibold shadow-ios-lg backdrop-blur-ios ${styles[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
