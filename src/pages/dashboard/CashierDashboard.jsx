import { useEffect, useState } from 'react';
import { getSalesByDateRange } from '../../services/indexeddb/salesStore';
import { formatDate } from '../../utils/formatCurrency';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';

export default function CashierDashboard() {
  const [data, setData] = useState(null);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const sales = await getSalesByDateRange(today, today);
      setData({
        total: sales.reduce((s, x) => s + x.total, 0),
        count: sales.length,
        recent: sales.slice(-5).reverse(),
      });
    }
    load();
  }, []);

  if (!data) return null;

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Today's Summary</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold">{formatMoney(data.total)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold">{data.count}</p>
        </div>
      </div>
      {data.recent.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 font-semibold">Recent Transactions</h2>
          <div className="space-y-2">
            {data.recent.map((s) => (
              <div key={s.id} className="flex justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                <span>{s.invoice_number}</span>
                <span className="text-gray-500">{formatDate(s.created_at)}</span>
                <span className="font-medium">{formatMoney(s.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
