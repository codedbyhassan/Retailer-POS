import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSale } from '../../services/online/salesService';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';

export default function SaleDetailPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const { currency } = useBusinessSettings();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      setSale(null);
      try {
        const result = await getSale(id);
        if (!result) {
          if (active) setError('This transaction could not be found or is no longer available.');
          return;
        }
        if (active) setSale(result);
      } catch (loadError) {
        if (active) setError(loadError?.message || 'Unable to load this transaction right now.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [id, retryKey]);

  if (error) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
        <p className="font-semibold text-red-800 dark:text-red-300">Transaction could not be loaded</p>
        <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">{error}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRetryKey((current) => current + 1)}
            className="min-h-10 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link to="/admin/sales" className="inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-200 dark:hover:bg-white/[0.06]">
            Back to sales
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !sale) {
    return (
      <div aria-busy="true" aria-label="Loading transaction" className="space-y-4">
        <div className="h-5 w-28 animate-pulse rounded bg-black/[0.05] dark:bg-white/[0.08]" />
        <div className="h-16 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/[0.08]" />
        <div className="h-56 animate-pulse rounded-2xl border border-black/[0.04] bg-white dark:border-white/[0.06] dark:bg-surface-dark" />
      </div>
    );
  }

  const items = Array.isArray(sale.sale_items)
    ? sale.sale_items
    : Array.isArray(sale.items)
      ? sale.items
      : [];

  return (
    <div className="min-w-0">
      <Link to="/admin/sales" className="inline-flex min-h-10 items-center rounded-lg pr-3 text-sm font-semibold text-brand-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300">
        ← Back to sales
      </Link>

      <div className="mb-5 mt-2 min-w-0 sm:mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Transaction details</p>
        <h2 className="mt-1 break-words text-xl sm:text-2xl">{sale.invoice_number}</h2>
        <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2">
          <span>{formatDate(sale.created_at)}</span>
          <span className="hidden sm:inline">·</span>
          <span>{sale.cashier_name || 'Cashier not available'}</span>
          <span className="hidden sm:inline">·</span>
          <span className="capitalize">{sale.payment_method || 'Payment not recorded'}</span>
        </div>
      </div>

      <section aria-label="Items sold" className="ios-card min-w-0 overflow-hidden">
        {items.length ? (
          <div className="scrollbar-thin max-w-full overflow-x-auto">
            <table aria-label="Items in this transaction" className="w-full min-w-[580px] text-sm">
              <thead className="bg-black/[0.025] dark:bg-white/[0.03]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Product</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Qty</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Price</th>
                  <th scope="col" className="whitespace-nowrap px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {items.map((item) => {
                  const productLabel = item.product_name || item.name || (item.product_id ? 'Product ' + String(item.product_id).slice(0, 8) : 'Unknown product');
                  return (
                    <tr key={item.id}>
                      <td className="max-w-[18rem] break-words px-4 py-3">{productLabel}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatCurrency(item.price, currency)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">{formatCurrency(item.subtotal, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-gray-500">No line items are available for this transaction.</div>
        )}
      </section>

      <section aria-label="Transaction totals" className="mt-4 w-full max-w-sm space-y-2 rounded-2xl border border-black/[0.06] bg-white p-4 text-sm dark:border-white/[0.08] dark:bg-surface-dark sm:ml-auto sm:p-5">
        <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
          <span>Subtotal</span><span className="tabular-nums">{formatCurrency(sale.subtotal, currency)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between gap-4 text-emerald-700 dark:text-emerald-400">
            <span>Discount</span><span className="tabular-nums">−{formatCurrency(sale.discount_amount, currency)}</span>
          </div>
        )}
        <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
          <span>Tax</span><span className="tabular-nums">{formatCurrency(sale.tax_amount, currency)}</span>
        </div>
        <div className="flex justify-between gap-4 border-t border-black/[0.08] pt-3 text-lg font-bold dark:border-white/[0.1]">
          <span>Total</span><span className="tabular-nums">{formatCurrency(sale.total, currency)}</span>
        </div>
      </section>
    </div>
  );
}
