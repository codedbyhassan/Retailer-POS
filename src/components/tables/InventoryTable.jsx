import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

export default function InventoryTable({ products, currency = 'USD' }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.1] p-6 text-center dark:border-white/[0.1] sm:p-10">
        <p className="font-heading text-base font-semibold text-gray-600 dark:text-gray-300 sm:text-lg">No inventory data</p>
        <p className="mt-1 text-sm text-gray-400">Add products to track stock levels.</p>
      </div>
    );
  }

  return (
    <div className="ios-card min-w-0 overflow-hidden">
      <div className="scrollbar-thin max-w-full overflow-x-auto">
        <table aria-label="Current inventory by product" className="w-full min-w-[680px] text-sm">
          <thead className="bg-black/[0.025] dark:bg-white/[0.03]">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">In Stock</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Reorder At</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Value</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {products.map((product) => (
              <tr key={product.id} className="transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <td className="max-w-[18rem] px-4 py-3.5 font-semibold">{product.name}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums">{product.quantity}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right tabular-nums text-gray-500">{product.reorder_level ?? 10}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-medium tabular-nums">{formatCurrency(product.cost_price * product.quantity, currency)}</td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  <Badge variant={stockBadge(product.quantity, product.reorder_level)}>
                    {stockLabel(product.quantity, product.reorder_level)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
