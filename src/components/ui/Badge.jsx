const styles = {
  'in-stock': 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'low-stock': 'bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'out-of-stock': 'bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  default: 'bg-black/[0.04] text-gray-700 dark:bg-white/[0.08] dark:text-gray-300',
};

export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold tracking-wide ${styles[variant] || styles.default} ${className}`}
    >
      {children}
    </span>
  );
}

export function stockBadge(quantity, reorderLevel = 10) {
  if (quantity <= 0) return 'out-of-stock';
  if (quantity <= reorderLevel) return 'low-stock';
  return 'in-stock';
}

export function stockLabel(quantity, reorderLevel = 10) {
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= reorderLevel) return 'Low stock';
  return 'In stock';
}
