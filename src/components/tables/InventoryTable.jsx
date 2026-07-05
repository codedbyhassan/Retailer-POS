import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

export default function InventoryTable({ products, currency = 'USD' }) {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/[0.08] p-12 text-center dark:border-white/[0.08]">
        <p className="font-heading text-lg font-semibold text-gray-500">No inventory data</p>
        <p className="mt-1 text-sm text-gray-400">Add products to track stock levels</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden ios-card">
      <table className="w-full text-sm">
        <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">In Stock</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Reorder At</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Value</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {products.map((p) => (
            <tr key={p.id} className="transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
              <td className="px-4 py-3.5 font-semibold">{p.name}</td>
              <td className="px-4 py-3.5 text-right">{p.quantity}</td>
              <td className="px-4 py-3.5 text-right text-gray-500">{p.reorder_level ?? 10}</td>
              <td className="px-4 py-3.5 text-right font-medium">{formatCurrency(p.cost_price * p.quantity, currency)}</td>
              <td className="px-4 py-3.5">
                <Badge variant={stockBadge(p.quantity, p.reorder_level)}>
                  {stockLabel(p.quantity, p.reorder_level)}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
