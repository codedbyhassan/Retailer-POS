import { useEffect } from 'react';
import Button from './Button';

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-[min(72rem,calc(100vw-2rem))]',
};

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[1.35rem] bg-white/95 shadow-ios-lg backdrop-blur-ios backdrop-saturate-150 animate-fade-up dark:bg-surface-dark/95 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl ${sizes[size] || sizes.md}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-black/[0.04] px-5 py-4 dark:border-white/[0.06] sm:px-6">
          <h3>{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.04] text-gray-500 transition-all duration-200 ease-ios hover:bg-black/[0.08] active:scale-90 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex shrink-0 justify-end gap-2 border-t border-black/[0.04] px-5 py-4 dark:border-white/[0.06] sm:px-6">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{message}</p>
    </Modal>
  );
}
