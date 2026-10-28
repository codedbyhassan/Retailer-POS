import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';

export default function InventoryTable({ products, currency = 'USD' }) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.1] p-8 text-center dark:border-white/[0.1] sm:p-12">
        <p className="font-heading text-lg font-semibold text-gray-600 dark:text-gray-200">No inventory data</p>
        <p className="mt-1 text-sm text-gray-500">Add products to start tracking stock levels.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {products.map((p) => (
          <article key={p.id} className="rounded-2xl border border-black/[0.07] bg-white p-4 dark:border-white/[0.08] dark:bg-surface-dark">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words text-sm font-semibold text-gray-900 dark:text-white">{p.name}</h4>
                <p className="mt-1 text-xs text-gray-500">Reorder at {p.reorder_level ?? 10}</p>
              </div>
              <Badge variant={stockBadge(p.quantity, p.reorder_level)}>{stockLabel(p.quantity, p.reorder_level)}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-black/[0.06] pt-3 dark:border-white/[0.08]">
              <div><p className="text-xs text-gray-500">In stock</p><p className="mt-1 text-lg font-semibold tabular-nums">{p.quantity}</p></div>
              <div className="text-right"><p className="text-xs text-gray-500">Stock value</p><p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(p.cost_price * p.quantity, currency)}</p></div>
            </div>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-surface-dark sm:block">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-black/[0.025] dark:bg-white/[0.035]">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Product</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">In stock</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Reorder at</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Value</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.07]">
            {products.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <td className="px-4 py-3.5 font-semibold">{p.name}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">{p.quantity}</td>
                <td className="px-4 py-3.5 text-right tabular-nums text-gray-500">{p.reorder_level ?? 10}</td>
                <td className="px-4 py-3.5 text-right font-medium tabular-nums">{formatCurrency(p.cost_price * p.quantity, currency)}</td>
                <td className="px-4 py-3.5"><Badge variant={stockBadge(p.quantity, p.reorder_level)}>{stockLabel(p.quantity, p.reorder_level)}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
