import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { getProductImageSrc } from '../../utils/imageUtils';

function PlaceholderIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
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
      className={"group relative flex min-h-[12rem] flex-col overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-left transition duration-200 ease-ios hover:border-brand-400/40 hover:shadow-ios-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:shadow-none dark:border-white/[0.08] dark:bg-surface-dark dark:shadow-none dark:hover:border-brand-300/30 dark:focus-visible:ring-offset-black " + className}
    >
      <div className="relative aspect-[1.35] w-full overflow-hidden bg-gray-100 dark:bg-white/[0.04]">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 ease-ios group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <PlaceholderIcon className="h-9 w-9 text-gray-300 dark:text-gray-600" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/35 to-transparent" />
        {showStock && (
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
            <Badge variant={stockBadge(product.quantity, product.reorder_level)}>
              {stockLabel(product.quantity, product.reorder_level)}
            </Badge>
          </div>
        )}
        {lowStock && showStock && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-1 text-[0.625rem] font-bold uppercase text-white sm:right-3 sm:top-3">
            Low
          </span>
        )}
        {product.category && variant === 'pos' && (
          <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/50 px-2 py-1 text-[0.625rem] font-semibold uppercase text-white backdrop-blur-sm sm:bottom-3 sm:left-3">
            {product.category}
          </span>
        )}
      </div>

      <div className={variant === 'compact' ? 'flex flex-1 flex-col p-2.5 sm:p-3' : 'flex flex-1 flex-col p-3'}>
        <h3 className="line-clamp-2 !text-sm !font-semibold leading-snug text-gray-950 dark:text-white">
          {product.name}
        </h3>
        {product.sku && variant !== 'pos' && (
          <p className="mt-1 truncate text-[0.6875rem] font-medium text-gray-400">{product.sku}</p>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="min-w-0 break-words text-base font-bold tracking-tight text-gray-950 dark:text-white sm:text-lg">{price}</span>
          {showStock && (
            <span className="shrink-0 rounded-full bg-black/[0.04] px-2 py-1 text-[0.625rem] font-semibold text-gray-500 dark:bg-white/[0.06] dark:text-gray-400 sm:text-[0.6875rem]">
              {product.quantity} left
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ProductCardGrid({ children, className = '' }) {
  return (
    <div className={"grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 " + className}>
      {children}
    </div>
  );
}
