import { useEffect, useState } from 'react';
import { getSalesByDateRange } from '../../services/indexeddb/salesStore';
import { getSaleItems } from '../../services/indexeddb/salesStore';
import { getProductById } from '../../services/indexeddb/productsStore';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import Input from '../../components/ui/Input';
import ReportHeader from '../../components/analytics/ReportHeader';
import { BarChart, HourlyChart, MiniStat } from '../../components/analytics/ChartWidgets';
import { formatPercent, formatDate } from '../../utils/formatCurrency';

export default function DailySalesReport() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const { formatMoney } = useBusinessSettings();

  useEffect(() => {
    async function load() {
      const sales = await getSalesByDateRange(date, date);
      let revenue = 0;
      let profit = 0;
      let units = 0;
      const paymentStats = {};
      const productStats = {};
      const hourlySales = Array.from({ length: 24 }, (_, hour) => ({ hour, revenue: 0, count: 0 }));
      const rows = [];
      for (const sale of sales) {
        revenue += sale.total;
        paymentStats[sale.payment_method || 'cash'] = (paymentStats[sale.payment_method || 'cash'] || 0) + sale.total;
        hourlySales[new Date(sale.created_at).getHours()].revenue += sale.total;
        hourlySales[new Date(sale.created_at).getHours()].count += 1;
        const items = await getSaleItems(sale.id);
        let saleUnits = 0;
        for (const item of items) {
          const product = await getProductById(item.product_id);
          const itemProfit = product ? (item.price - product.cost_price) * item.quantity : 0;
          profit += itemProfit;
          units += item.quantity;
          saleUnits += item.quantity;
          const key = item.product_id;
          if (!productStats[key]) productStats[key] = { name: product?.name || item.product_name || 'Unknown', qty: 0, revenue: 0, profit: 0 };
          productStats[key].qty += item.quantity;
          productStats[key].revenue += item.subtotal;
          productStats[key].profit += itemProfit;
        }
        rows.push({ ...sale, units: saleUnits });
      }
      const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);
      const paymentBreakdown = Object.entries(paymentStats).map(([method, value]) => ({ label: method, value }));
      setReport({ revenue, profit, count: sales.length, units, paymentBreakdown, topProducts, hourlySales, rows });
    }
    load();
  }, [date]);

  const avgOrder = report?.count ? report.revenue / report.count : 0;
  const margin = report?.revenue ? (report.profit / report.revenue) * 100 : 0;

  return (
    <div>
      <ReportHeader title="Daily Sales Report" description="A detailed operating snapshot for one business day." />
      <div className="mb-6 max-w-xs">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MiniStat label="Revenue" value={formatMoney(report.revenue)} />
            <MiniStat label="Profit" value={formatMoney(report.profit)} accent="green" />
            <MiniStat label="Transactions" value={report.count} accent="violet" />
            <MiniStat label="Avg Order" value={formatMoney(avgOrder)} accent="amber" />
            <MiniStat label="Margin" value={formatPercent(margin)} accent="green" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="ios-card p-6">
              <h3 className="mb-4">Hourly Sales</h3>
              <HourlyChart data={report.hourlySales} formatValue={formatMoney} />
            </div>
            <div className="ios-card p-6">
              <h3 className="mb-4">Payment Mix</h3>
              <BarChart items={report.paymentBreakdown} formatValue={formatMoney} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="ios-card p-6">
              <h3 className="mb-4">Top Products Today</h3>
              <BarChart items={report.topProducts.slice(0, 8).map((p) => ({ label: p.name, value: p.revenue }))} formatValue={formatMoney} />
            </div>
            <div className="ios-card p-6">
              <h3 className="mb-4">Unit Movement</h3>
              <BarChart items={report.topProducts.slice(0, 8).map((p) => ({ label: p.name, value: p.qty }))} formatValue={(v) => `${v} units`} />
            </div>
          </div>

          <div className="ios-card overflow-hidden">
            <div className="border-b border-black/[0.04] p-5 dark:border-white/[0.06]">
              <h3>Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/[0.02] text-xs uppercase text-gray-500 dark:bg-white/[0.03]">
                  <tr>
                    <th className="px-4 py-3 text-left">Invoice</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-4 py-3 text-right">Payment</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {report.rows.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-3 font-medium">{sale.invoice_number}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(sale.created_at)}</td>
                      <td className="px-4 py-3 text-right">{sale.units}</td>
                      <td className="px-4 py-3 text-right capitalize">{sale.payment_method}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatMoney(sale.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
