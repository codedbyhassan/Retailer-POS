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
  const [mobileView, setMobileView] = useState('products');
  const searchRef = useRef(null);
  const toast = useToast();

  const loadProducts = async (value = query) => {
    try {
      setProducts(await searchProducts(value));
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    searchRef.current?.focus();
    loadProducts('');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const taxAmount = cart.afterDiscount * (taxRate / 100);
  const total = cart.afterDiscount + taxAmount;

  const handleBarcodeScan = (event) => {
    if (event.key !== 'Enter' || !query.trim()) return;
    const match = products.find((product) => product.barcode === query.trim());
    if (!match) {
      toast.warning('Product not found');
      return;
    }
    if (match.quantity <= 0) {
      toast.warning('Product is out of stock');
      return;
    }
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
      setReceipt({
        sale,
        items: cart.items.map((item, index) => ({
          ...items[index],
          product_name: item.name,
          cost_price: item.cost_price,
        })),
      });
      cart.clearCart();
      await loadProducts('');
      toast.success('Sale completed');
      setMobileView('products');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const inStock = products.filter((product) => product.quantity > 0);

  return (
    <div className="grid h-[calc(100dvh-3.75rem)] min-h-0 grid-cols-1 overflow-hidden bg-surface-secondary dark:bg-black md:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.9fr)] lg:grid-cols-[minmax(0,1fr)_24rem]">
      <section
        aria-label="Product catalogue"
        className={`${mobileView === 'products' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col border-r border-black/[0.04] dark:border-white/[0.06] md:flex`}
      >
        <div className="shrink-0 border-b border-black/[0.04] bg-white/75 p-3 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/75 sm:p-4">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Sales terminal</p>
              <h2 className="mt-1 text-xl sm:text-2xl">Point of Sale</h2>
            </div>
            <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {inStock.length} in stock
            </span>
          </div>
          <label className="sr-only" htmlFor="pos-product-search">Search products or scan barcode</label>
          <input
            id="pos-product-search"
            ref={searchRef}
            type="text"
            autoComplete="off"
            placeholder="Search products or scan barcode..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleBarcodeScan}
            className="min-h-12 w-full rounded-2xl border border-black/[0.08] bg-white px-4 py-3 text-base font-medium shadow-ios outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.1] dark:bg-white/[0.04] sm:px-5"
          />
        </div>

        <ProductCardGrid className="min-h-0 flex-1 content-start overflow-y-auto overscroll-contain p-3 sm:p-4">
          {inStock.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              price={formatMoney(product.selling_price)}
              onClick={() => cart.addItem(product)}
            />
          ))}
          {inStock.length === 0 && (
            <div className="col-span-full mx-auto flex max-w-sm flex-col items-center justify-center py-12 text-center sm:py-16">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {query.trim() ? 'No matching in-stock products' : 'No products in stock'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {query.trim()
                  ? 'Check the product name or barcode and try again.'
                  : 'Products will appear here when stock is available.'}
              </p>
            </div>
          )}
        </ProductCardGrid>

        <div className="shrink-0 border-t border-black/[0.06] bg-white/95 p-3 backdrop-blur-ios dark:border-white/[0.08] dark:bg-surface-dark/95 md:hidden">
          <button
            type="button"
            onClick={() => setMobileView('cart')}
            className="flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl bg-brand-600 px-4 py-3 text-left text-white shadow-ios transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Review cart · {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}</span>
              <span className="block text-xs text-white/80">Check items and payment</span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums">{formatMoney(total)}</span>
          </button>
        </div>
      </section>

      <section
        aria-label="Current sale"
        className={`${mobileView === 'cart' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col bg-white/95 backdrop-blur-ios dark:bg-surface-dark/95 md:flex`}
      >
        <div className="shrink-0 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.08] sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Current sale</p>
              <h3 className="mt-1 text-lg sm:text-xl">Cart · {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}</h3>
            </div>
            <button
              type="button"
              onClick={() => setMobileView('products')}
              className="min-h-10 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300 md:hidden"
            >
              Browse products
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {cart.items.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Cart is empty</p>
              <p className="mt-1 max-w-xs text-sm text-gray-500">Add products from the catalogue to start a sale.</p>
              <button
                type="button"
                onClick={() => setMobileView('products')}
                className="mt-3 min-h-10 rounded-xl px-3 text-sm font-semibold text-brand-700 hover:bg-brand-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-brand-300 md:hidden"
              >
                Browse products
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              {cart.items.map((item) => {
                const itemId = item.product_id || item.id;
                const unitPrice = item.price ?? item.selling_price;

                return (
                  <div key={itemId} className="rounded-2xl border border-black/[0.06] p-3 dark:border-white/[0.08] sm:p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 break-words text-sm font-semibold">{item.name}</span>
                      <button
                        type="button"
                        onClick={() => cart.removeItem(itemId)}
                        className="min-h-9 shrink-0 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => cart.updateQuantity(itemId, item.quantity - 1)}
                          className="h-10 w-10 rounded-xl bg-black/[0.05] text-lg font-medium hover:bg-black/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => cart.updateQuantity(itemId, item.quantity + 1)}
                          className="h-10 w-10 rounded-xl bg-black/[0.05] text-lg font-medium hover:bg-black/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <b className="shrink-0 text-sm tabular-nums">{formatMoney(unitPrice * item.quantity)}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-black/[0.06] bg-white/80 p-3 dark:border-white/[0.08] dark:bg-surface-dark/80 sm:space-y-4 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="pos-discount" className="text-sm font-medium text-gray-600 dark:text-gray-300">Discount</label>
            <div className="flex items-center gap-2">
              <input
                id="pos-discount"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                value={cart.discount}
                onChange={(event) => cart.setDiscount(event.target.value)}
                className="min-h-10 w-20 rounded-xl border border-black/[0.1] bg-white px-3 text-right text-sm tabular-nums outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/[0.1] dark:bg-white/[0.04]"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
              <span>Subtotal</span><span className="tabular-nums">{formatMoney(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between gap-4 text-emerald-700 dark:text-emerald-400">
                <span>Discount</span><span className="tabular-nums">−{formatMoney(cart.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 text-gray-600 dark:text-gray-300">
              <span>Tax ({taxRate}%)</span><span className="tabular-nums">{formatMoney(taxAmount)}</span>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-black/[0.08] pt-2 text-base font-bold dark:border-white/[0.1]">
              <span>Total</span><span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2" aria-label="Payment method">
            {['cash', 'card', 'mobile'].map((method) => (
              <button
                key={method}
                type="button"
                aria-pressed={paymentMethod === method}
                onClick={() => setPaymentMethod(method)}
                className={`min-h-11 rounded-xl px-2 py-2.5 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${paymentMethod === method
                  ? 'bg-brand-500/10 text-brand-700 ring-1 ring-brand-500/40 dark:text-brand-300'
                  : 'bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.1]'}`}
              >
                {method}
              </button>
            ))}
          </div>

          <Button className="min-h-12 w-full" size="lg" onClick={handleCheckout} disabled={!cart.items.length || checkingOut}>
            {checkingOut ? 'Processing sale…' : `Checkout · ${formatMoney(total)}`}
          </Button>
        </div>
      </section>

      <ReceiptModal open={!!receipt} onClose={() => setReceipt(null)} sale={receipt?.sale} items={receipt?.items} settings={settings} />
    </div>
  );
}
