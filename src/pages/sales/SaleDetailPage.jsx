import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSaleDetail } from '../../services/indexeddb/salesStore';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';

export default function SaleDetailPage() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const { currency } = useBusinessSettings();

  useEffect(() => {
    getSaleDetail(id).then(setSale);
  }, [id]);

  if (!sale) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/admin/sales" className="text-sm text-brand-600 hover:underline">← Back to sales</Link>
      <h2 className="mt-4">{sale.invoice_number}</h2>
      <p className="text-gray-500">{formatDate(sale.created_at)} · {sale.cashier_name} · {sale.payment_method}</p>
      <div className="mt-6 overflow-hidden rounded-xl border dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left">Product</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-800">
            {sale.items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3">{item.product_name}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.price, currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.subtotal, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(sale.subtotal, currency)}</span></div>
        {sale.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(sale.discount_amount, currency)}</span></div>}
        <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(sale.tax_amount, currency)}</span></div>
        <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{formatCurrency(sale.total, currency)}</span></div>
      </div>
    </div>
  );
}
