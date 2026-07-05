import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductImageSrc } from '../../utils/imageUtils';

export default function ProductTable({ products, onEdit, onArchive, currency = 'USD' }) {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/[0.08] p-12 text-center dark:border-white/[0.08]">
        <p className="text-lg font-medium text-gray-500">No products yet</p>
        <p className="mt-1 text-sm text-gray-400">Add your first product to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden ios-card">
      <table className="w-full text-sm">
        <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Product</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">SKU</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Category</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Price</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Qty</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Status</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {products.map((p) => (
            <tr key={p.id} className="transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.06]">
                    {getProductImageSrc(p) ? (
                      <img src={getProductImageSrc(p)} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[0.625rem] font-semibold text-gray-400">IMG</div>
                    )}
                  </div>
                  <span className="font-medium">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500">{p.sku}</td>
              <td className="px-4 py-3 text-gray-500">{p.category}</td>
              <td className="px-4 py-3 text-right">{formatCurrency(p.selling_price, currency)}</td>
              <td className="px-4 py-3 text-right">{p.quantity}</td>
              <td className="px-4 py-3">
                <Badge variant={stockBadge(p.quantity, p.reorder_level)}>
                  {stockLabel(p.quantity, p.reorder_level)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onEdit(p)} className="mr-2 text-brand-600 hover:underline">Edit</button>
                <button onClick={() => onArchive(p)} className="text-red-500 hover:underline">Archive</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
