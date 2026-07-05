import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';

export default function ReceiptModal({ open, onClose, sale, items, settings }) {
  if (!sale) return null;

  const currency = settings?.currency || 'USD';
  const businessName = settings?.business_name || 'Retailer';

  const handlePrint = () => window.print();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Purchase Receipt"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>Print Receipt</Button>
        </>
      }
    >
      <div className="receipt-print mx-auto max-w-2xl overflow-hidden rounded-2xl border border-black/[0.06] bg-white text-sm shadow-ios dark:border-white/[0.08] dark:bg-surface-dark">
        <div className="bg-gray-950 px-6 py-5 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-white/55">Receipt</p>
              <h3 className="mt-1 text-xl font-bold text-white">{businessName}</h3>
            </div>
            <div className="text-right text-xs text-white/70">
              <p className="font-semibold text-white">{sale.invoice_number}</p>
              <p>{formatDate(sale.created_at)}</p>
              <p className="capitalize">{sale.payment_method} payment</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-black/[0.06] pb-2 text-xs font-semibold uppercase text-gray-400 dark:border-white/[0.08]">
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Total</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-3 py-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.product_name || item.name}</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.price, currency)} each</p>
                </div>
                <span className="text-right font-medium text-gray-600 dark:text-gray-300">{item.quantity}</span>
                <span className="text-right font-bold">{formatCurrency(item.subtotal, currency)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 border-t border-dashed border-gray-300 bg-black/[0.02] px-6 py-5 dark:border-gray-700 dark:bg-white/[0.03]">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(sale.subtotal, currency)}</span></div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount ({sale.discount}%)</span><span>-{formatCurrency(sale.discount_amount, currency)}</span></div>
          )}
          <div className="flex justify-between"><span>Tax ({sale.tax_rate}%)</span><span>{formatCurrency(sale.tax_amount, currency)}</span></div>
          <div className="flex justify-between border-t border-black/[0.06] pt-3 text-lg font-bold dark:border-white/[0.08]"><span>Total paid</span><span>{formatCurrency(sale.total, currency)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Cashier</span><span>{sale.cashier_name || 'Staff'}</span></div>
        </div>
        {settings?.receipt_footer && (
          <p className="border-t border-dashed border-gray-300 px-6 py-4 text-center text-xs text-gray-500 dark:border-gray-700">
            {settings.receipt_footer}
          </p>
        )}
      </div>
      <div className="hidden">
        <div className="border-b border-dashed border-gray-300 pb-4 text-center dark:border-gray-600">
          <h3 className="text-lg font-bold">{businessName}</h3>
          <p className="text-gray-500">{sale.invoice_number}</p>
          <p className="text-gray-500">{formatDate(sale.created_at)}</p>
        </div>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>{item.product_name || item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.subtotal, currency)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t border-dashed border-gray-300 pt-3 dark:border-gray-600">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(sale.subtotal, currency)}</span></div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-green-600"><span>Discount ({sale.discount}%)</span><span>-{formatCurrency(sale.discount_amount, currency)}</span></div>
          )}
          <div className="flex justify-between"><span>Tax ({sale.tax_rate}%)</span><span>{formatCurrency(sale.tax_amount, currency)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span>{formatCurrency(sale.total, currency)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Payment</span><span className="capitalize">{sale.payment_method}</span></div>
        </div>
        {settings?.receipt_footer && (
          <p className="border-t border-dashed border-gray-300 pt-3 text-center text-xs text-gray-500 dark:border-gray-600">
            {settings.receipt_footer}
          </p>
        )}
      </div>
    </Modal>
  );
}
