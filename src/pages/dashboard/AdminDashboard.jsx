import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSalesByDateRange } from '../../services/indexeddb/salesStore';
import { getLowStockProducts } from '../../services/indexeddb/productsStore';
import { getInventorySummary } from '../../services/indexeddb/inventoryStore';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';

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
  const { formatMoney } = useBusinessSettings();

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
        weekTotal: weekSales.reduce((s, x) => s + x.total, 0),
        monthTotal: monthSales.reduce((s, x) => s + x.total, 0),
        stockValue: inventory.totalValue,
        lowStockCount: lowStock.length,
      });
    }
    load();
  }, []);

  if (!stats) return <div className="text-gray-500">Loading dashboard...</div>;

  return (
    <div>
      <h2 className="mb-6">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Today's Sales" value={formatMoney(stats.todayTotal)} sub={`${stats.todayCount} transactions`} />
        <StatCard label="This Week" value={formatMoney(stats.weekTotal)} />
        <StatCard label="This Month" value={formatMoney(stats.monthTotal)} />
        <StatCard label="Inventory Value" value={formatMoney(stats.stockValue)} />
        <StatCard label="Low Stock Alerts" value={stats.lowStockCount} alert={stats.lowStockCount > 0} sub={stats.lowStockCount > 0 ? 'Products need restocking' : 'All good'} />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/pos" className="inline-flex items-center rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-ios transition-all duration-200 ease-ios hover:bg-brand-500 active:scale-[0.97]">Open POS</Link>
        <Link to="/admin/inventory" className="inline-flex items-center rounded-2xl bg-black/[0.04] px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 ease-ios hover:bg-black/[0.07] active:scale-[0.97] dark:bg-white/[0.08] dark:text-gray-200 dark:hover:bg-white/[0.12]">Manage Inventory</Link>
      </div>
    </div>
  );
}
