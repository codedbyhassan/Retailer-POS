import { useEffect, useState } from 'react';
import { getAllProducts } from '../../services/indexeddb/productsStore';
import { getSalesWithItems } from '../../services/indexeddb/salesStore';
import Badge, { stockBadge, stockLabel } from '../../components/ui/Badge';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ReportHeader from '../../components/analytics/ReportHeader';
import { BarChart, MiniStat } from '../../components/analytics/ChartWidgets';
import { formatPercent } from '../../utils/formatCurrency';

export default function ProductReport() {
  const [report, setReport] = useState(null);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    async function load() {
      const [products, sales] = await Promise.all([
        getAllProducts(),
        getSalesWithItems(),
      ]);

      const stats = {};
      const categoryStats = {};
      for (const sale of sales) {
        for (const item of sale.items) {
          const product = products.find((p) => p.id === item.product_id);
          const cost = product?.cost_price || 0;
          const profit = (item.price - cost) * item.quantity;
          if (!stats[item.product_id]) {
            stats[item.product_id] = {
              ...product,
              id: item.product_id,
              name: product?.name || item.product_name || 'Unknown',
              sold: 0,
              revenue: 0,
              profit: 0,
            };
          }
          stats[item.product_id].sold += item.quantity;
          stats[item.product_id].revenue += item.subtotal;
          stats[item.product_id].profit += profit;

          const category = product?.category || 'Uncategorized';
          if (!categoryStats[category]) categoryStats[category] = { label: category, value: 0 };
          categoryStats[category].value += item.subtotal;
        }
      }

      const withSales = products.map((p) => {
        const stat = stats[p.id] || {};
        const revenue = stat.revenue || 0;
        const profit = stat.profit || 0;
        return {
          ...p,
          sold: stat.sold || 0,
          revenue,
          profit,
          margin: revenue ? (profit / revenue) * 100 : 0,
          velocity: (stat.sold || 0) / 7,
          stockCoverDays: stat.sold ? p.quantity / ((stat.sold || 0) / 7) : null,
        };
      });

      const totalRevenue = withSales.reduce((s, p) => s + p.revenue, 0);
      const totalProfit = withSales.reduce((s, p) => s + p.profit, 0);
      const totalUnits = withSales.reduce((s, p) => s + p.sold, 0);
      setReport({
        products: withSales.sort((a, b) => b.revenue - a.revenue),
        bestSellers: [...withSales].sort((a, b) => b.sold - a.sold).slice(0, 8),
        slowMovers: [...withSales].sort((a, b) => a.sold - b.sold).slice(0, 8),
        outOfStock: products.filter((p) => p.quantity <= 0),
        categoryBreakdown: Object.values(categoryStats).sort((a, b) => b.value - a.value),
        totalRevenue,
        totalProfit,
        totalUnits,
        margin: totalRevenue ? (totalProfit / totalRevenue) * 100 : 0,
      });
    }
    load();
  }, []);

  if (!report) return null;

  return (
    <div>
      <ReportHeader title="Product Report" description="Product velocity, revenue, margin, and stock movement analytics." />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="Product Revenue" value={formatMoney(report.totalRevenue)} />
          <MiniStat label="Product Profit" value={formatMoney(report.totalProfit)} accent="green" />
          <MiniStat label="Units Sold" value={report.totalUnits} accent="violet" />
          <MiniStat label="Product Margin" value={formatPercent(report.margin)} accent="amber" />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
        <div className="ios-card p-6">
          <h3 className="mb-4">Best Sellers</h3>
          {report.bestSellers.length === 0 ? (
            <p className="text-gray-500">No sales data yet</p>
          ) : (
            <BarChart items={report.bestSellers.map((p) => ({ label: p.name, value: p.sold }))} formatValue={(v) => `${v} sold`} />
          )}
        </div>
        <div className="ios-card p-6">
          <h3 className="mb-4">Revenue by Category</h3>
          <BarChart items={report.categoryBreakdown} formatValue={formatMoney} />
        </div>
        <div className="ios-card p-6">
          <h3 className="mb-4">Slow Movers</h3>
          <div className="space-y-2">
            {report.slowMovers.map((p) => (
              <div key={p.id} className="flex justify-between rounded-2xl bg-black/[0.02] px-4 py-3 dark:bg-white/[0.03]">
                <span>{p.name}</span>
                <span className="text-gray-500">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="ios-card overflow-hidden">
        <div className="border-b border-black/[0.04] p-5 dark:border-white/[0.06]">
          <h3>Product Detail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02] text-xs uppercase text-gray-500 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left">Product</th>
                <th className="px-4 py-3 text-right">Sold</th>
                <th className="px-4 py-3 text-right">Revenue</th>
                <th className="px-4 py-3 text-right">Profit</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-right">Stock Cover</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {report.products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-right">{p.sold}</td>
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

        <div className="ios-card p-6">
          <h3 className="mb-4">Out of Stock</h3>
          {report.outOfStock.length === 0 ? (
            <p className="text-green-600">All products in stock</p>
          ) : (
            <div className="space-y-2">
              {report.outOfStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3 dark:border-gray-800">
                  <span>{p.name}</span>
                  <Badge variant={stockBadge(0)}>{stockLabel(0)}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
