import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSalesByDateRange } from '../../services/indexeddb/salesStore';
import { getLowStockProducts } from '../../services/indexeddb/productsStore';
import { getInventorySummary } from '../../services/indexeddb/inventoryStore';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { LowStockAlert, SyncStatus, HourlySalesSparkline, SkeletonLoader } from '../../components/analytics/DashboardAlerts';

function StatCard({ label, value, sub, alert }) {
  return (
    <div className={`retail-panel p-5 ${alert ? 'border-amber-300 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-900/10' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="retail-section-title">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
        </div>
        {alert && <span className="mt-0.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Attention</span>}
      </div>
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
      const timestamp = new Date().toISOString();
      setLastSync(timestamp);
      localStorage.setItem('retailer_last_sync', timestamp);
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
        averageSale: todaySales.length ? todaySales.reduce((s, x) => s + x.total, 0) / todaySales.length : 0,
      });
      setLowStockProducts(lowStock);
    }
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { label: 'Open POS', to: '/pos', primary: true },
    { label: 'Add product', to: '/admin/products' },
    { label: 'View sales', to: '/admin/sales' },
    { label: 'Inventory', to: '/admin/inventory' },
  ];

  return (
    <div className="mx-auto max-w-[1440px] pb-10">
      <header className="mb-7 flex flex-col gap-4 border-b border-gray-200 pb-5 dark:border-white/[0.08] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="retail-section-title">Business overview</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="!text-3xl">Dashboard</h2>
            <SyncStatus lastSync={lastSync} isSyncing={isSyncing} />
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A quick view of today's sales, stock and business activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to} className={action.primary ? 'retail-primary' : 'retail-secondary'}>{action.label}</Link>
          ))}
        </div>
      </header>

      <section aria-label="Business metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Today's sales" value={stats ? formatMoney(stats.todayTotal) : '—'} sub={stats ? `${stats.todayCount} transactions` : 'Loading'} />
        <StatCard label="Average sale" value={stats ? formatMoney(stats.averageSale) : '—'} sub="Per transaction today" />
        <StatCard label="This week" value={stats ? formatMoney(stats.weekTotal) : '—'} sub="Last 7 days" />
        <StatCard label="Inventory value" value={stats ? formatMoney(stats.stockValue) : '—'} sub="Current stock value" />
        <StatCard label="Low stock" value={stats ? stats.lowStockCount : '—'} alert={!!(stats && stats.lowStockCount)} sub={stats && stats.lowStockCount ? 'Products need restocking' : 'Stock levels look good'} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <section className="retail-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="retail-section-title">Sales activity</p>
              <h3 className="mt-1 !text-lg">Today's sales by hour</h3>
            </div>
            <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">Today</span>
          </div>
          {stats ? <HourlySalesSparkline sales={stats.todaySales} /> : <SkeletonLoader />}
        </section>

        <section className="retail-panel p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="retail-section-title">Needs attention</p>
              <h3 className="mt-1 !text-lg">Stock alerts</h3>
            </div>
            <Link to="/admin/inventory" className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">View inventory</Link>
          </div>
          {stats ? <LowStockAlert products={lowStockProducts} isLoading={false} /> : <SkeletonLoader />}
        </section>
      </div>

      <section className="mt-6 retail-panel overflow-hidden">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.08]">
          <div>
            <p className="retail-section-title">Business snapshot</p>
            <h3 className="mt-1 !text-lg">What matters today</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Month-to-date sales: {stats ? formatMoney(stats.monthTotal) : '—'}</p>
        </div>
        <div className="grid divide-y divide-gray-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/[0.08]">
          <div className="p-5"><p className="text-xs font-semibold text-gray-500">Transactions</p><p className="mt-2 text-xl font-bold">{stats ? stats.todayCount : '—'}</p><p className="mt-1 text-xs text-gray-500">Completed today</p></div>
          <div className="p-5"><p className="text-xs font-semibold text-gray-500">Stock alerts</p><p className="mt-2 text-xl font-bold">{stats ? stats.lowStockCount : '—'}</p><p className="mt-1 text-xs text-gray-500">Products to review</p></div>
          <div className="p-5"><p className="text-xs font-semibold text-gray-500">Inventory value</p><p className="mt-2 text-xl font-bold">{stats ? formatMoney(stats.stockValue) : '—'}</p><p className="mt-1 text-xs text-gray-500">Estimated current value</p></div>
        </div>
      </section>
    </div>
  );
}
