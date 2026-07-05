import { useEffect, useState } from 'react';
import { getInventorySummary } from '../../services/indexeddb/inventoryStore';
import InventoryTable from '../../components/tables/InventoryTable';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ReportHeader from '../../components/analytics/ReportHeader';
import { BarChart, MiniStat } from '../../components/analytics/ChartWidgets';
import { formatPercent } from '../../utils/formatCurrency';

export default function InventoryReport() {
  const [summary, setSummary] = useState(null);
  const { currency, formatMoney } = useBusinessSettings();

  useEffect(() => {
    getInventorySummary().then(setSummary);
  }, []);

  if (!summary) return null;

  const retailValue = summary.products.reduce((sum, p) => sum + p.selling_price * p.quantity, 0);
  const potentialProfit = retailValue - summary.totalValue;
  const outOfStock = summary.products.filter((p) => p.quantity <= 0);
  const healthy = summary.products.filter((p) => p.quantity > (p.reorder_level ?? 10));
  const stockByCategory = Object.values(
    summary.products.reduce((acc, p) => {
      const category = p.category || 'Uncategorized';
      acc[category] = acc[category] || { label: category, value: 0 };
      acc[category].value += p.cost_price * p.quantity;
      return acc;
    }, {})
  ).sort((a, b) => b.value - a.value);
  const stockRisk = [...summary.products]
    .map((p) => ({
      ...p,
      stockValue: p.cost_price * p.quantity,
      retailValue: p.selling_price * p.quantity,
      margin: p.selling_price ? ((p.selling_price - p.cost_price) / p.selling_price) * 100 : 0,
    }))
    .sort((a, b) => a.quantity - b.quantity);

  return (
    <div>
      <ReportHeader title="Inventory Report" description="Stock value, retail value, replenishment risk, and category exposure." />
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniStat label="Inventory Cost" value={formatMoney(summary.totalValue)} />
          <MiniStat label="Retail Value" value={formatMoney(retailValue)} accent="green" />
          <MiniStat label="Potential Profit" value={formatMoney(potentialProfit)} accent="violet" />
          <MiniStat label="Low Stock" value={summary.lowStock.length} accent="amber" />
          <MiniStat label="Out of Stock" value={outOfStock.length} accent="amber" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ios-card p-6">
            <h3 className="mb-4">Inventory Value by Category</h3>
            <BarChart items={stockByCategory.slice(0, 8)} formatValue={formatMoney} />
          </div>
          <div className="ios-card p-6">
            <h3 className="mb-4">Stock Health</h3>
            <BarChart
              items={[
                { label: 'Healthy', value: healthy.length },
                { label: 'Low stock', value: summary.lowStock.length },
                { label: 'Out of stock', value: outOfStock.length },
              ]}
              formatValue={(v) => `${v} products`}
            />
          </div>
        </div>

        <div className="ios-card overflow-hidden">
          <div className="border-b border-black/[0.04] p-5 dark:border-white/[0.06]">
            <h3>Stock Risk Detail</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/[0.02] text-xs uppercase text-gray-500 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Reorder</th>
                  <th className="px-4 py-3 text-right">Cost Value</th>
                  <th className="px-4 py-3 text-right">Retail Value</th>
                  <th className="px-4 py-3 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {stockRisk.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right">{p.quantity}</td>
                    <td className="px-4 py-3 text-right">{p.reorder_level ?? 10}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(p.stockValue)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(p.retailValue)}</td>
                    <td className="px-4 py-3 text-right">{formatPercent(p.margin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="mb-3">All Products</h3>
          <InventoryTable products={summary.products} currency={currency} />
        </div>
      </div>
    </div>
  );
}
