import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { getProductImageSrc } from '../../utils/imageUtils';

function PlaceholderIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

export default function ProductCard({
  product,
  price,
  onClick,
  variant = 'pos',
  showStock = true,
  disabled = false,
  className = '',
}) {
  const imageSrc = getProductImageSrc(product);
  const outOfStock = product.quantity <= 0;
  const lowStock = product.quantity > 0 && product.quantity <= (product.reorder_level ?? 10);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || outOfStock}
      className={`group relative flex min-h-[15rem] flex-col overflow-hidden rounded-[1.15rem] border border-black/[0.06] bg-white text-left shadow-[0_10px_28px_rgba(15,23,42,0.07)] transition-all duration-300 ease-ios hover:-translate-y-0.5 hover:border-brand-400/35 hover:shadow-[0_18px_42px_rgba(15,23,42,0.13)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 dark:border-white/[0.08] dark:bg-surface-dark dark:shadow-none dark:hover:border-brand-300/30 dark:hover:shadow-ios ${className}`}
    >
      <div className="relative aspect-[1.18] w-full overflow-hidden bg-[linear-gradient(135deg,#f8fafc,#eef2f7)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-ios group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.13),transparent_42%)]">
            <PlaceholderIcon className="h-11 w-11 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        {showStock && (
          <div className="absolute left-3 top-3">
            <Badge variant={stockBadge(product.quantity, product.reorder_level)}>
              {stockLabel(product.quantity, product.reorder_level)}
            </Badge>
          </div>
        )}
        {lowStock && showStock && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[0.625rem] font-bold uppercase text-white shadow-ios">
            Low
          </span>
        )}
        {product.category && variant === 'pos' && (
          <span className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/45 px-2.5 py-1 text-[0.625rem] font-semibold uppercase text-white backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${variant === 'compact' ? 'p-3' : 'p-4'}`}>
        <h3 className="line-clamp-2 !text-[0.95rem] !font-semibold leading-snug text-gray-950 dark:text-white">
          {product.name}
        </h3>
        {product.sku && variant !== 'pos' && (
          <p className="mt-1 text-[0.6875rem] font-medium text-gray-400">{product.sku}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <span className="min-w-0 text-lg font-bold tracking-tight text-gray-950 dark:text-white">{price}</span>
          {showStock && (
            <span className="shrink-0 rounded-full bg-black/[0.04] px-2.5 py-1 text-[0.6875rem] font-semibold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400">{product.quantity} left</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ProductCardGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 ${className}`}>
      {children}
    </div>
  );
}
