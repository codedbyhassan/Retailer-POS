import { useEffect, useMemo, useRef, useState } from 'react';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { getProducts } from '../../services/indexeddb/productsStore';
import { createSale } from '../../services/indexeddb/salesStore';
import Button from '../../components/ui/Button';

const money = (value, formatMoney) => formatMoney(Number(value || 0));

export default function POSPage() {
  const { formatMoney } = useBusinessSettings();
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [notice, setNotice] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    getProducts().then(setProducts);
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '/' && document.activeElement !== searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === 'Escape') searchRef.current?.blur();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 24);
    return products.filter((p) => [p.name, p.sku, p.barcode].some((v) => String(v || '').toLowerCase().includes(q))).slice(0, 24);
  }, [products, query]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Math.max(0, Number(discount) || 0);
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * ((Number(tax) || 0) / 100);
  const total = taxable + taxAmount;

  const addToCart = (product) => {
    if (Number(product.stock ?? product.quantity ?? 0) <= 0) {
      setNotice(`${product.name} is out of stock`);
      return;
    }
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) return current.map((item) => item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock ?? product.quantity)) } : item);
      return [...current, { productId: product.id, name: product.name, price: Number(product.price || product.selling_price || 0), quantity: 1, stock: Number(product.stock ?? product.quantity ?? 0) }];
    });
    setNotice('');
  };

  const updateQuantity = (productId, delta) => setCart((current) => current.flatMap((item) => {
    if (item.productId !== productId) return [item];
    const quantity = Math.min(item.stock, item.quantity + delta);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  }));

  const completeSale = async () => {
    if (!cart.length) return setNotice('Add at least one product to start the sale.');
    try {
      await createSale({ items: cart, subtotal, discount: discountAmount, tax: taxAmount, total, paymentMethod: payment });
      setCart([]);
      setDiscount(0);
      setNotice(`Sale completed · ${money(total, formatMoney)}`);
    } catch (error) {
      setNotice(error.message || 'Unable to complete sale.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Sales terminal</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">New sale</h1>
        </div>
        <div className="hidden rounded-full border border-black/[0.06] bg-white px-3 py-1.5 text-xs font-medium text-gray-500 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.04] sm:block">Press <kbd className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/10">/</kbd> to search</div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-surface-dark sm:p-5">
          <div className="sticky top-2 z-10 mb-5">
            <div className="relative">
              <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by product, SKU or scan barcode…" className="h-12 w-full rounded-xl border border-black/[0.08] bg-gray-50 px-4 pr-20 text-sm font-medium outline-none transition focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-white/[0.1] dark:bg-white/[0.05] dark:focus:bg-white/[0.07]" autoComplete="off" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-black/[0.06] bg-white px-2 py-1 text-[10px] font-semibold text-gray-400 dark:border-white/[0.08] dark:bg-white/[0.06]">SCAN</span>
            </div>
          </div>

          {notice && <div className="mb-4 rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3 text-sm font-medium text-brand-700 dark:text-brand-300">{notice}</div>}

          {filtered.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {filtered.map((product) => {
                const stock = Number(product.stock ?? product.quantity ?? 0);
                return (
                  <button key={product.id} type="button" onClick={() => addToCart(product)} className="group min-h-[126px] rounded-xl border border-black/[0.06] bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-md active:translate-y-0 dark:border-white/[0.08] dark:bg-white/[0.03]">
                    <div className="flex h-12 items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-sm font-bold text-brand-700 dark:text-brand-300">{product.name?.slice(0, 1)?.toUpperCase() || 'P'}</div>
                      <span className={`text-[10px] font-semibold ${stock <= 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-600' : 'text-gray-400'}`}>{stock <= 0 ? 'Out' : `${stock} in stock`}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{product.name}</p>
                    <p className="mt-1 text-sm font-bold text-brand-700 dark:text-brand-300">{money(product.price || product.selling_price, formatMoney)}</p>
                  </button>
                );
              })}
            </div>
          ) : <div className="flex min-h-72 items-center justify-center rounded-xl border border-dashed border-black/[0.1] text-sm text-gray-400 dark:border-white/[0.1]">No products match your search.</div>}
        </section>

        <aside className="flex min-h-[600px] flex-col rounded-2xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-surface-dark">
          <div className="border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.08]"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Current sale</p><h2 className="mt-1 font-bold text-gray-900 dark:text-white">Cart</h2></div><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:bg-white/[0.07]">{cart.reduce((n, i) => n + i.quantity, 0)} items</span></div></div>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length ? cart.map((item) => (
              <div key={item.productId} className="border-b border-black/[0.05] py-3 first:pt-0 last:border-0 dark:border-white/[0.07]">
                <div className="flex justify-between gap-3"><p className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">{item.name}</p><p className="text-sm font-bold">{money(item.price * item.quantity, formatMoney)}</p></div>
                <div className="mt-2 flex items-center justify-between"><div className="flex items-center rounded-lg border border-black/[0.08] dark:border-white/[0.1]"><button className="px-2.5 py-1 text-gray-500" onClick={() => updateQuantity(item.productId, -1)}>−</button><span className="min-w-7 text-center text-xs font-bold">{item.quantity}</span><button className="px-2.5 py-1 text-gray-500" onClick={() => updateQuantity(item.productId, 1)}>+</button></div><span className="text-xs text-gray-400">{money(item.price, formatMoney)} each</span></div>
              </div>
            )) : <div className="flex h-64 items-center justify-center text-center"><div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-lg dark:bg-white/[0.06]">＋</div><p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-200">Cart is empty</p><p className="mt-1 text-xs text-gray-400">Scan or select a product to begin.</p></div></div>}
          </div>

          <div className="border-t border-black/[0.06] p-5 dark:border-white/[0.08]">
            <div className="grid grid-cols-2 gap-2 mb-4"><input aria-label="Discount" type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Discount" className="h-9 rounded-lg border border-black/[0.08] bg-gray-50 px-3 text-xs outline-none dark:border-white/[0.1] dark:bg-white/[0.04]" /><input aria-label="Tax percentage" type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} placeholder="Tax %" className="h-9 rounded-lg border border-black/[0.08] bg-gray-50 px-3 text-xs outline-none dark:border-white/[0.1] dark:bg-white/[0.04]" /></div>
            <div className="space-y-2 text-sm"><div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{money(subtotal, formatMoney)}</span></div><div className="flex justify-between text-gray-500"><span>Discount</span><span>− {money(discountAmount, formatMoney)}</span></div><div className="flex justify-between text-gray-500"><span>Tax</span><span>{money(taxAmount, formatMoney)}</span></div></div>
            <div className="my-4 flex items-end justify-between border-t border-black/[0.06] pt-4 dark:border-white/[0.08]"><span className="text-sm font-semibold text-gray-500">Total</span><span className="text-3xl font-black tracking-tight text-gray-950 dark:text-white">{money(total, formatMoney)}</span></div>
            <div className="grid grid-cols-3 gap-2 mb-3">{['cash', 'momo', 'card'].map((method) => <button key={method} onClick={() => setPayment(method)} className={`rounded-lg border py-2.5 text-xs font-bold uppercase tracking-wide transition ${payment === method ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'border-black/[0.08] text-gray-500 hover:bg-gray-50 dark:border-white/[0.1] dark:hover:bg-white/[0.05]'}`}>{method === 'momo' ? 'MoMo' : method}</button>)}</div>
            <Button className="h-12 w-full rounded-xl text-sm font-bold" size="lg" onClick={completeSale} disabled={!cart.length}>Complete sale · {money(total, formatMoney)}</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
