import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSalesByDateRange } from '../../services/indexeddb/salesStore';
import { getLowStockProducts } from '../../services/indexeddb/productsStore';
import { getInventorySummary } from '../../services/indexeddb/inventoryStore';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { LowStockAlert, SyncStatus, HourlySalesSparkline, SkeletonLoader } from '../../components/analytics/DashboardAlerts';

function StatCard({ label, value, sub, alert }) {
  return (
    <div className={`rounded-3xl border p-5 transition-all duration-200 ease-ios hover:shadow-ios-md ${alert ? 'border-amber-300/60 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-900/20' : 'ios-card border-black/[0.04] dark:border-white/[0.06]'}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [lastSync, setLastSync] = useState(localStorage.getItem('retailer_last_sync'));
  const [isSyncing, setIsSyncing] = useState(false);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => {
      setIsSyncing(false);
      setLastSync(new Date().toISOString());
      localStorage.setItem('retailer_last_sync', new Date().toISOString());
    };

    window.addEventListener('sync:start', handleSyncStart);
    window.addEventListener('sync:end', handleSyncEnd);

    return () => {
      window.removeEventListener('sync:start', handleSyncStart);
      window.removeEventListener('sync:end', handleSyncEnd);
    };
  }, []);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

      const todaySales = await getSalesByDateRange(today, today);
      const weekSales = await getSalesByDateRange(weekAgo, today);
      const monthSales = await getSalesByDateRange(monthStart, today);
      const lowStock = await getLowStockProducts();
      const inventory = await getInventorySummary();

      setStats({
        todayTotal: todaySales.reduce((s, x) => s + x.total, 0),
        todayCount: todaySales.length,
        todaySales,
        weekTotal: weekSales.reduce((s, x) => s + x.total, 0),
        monthTotal: monthSales.reduce((s, x) => s + x.total, 0),
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2>Dashboard</h2>
        <SyncStatus lastSync={lastSync} isSyncing={isSyncing} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Today's Sales" value={stats ? formatMoney(stats.todayTotal) : '-'} sub={stats ? `${stats.todayCount} transactions` : ''} />
        <StatCard label="This Week" value={stats ? formatMoney(stats.weekTotal) : '-'} />
        <StatCard label="This Month" value={stats ? formatMoney(stats.monthTotal) : '-'} />
        <StatCard label="Inventory Value" value={stats ? formatMoney(stats.stockValue) : '-'} />
        <StatCard label="Low Stock Alerts" value={stats ? stats.lowStockCount : '-'} alert={stats && stats.lowStockCount > 0} sub={stats && stats.lowStockCount > 0 ? 'Products need restocking' : 'All good'} />
      </div>

      {stats && (
        <div className="mt-8 space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Today's Hourly Breakdown</h3>
            <div className="rounded-2xl border border-black/[0.04] bg-white p-6 dark:border-white/[0.06] dark:bg-surface-dark">
              <HourlySalesSparkline sales={stats.todaySales} />
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Low Stock Alerts</h3>
            <LowStockAlert products={lowStockProducts} isLoading={!stats} />
          </div>
        </div>
      )}

      {!stats && (
        <div className="mt-8 space-y-8">
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Today's Hourly Breakdown</h3>
            <SkeletonLoader />
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Low Stock Alerts</h3>
            <SkeletonLoader />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/pos" className="inline-flex items-center rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-ios transition-all duration-200 ease-ios hover:bg-brand-500 active:scale-[0.97]">Open POS</Link>
        <Link to="/admin/inventory" className="inline-flex items-center rounded-2xl bg-black/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 ease-ios hover:bg-black/[0.07] active:scale-[0.97] dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]">Manage Inventory</Link>
      </div>
    </div>
  );
}
