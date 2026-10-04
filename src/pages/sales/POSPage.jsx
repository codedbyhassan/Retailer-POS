import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { searchProducts } from '../../services/online/productService';
import { createSale } from '../../services/online/salesService';
import { generateInvoiceNumber } from '../../utils/generateInvoiceNumber';
import ReceiptModal from '../../components/modals/ReceiptModal';
import Button from '../../components/ui/Button';
import ProductCard, { ProductCardGrid } from '../../components/products/ProductCard';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';

const uuid = () => crypto.randomUUID();

export default function POSPage() {
  const { user } = useAuth();
  const cart = useCart();
  const { settings, taxRate, formatMoney } = useBusinessSettings();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receipt, setReceipt] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const searchRef = useRef(null);
  const toast = useToast();

  const loadProducts = async (value = query) => {
    try { setProducts(await searchProducts(value)); }
    catch (error) { toast.error(error.message); }
  };

  useEffect(() => { searchRef.current?.focus(); loadProducts(''); }, []);
  useEffect(() => { const timer = setTimeout(() => loadProducts(query), 150); return () => clearTimeout(timer); }, [query]);

  const taxAmount = cart.afterDiscount * (taxRate / 100);
  const total = cart.afterDiscount + taxAmount;

  const handleBarcodeScan = (e) => {
    if (e.key !== 'Enter' || !query.trim()) return;
    const match = products.find((p) => p.barcode === query.trim());
    if (!match) { toast.warning('Product not found'); return; }
    if (match.quantity <= 0) { toast.warning('Product is out of stock'); return; }
    cart.addItem(match);
    setQuery('');
  };

  const handleCheckout = async () => {
    if (!cart.items.length || checkingOut || !user?.id) return;
    setCheckingOut(true);
    try {
      const saleId = uuid();
      const sale = {
        id: saleId,
        invoice_number: generateInvoiceNumber(),
        cashier_id: user.id,
        subtotal: cart.subtotal,
        discount: cart.discount,
        discount_amount: cart.discountAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };
      const items = cart.items.map((item) => ({
        id: uuid(),
        sale_id: saleId,
        product_id: item.product_id || item.id,
        quantity: item.quantity,
        price: item.price ?? item.selling_price,
        subtotal: (item.price ?? item.selling_price) * item.quantity,
      }));

      await createSale({ sale, items });
      setReceipt({ sale, items: cart.items.map((item, index) => ({ ...items[index], product_name: item.name, cost_price: item.cost_price })) });
      cart.clearCart();
      await loadProducts('');
      toast.success('Sale completed');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const inStock = products.filter((p) => p.quantity > 0);

  return (
    <div className="grid min-h-[calc(100vh-3.75rem)] bg-surface-secondary dark:bg-black lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col border-r border-black/[0.04] dark:border-white/[0.06]">
        <div className="border-b border-black/[0.04] bg-white/75 p-4 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/75">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase text-gray-400">Sales terminal</p><h2 className="mt-1">Point of Sale</h2></div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">{inStock.length} in stock</span>
          </div>
          <input ref={searchRef} type="text" placeholder="Search products or scan barcode..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleBarcodeScan} className="w-full rounded-2xl border border-black/[0.06] bg-white px-5 py-3.5 text-base font-medium shadow-ios focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-white/[0.08] dark:bg-white/[0.04]" />
        </div>
        <ProductCardGrid className="flex-1 auto-rows-max overflow-auto p-4">
          {inStock.map((p) => <ProductCard key={p.id} product={p} price={formatMoney(p.selling_price)} onClick={() => cart.addItem(p)} />)}
          {inStock.length === 0 && <div className="col-span-full py-16 text-center text-sm text-gray-500">No products found</div>}
        </ProductCardGrid>
      </div>

      <div className="flex min-h-[32rem] flex-col bg-white/90 backdrop-blur-ios dark:bg-surface-dark/90">
        <div className="border-b border-black/[0.04] px-5 py-4 dark:border-white/[0.06]"><p className="text-xs font-semibold uppercase text-gray-400">Current sale</p><h3>Cart · {cart.itemCount} items</h3></div>
        <div className="flex-1 overflow-auto p-4">
          {cart.items.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Cart is empty</p> : <div className="space-y-3">{cart.items.map((item) => <div key={item.product_id || item.id} className="rounded-2xl border border-black/[0.04] p-3.5 dark:border-white/[0.06]"><div className="flex justify-between"><span className="text-sm font-semibold">{item.name}</span><button type="button" onClick={() => cart.removeItem(item.product_id || item.id)} className="text-red-500">Remove</button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button type="button" onClick={() => cart.updateQuantity(item.product_id || item.id, item.quantity - 1)} className="h-8 w-8 rounded-xl bg-black/[0.05]">−</button><span>{item.quantity}</span><button type="button" onClick={() => cart.updateQuantity(item.product_id || item.id, item.quantity + 1)} className="h-8 w-8 rounded-xl bg-black/[0.05]">+</button></div><b>{formatMoney((item.price ?? item.selling_price) * item.quantity)}</b></div></div>)}</div>}
        </div>
        <div className="space-y-4 border-t border-black/[0.04] p-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3"><label className="text-xs font-semibold uppercase text-gray-500">Discount</label><input type="number" min="0" max="100" value={cart.discount} onChange={(e) => cart.setDiscount(e.target.value)} className="w-16 rounded-xl border px-2 py-1.5" /><span className="text-xs text-gray-400">%</span></div>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(cart.subtotal)}</span></div>{cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatMoney(cart.discountAmount)}</span></div>}<div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatMoney(taxAmount)}</span></div><div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{formatMoney(total)}</span></div></div>
          <div className="flex gap-2">{['cash','card','mobile'].map((m) => <button key={m} type="button" onClick={() => setPaymentMethod(m)} className={`flex-1 rounded-2xl py-2.5 text-xs font-semibold capitalize ${paymentMethod === m ? 'bg-brand-500/10 text-brand-700 ring-2 ring-brand-500/30' : 'bg-black/[0.04] text-gray-600'}`}>{m}</button>)}</div>
          <Button className="w-full" size="lg" onClick={handleCheckout} disabled={!cart.items.length || checkingOut}>{checkingOut ? 'Processing...' : `Checkout ${formatMoney(total)}`}</Button>
        </div>
      </div>
      <ReceiptModal open={!!receipt} onClose={() => setReceipt(null)} sale={receipt?.sale} items={receipt?.items} settings={settings} />
    </div>
  );
}
