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
  const [cartOpen, setCartOpen] = useState(false);
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
      setCartOpen(false);
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
    <div className="relative min-h-[calc(100dvh-3.75rem)] bg-surface-secondary dark:bg-black">
      {cartOpen && <button type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden" />}
      <div className="grid min-h-[calc(100dvh-3.75rem)] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_25rem]">
      <section className="flex min-w-0 flex-col pb-24 lg:pb-0">
        <div className="border-b border-black/[0.04] bg-white/75 p-4 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/75">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase text-gray-400">Sales terminal</p><h2 className="mt-1">Point of Sale</h2></div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700">{inStock.length} in stock</span>
          </div>
          <label className="block">
            <span className="sr-only">Search products or scan barcode</span>
            <input ref={searchRef} type="text" inputMode="search" autoComplete="off" placeholder="Search products or scan barcode..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleBarcodeScan} className="w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3.5 text-base font-medium shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.1] dark:bg-white/[0.04]" />
          </label>
        </div>
        <ProductCardGrid className="flex-1 auto-rows-max overflow-auto p-3 pb-24 sm:p-4 sm:pb-24 lg:pb-4">
          {inStock.map((p) => <ProductCard key={p.id} product={p} price={formatMoney(p.selling_price)} onClick={() => cart.addItem(p)} />)}
          {inStock.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-black/10 px-5 py-12 text-center dark:border-white/10"><p className="font-semibold text-gray-700 dark:text-gray-200">{query ? "No matching products" : "No products available"}</p><p className="mt-1 text-sm text-gray-500">{query ? "Try another name, SKU or barcode." : "Products with available stock will appear here."}</p></div>}
        </ProductCardGrid>
      </section>

      <aside className={`${cartOpen ? "flex" : "hidden"} fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] min-h-[min(28rem,85dvh)] flex-col overflow-hidden rounded-t-3xl border border-black/[0.08] bg-white shadow-2xl dark:border-white/[0.1] dark:bg-surface-dark lg:sticky lg:top-[3.75rem] lg:flex lg:h-[calc(100dvh-3.75rem)] lg:min-h-0 lg:max-h-none lg:rounded-none lg:rounded-l-2xl lg:border-y-0 lg:border-r-0 lg:border-l lg:shadow-none">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-4 dark:border-white/[0.08] sm:px-5">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current sale</p><h3 className="mt-1">Cart <span className="text-sm font-medium text-gray-500">({cart.itemCount})</span></h3></div>
          <button type="button" aria-label="Close cart" onClick={() => setCartOpen(false)} className="rounded-full px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-gray-300 dark:hover:bg-white/[0.08] lg:hidden">Close</button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {cart.items.length === 0 ? <p className="py-8 text-center text-sm text-gray-500">Cart is empty</p> : <div className="space-y-3">{cart.items.map((item) => <div key={item.product_id || item.id} className="rounded-2xl border border-black/[0.04] p-3.5 dark:border-white/[0.06]"><div className="flex justify-between"><span className="text-sm font-semibold">{item.name}</span><button type="button" aria-label={`Remove ${item.name}`} onClick={() => cart.removeItem(item.product_id || item.id)} className="min-h-9 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400 dark:hover:bg-red-500/10">Remove</button></div><div className="mt-3 flex items-center justify-between"><div className="flex items-center gap-2"><button type="button" aria-label={`Decrease quantity of ${item.name}`} onClick={() => cart.updateQuantity(item.product_id || item.id, item.quantity - 1)} className="h-9 w-9 rounded-xl bg-black/[0.05] text-lg hover:bg-black/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]">−</button><span className="min-w-5 text-center text-sm font-semibold tabular-nums">{item.quantity}</span><button type="button" aria-label={`Increase quantity of ${item.name}`} onClick={() => cart.updateQuantity(item.product_id || item.id, item.quantity + 1)} className="h-9 w-9 rounded-xl bg-black/[0.05] text-lg hover:bg-black/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]">+</button></div><b>{formatMoney((item.price ?? item.selling_price) * item.quantity)}</b></div></div>)}</div>}
        </div>
        <div className="shrink-0 space-y-4 border-t border-black/[0.06] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/[0.08] sm:p-4">
          <div className="flex items-center gap-3"><label htmlFor="sale-discount" className="text-xs font-semibold uppercase tracking-wide text-gray-500">Discount</label><input id="sale-discount" type="number" min="0" max="100" step="1" value={cart.discount} onChange={(e) => cart.setDiscount(e.target.value)} className="w-20 rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-sm tabular-nums focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.12] dark:bg-white/[0.04]" /><span className="text-xs text-gray-400">%</span></div>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(cart.subtotal)}</span></div>{cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatMoney(cart.discountAmount)}</span></div>}<div className="flex justify-between"><span>Tax ({taxRate}%)</span><span>{formatMoney(taxAmount)}</span></div><div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{formatMoney(total)}</span></div></div>
          <div className="flex gap-2" role="group" aria-label="Payment method">{['cash','card','mobile'].map((m) => <button key={m} type="button" aria-pressed={paymentMethod === m} onClick={() => setPaymentMethod(m)} className={`min-h-10 flex-1 rounded-xl py-2.5 text-xs font-semibold capitalize transition ${paymentMethod === m ? 'bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/35 dark:text-brand-300' : 'bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300'}`}>{m === 'mobile' ? 'Mobile money' : m}</button>)}</div>
          <Button className="w-full" size="lg" onClick={handleCheckout} disabled={!cart.items.length || checkingOut}>{checkingOut ? 'Processing...' : `Checkout ${formatMoney(total)}`}</Button>
        </div>
      </aside>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/[0.08] bg-white/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-surface-dark/95 lg:hidden">
        <Button className="w-full justify-between" size="lg" onClick={() => setCartOpen(true)} aria-expanded={cartOpen}>
          <span>Review cart <span className="font-medium opacity-80">({cart.itemCount})</span></span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </Button>
      </div>
      <ReceiptModal open={!!receipt} onClose={() => setReceipt(null)} sale={receipt?.sale} items={receipt?.items} settings={settings} />
    </div>
  );
}
