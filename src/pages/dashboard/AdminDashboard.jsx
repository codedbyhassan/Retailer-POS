import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listSales } from '../../services/online/salesService';
import { getLowStockProducts } from '../../services/online/productService';
import { getInventorySummary } from '../../services/online/inventoryService';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { LowStockAlert, HourlySalesSparkline, SkeletonLoader } from '../../components/analytics/DashboardAlerts';

function StatCard({ label, value, sub, alert }) {
  return (
    <div className={"min-w-0 rounded-2xl border p-4 transition-colors duration-200 sm:p-5 " + (alert
      ? 'border-amber-300/60 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/20'
      : 'ios-card border-black/[0.04] dark:border-white/[0.06]')}>
      <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
      <p className="mt-1 break-words text-xl font-bold tabular-nums tracking-tight sm:text-2xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

      const [allSales, lowStock, inventory] = await Promise.all([
        listSales(),
        getLowStockProducts(),
        getInventorySummary(),
      ]);
      const inRange = (sales, start) => sales.filter((sale) => sale.status !== 'voided' && new Date(sale.created_at) >= new Date(start));
      const todaySales = inRange(allSales, today);
      const weekSales = inRange(allSales, weekAgo);
      const monthSales = inRange(allSales, monthStart);
      setStats({
        todayTotal: todaySales.reduce((sum, sale) => sum + sale.total, 0),
        todayCount: todaySales.length,
        todaySales,
        weekTotal: weekSales.reduce((sum, sale) => sum + sale.total, 0),
        monthTotal: monthSales.reduce((sum, sale) => sum + sale.total, 0),
        stockValue: inventory.totalValue,
        lowStockCount: lowStock.length,
      });
      setLowStockProducts(lowStock);
    }

    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-w-0">
      <div className="mb-5 sm:mb-6">
        <h2>Dashboard</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A current view of sales and stock.</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 sm:gap-4">
        <StatCard label="Today's Sales" value={stats ? formatMoney(stats.todayTotal) : '—'} sub={stats ? stats.todayCount + ' transactions' : 'Loading sales'} />
        <StatCard label="This Week" value={stats ? formatMoney(stats.weekTotal) : '—'} sub={!stats ? 'Loading sales' : undefined} />
        <StatCard label="This Month" value={stats ? formatMoney(stats.monthTotal) : '—'} sub={!stats ? 'Loading sales' : undefined} />
        <StatCard label="Inventory Value" value={stats ? formatMoney(stats.stockValue) : '—'} sub={!stats ? 'Loading inventory' : undefined} />
        <StatCard
          label="Low Stock Alerts"
          value={stats ? String(stats.lowStockCount) : '—'}
          alert={Boolean(stats && stats.lowStockCount > 0)}
          sub={stats ? (stats.lowStockCount > 0 ? 'Products need restocking' : 'No low-stock products') : 'Loading stock'}
        />
      </div>

      {stats ? (
        <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 sm:mb-4">Today's Hourly Breakdown</h3>
            <div className="rounded-2xl border border-black/[0.04] bg-white p-3 dark:border-white/[0.06] dark:bg-surface-dark sm:p-6">
              <HourlySalesSparkline sales={stats.todaySales} />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 sm:mb-4">Low Stock Alerts</h3>
            <LowStockAlert products={lowStockProducts} isLoading={false} />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-6 sm:mt-8 sm:space-y-8">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 sm:mb-4">Today's Hourly Breakdown</h3>
            <SkeletonLoader />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 sm:mb-4">Low Stock Alerts</h3>
            <SkeletonLoader />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
        <Link
          to="/pos"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-ios transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Open POS
        </Link>
        <Link
          to="/admin/inventory"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-black/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98] dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]"
        >
          Manage Inventory
        </Link>
      </div>
    </div>
  );
}
