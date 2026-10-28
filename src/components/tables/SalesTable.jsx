import { formatCurrency, formatDate } from '../../utils/formatCurrency';

export default function SalesTable({
  sales,
  onView,
  currency = 'USD',
  emptyTitle = 'No sales yet',
  emptyDescription = 'Completed sales will appear here.',
}) {
  if (!sales.length) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.1] p-6 text-center dark:border-white/[0.1] sm:p-10">
        <p className="font-heading text-base font-semibold text-gray-600 dark:text-gray-300 sm:text-lg">{emptyTitle}</p>
        <p className="mt-1 text-sm text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="ios-card min-w-0 overflow-hidden">
      <div className="scrollbar-thin max-w-full overflow-x-auto">
        <table aria-label="Sales history" className="w-full min-w-[760px] text-sm">
          <thead className="bg-black/[0.025] dark:bg-white/[0.03]">
            <tr>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Invoice</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Cashier</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Payment</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Total</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {sales.map((sale) => (
              <tr key={sale.id} className="transition-colors duration-150 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                <td className="whitespace-nowrap px-4 py-3.5 font-semibold">{sale.invoice_number}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-gray-500">{formatDate(sale.created_at)}</td>
                <td className="max-w-[12rem] truncate px-4 py-3.5 text-gray-500">{sale.cashier_name || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 capitalize text-gray-500">{sale.payment_method || '—'}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(sale.total, currency)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-right">
                  <button
                    type="button"
                    className="min-h-10 rounded-lg px-3 text-sm font-semibold text-brand-700 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300"
                    aria-label={'View sale ' + sale.invoice_number}
                    onClick={() => onView(sale)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
