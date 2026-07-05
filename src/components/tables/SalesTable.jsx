import { formatCurrency, formatDate } from '../../utils/formatCurrency';

export default function SalesTable({ sales, onView, currency = 'USD' }) {
  if (!sales.length) {
    return (
      <div className="rounded-3xl border border-dashed border-black/[0.08] p-12 text-center dark:border-white/[0.08]">
        <p className="font-heading text-lg font-semibold text-gray-500">No sales yet</p>
        <p className="mt-1 text-sm text-gray-400">Completed sales will appear here</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden ios-card">
      <table className="w-full text-sm">
        <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cashier</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {sales.map((s) => (
            <tr key={s.id} className="cursor-pointer transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]" onClick={() => onView(s)}>
              <td className="px-4 py-3.5 font-semibold">{s.invoice_number}</td>
              <td className="px-4 py-3.5 text-gray-500">{formatDate(s.created_at)}</td>
              <td className="px-4 py-3.5 text-gray-500">{s.cashier_name || '—'}</td>
              <td className="px-4 py-3.5 capitalize text-gray-500">{s.payment_method}</td>
              <td className="px-4 py-3.5 text-right font-semibold">{formatCurrency(s.total, currency)}</td>
              <td className="px-4 py-3.5 text-right">
                <button type="button" className="text-sm font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400" onClick={(e) => { e.stopPropagation(); onView(s); }}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
