import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listSales } from '../../services/online/salesService';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import SalesTable from '../../components/tables/SalesTable';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { currency } = useBusinessSettings();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function load() {
      setPageLoading(true);
      setLoadError('');
      try {
        const result = await listSales();
        if (active) setSales(result);
      } catch (error) {
        if (active) setLoadError(error?.message || 'Unable to load sales history right now.');
      } finally {
        if (active) setPageLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = sales.filter((sale) => {
    if (dateFrom && new Date(sale.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(sale.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const hasDateFilter = Boolean(dateFrom || dateTo);

  return (
    <div className="min-w-0">
      <div className="mb-5 sm:mb-6">
        <h2>Sales History</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Find a transaction and review its receipt details.</p>
      </div>

      <div className="mb-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <Input
          label="From"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(event) => setDateFrom(event.target.value)}
        />
        <Input
          label="To"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(event) => setDateTo(event.target.value)}
        />
      </div>

      {hasDateFilter && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
          >
            Clear date filters
          </Button>
        </div>
      )}

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-300">Sales history could not be loaded</p>
          <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 min-h-10 rounded-xl px-3 text-sm font-semibold text-red-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            Reload page
          </button>
        </div>
      ) : pageLoading ? (
        <div aria-busy="true" aria-label="Loading sales history" className="space-y-3">
          <div className="h-12 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="h-64 animate-pulse rounded-2xl border border-black/[0.04] bg-white dark:border-white/[0.06] dark:bg-surface-dark" />
        </div>
      ) : (
        <SalesTable
          sales={filtered}
          currency={currency}
          emptyTitle={hasDateFilter ? 'No sales in this date range' : 'No sales yet'}
          emptyDescription={hasDateFilter ? 'Change or clear the date filters to see other transactions.' : 'Completed sales will appear here.'}
          onView={(sale) => navigate('/admin/sales/' + sale.id)}
        />
      )}
    </div>
  );
}
