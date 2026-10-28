import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductImageSrc } from '../../utils/imageUtils';

export default function ProductTable({
  products,
  onEdit,
  onArchive,
  currency = 'USD',
  emptyTitle = 'No products yet',
  emptyDescription = 'Add your first product to get started.',
}) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.1] p-6 text-center dark:border-white/[0.1] sm:p-10">
        <p className="text-base font-semibold text-gray-600 dark:text-gray-300 sm:text-lg">{emptyTitle}</p>
        <p className="mt-1 text-sm text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="ios-card min-w-0 overflow-hidden">
      <div className="scrollbar-thin max-w-full overflow-x-auto">
        <table aria-label="Products" className="w-full min-w-[900px] text-sm">
          <thead className="bg-black/[0.025] dark:bg-white/[0.03]">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Product</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">SKU</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Category</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Price</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Qty</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Status</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {products.map((product) => (
              <tr key={product.id} className="transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
                      {getProductImageSrc(product) ? (
                        <img src={getProductImageSrc(product)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[0.625rem] font-semibold text-gray-400">No image</div>
                      )}
                    </div>
                    <span className="max-w-[14rem] truncate font-medium">{product.name}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-500">{product.sku || '—'}</td>
                <td className="max-w-[10rem] truncate px-4 py-3 text-gray-500">{product.category || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(product.selling_price, currency)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{product.quantity}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={stockBadge(product.quantity, product.reorder_level)}>
                    {stockLabel(product.quantity, product.reorder_level)}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(product)}
                      className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onArchive(product)}
                      className="min-h-10 rounded-lg px-3 text-sm font-semibold text-red-600 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400"
                    >
                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
