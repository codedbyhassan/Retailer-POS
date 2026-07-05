import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsData } from '../../services/indexeddb/analyticsStore';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ProductCard from '../../components/products/ProductCard';
import { BarChart, MiniStat, TrendChart, HourlyChart } from '../../components/analytics/ChartWidgets';
import ReportHeader from '../../components/analytics/ReportHeader';
import Badge, { stockBadge, stockLabel } from '../../components/ui/Badge';
import { formatPercent } from '../../utils/formatCurrency';

export default function AnalyticsPage() {
  const { formatMoney } = useBusinessSettings();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalyticsData().then(setData);
  }, []);

  if (!data) {
    return <div className="py-12 text-center text-gray-500">Loading analytics...</div>;
  }

  const { summary } = data;

  return (
    <div className="space-y-8">
      <ReportHeader title="Reports" description="Detailed performance across sales, products, cashiers, and inventory." showBack={false} />
      <div className="hidden flex-wrap items-end justify-between gap-4">
        <div>
          <h2>Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Detailed performance across sales, products, cashiers, and inventory</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[0px]">
          <Link to="/admin/reports/daily" className="rounded-2xl bg-black/[0.04] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-black/[0.07] dark:bg-white/[0.08] dark:text-gray-200">Daily</Link>
          <Link to="/admin/reports/products" className="rounded-2xl bg-black/[0.04] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-black/[0.07] dark:bg-white/[0.08] dark:text-gray-200">Products</Link>
          <Link to="/admin/reports/inventory" className="rounded-2xl bg-black/[0.04] px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-black/[0.07] dark:bg-white/[0.08] dark:text-gray-200">Inventory</Link>
          View reports →
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Today Revenue" value={formatMoney(summary.todayRevenue)} sub={`${summary.todayCount} orders`} />
        <MiniStat label="Today Profit" value={formatMoney(summary.todayProfit)} accent="green" />
        <MiniStat label="Avg Order Value" value={formatMoney(summary.avgOrderValue)} accent="violet" />
        <MiniStat label="Units / Order" value={summary.avgUnitsPerOrder.toFixed(1)} sub={`${summary.totalUnits} units sold`} accent="amber" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="All-Time Revenue" value={formatMoney(summary.totalRevenue)} sub={`${summary.activeProducts} active movers`} />
        <MiniStat label="All-Time Profit" value={formatMoney(summary.totalProfit)} accent="green" />
        <MiniStat label="Profit Margin" value={formatPercent(summary.profitMargin)} accent="violet" />
        <MiniStat label="Dormant Stock Value" value={formatMoney(summary.inventoryAtRisk)} accent="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ios-card p-6">
          <h3 className="mb-4">7-Day Revenue Trend</h3>
          <TrendChart data={data.dailyTrend} formatValue={formatMoney} />
        </div>
        <div className="ios-card p-6">
          <h3 className="mb-4">Sales by Hour</h3>
          <HourlyChart data={data.hourlySales} formatValue={formatMoney} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <div className="ios-card p-6 lg:col-span-1">
          <h3 className="mb-4">Best Sellers</h3>
          <BarChart
            items={data.bestSellers.slice(0, 6).map((p) => ({ label: p.name, value: p.qty }))}
            formatValue={(v) => `${v} units`}
          />
        </div>
        <div className="ios-card p-6 lg:col-span-1">
          <h3 className="mb-4">Top Revenue Products</h3>
          <BarChart
            items={data.topRevenue.slice(0, 6).map((p) => ({ label: p.name, value: p.revenue }))}
            formatValue={formatMoney}
          />
        </div>
        <div className="ios-card p-6 lg:col-span-1">
          <h3 className="mb-4">Category Breakdown</h3>
          <BarChart
            items={data.categoryBreakdown.slice(0, 6).map((c) => ({ label: c.category, value: c.revenue }))}
            formatValue={formatMoney}
          />
          <div className="mt-4 space-y-2 border-t border-black/[0.04] pt-4 text-xs dark:border-white/[0.06]">
            {data.categoryBreakdown.slice(0, 3).map((c) => (
              <div key={c.category} className="flex justify-between gap-3 text-gray-500">
                <span className="truncate">{c.category} margin</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatPercent(c.margin)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ios-card p-6">
          <h3 className="mb-4">Payment Methods</h3>
          <BarChart
            items={data.paymentBreakdown.map((p) => ({ label: `${p.method} (${formatPercent(p.share, 0)})`, value: p.revenue }))}
            formatValue={formatMoney}
          />
        </div>
        <div className="ios-card p-6">
          <h3 className="mb-4">Cashier Performance</h3>
          <BarChart
            items={data.cashierBreakdown.map((c) => ({ label: c.name, value: c.revenue }))}
            formatValue={formatMoney}
          />
          <div className="mt-4 space-y-2 border-t border-black/[0.04] pt-4 text-xs dark:border-white/[0.06]">
            {data.cashierBreakdown.slice(0, 4).map((c) => (
              <div key={c.name} className="flex justify-between gap-3 text-gray-500">
                <span className="truncate">{c.name} avg order</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(c.avgOrder)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4">What's Moving — Top Products</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {data.bestSellers.slice(0, 5).map((p) => (
            <div key={p.product_id} className="overflow-hidden rounded-[1.15rem] border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-surface-dark">
              <ProductCard
                product={{ ...p, quantity: p.qty, id: p.product_id, name: p.name, image: p.image }}
                price={`${p.qty} sold`}
                showStock={false}
                disabled
                variant="compact"
              />
              <div className="border-t border-black/[0.04] px-3 py-2 text-center text-xs font-semibold text-brand-600 dark:border-white/[0.06]">
                {formatMoney(p.revenue)} revenue · {formatPercent(p.margin)} margin
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="ios-card overflow-hidden">
        <div className="border-b border-black/[0.04] p-5 dark:border-white/[0.06]">
          <h3>Product Movement Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02] text-xs uppercase text-gray-500 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Units</th>
                <th className="px-4 py-3 text-right">Velocity</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-right">Stock Cover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.topRevenue.slice(0, 10).map((p) => (
                <tr key={p.product_id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.qty}</td>
                  <td className="px-4 py-3 text-right">{p.velocity.toFixed(1)}/day</td>
                  <td className="px-4 py-3 text-right">{formatMoney(p.revenue)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(p.profit)}</td>
                  <td className="px-4 py-3 text-right">{formatPercent(p.margin)}</td>
                  <td className="px-4 py-3 text-right">{p.stockCoverDays == null ? 'No sales' : `${Math.round(p.stockCoverDays)} days`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ios-card p-6">
          <h3 className="mb-4">Slow Movers</h3>
          <div className="space-y-2">
            {data.slowMovers.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl bg-black/[0.02] px-4 py-3 dark:bg-white/[0.03]">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span className="shrink-0 text-xs font-semibold text-gray-500">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ios-card p-6">
          <h3 className="mb-4">Stock Alerts</h3>
          <div className="space-y-2">
            {data.outOfStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ring-red-500/20">
                <span className="text-sm font-medium">{p.name}</span>
                <Badge variant={stockBadge(0)}>{stockLabel(0)}</Badge>
              </div>
            ))}
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-2xl px-4 py-3 ring-1 ring-amber-500/20">
                <span className="text-sm font-medium">{p.name}</span>
                <Badge variant={stockBadge(p.quantity, p.reorder_level)}>{p.quantity} left</Badge>
              </div>
            ))}
            {!data.outOfStock.length && !data.lowStock.length && (
              <p className="text-sm text-emerald-600">All stock levels healthy</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="Week Revenue" value={formatMoney(summary.weekRevenue)} sub={`${summary.weekCount} orders`} />
        <MiniStat label="Month Revenue" value={formatMoney(summary.monthRevenue)} sub={`${summary.monthCount} orders`} accent="green" />
        <MiniStat label="Inventory Cost" value={formatMoney(summary.inventoryValue)} accent="violet" />
        <MiniStat label="Retail Value" value={formatMoney(summary.retailValue)} accent="amber" />
      </div>
    </div>
  );
}
