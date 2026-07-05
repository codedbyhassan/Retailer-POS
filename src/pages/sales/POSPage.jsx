import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { searchProducts } from '../../services/indexeddb/productsStore';
import { createSale } from '../../services/indexeddb/salesStore';
import { addToSyncQueue } from '../../services/sync/syncQueue';
import { generateInvoiceNumber, generateId } from '../../utils/generateInvoiceNumber';
import ReceiptModal from '../../components/modals/ReceiptModal';
import Button from '../../components/ui/Button';
import ProductCard, { ProductCardGrid } from '../../components/products/ProductCard';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { useToast } from '../../components/ui/Toast';
import { barcodeLookup } from '../../services/api/barcodeLookup';

export default function POSPage() {
  const { user } = useAuth();
  const cart = useCart();
  const { settings, taxRate, formatMoney } = useBusinessSettings();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receipt, setReceipt] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [lookingUpBarcode, setLookingUpBarcode] = useState(false);
  const searchRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    searchProducts(query).then(setProducts);
  }, [query]);

  const taxAmount = cart.afterDiscount * (taxRate / 100);
  const total = cart.afterDiscount + taxAmount;

  const handleBarcodeSearch = async () => {
    if (!query.trim()) return;
    
    // First try local search
    const localMatch = products.find((p) => p.barcode === query.trim());
    if (localMatch && localMatch.quantity > 0) {
      cart.addItem(localMatch);
      setQuery('');
      toast.success(`Added ${localMatch.name}`);
      return;
    }

    // If not found locally, try API lookup
    if (products.length > 0) {
      setLookingUpBarcode(true);
      try {
        const result = await barcodeLookup.lookup(query.trim());
        if (result.found) {
          toast.info(`Product not in inventory: ${result.name}`);
        } else {
          toast.warning('Barcode not found in database');
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLookingUpBarcode(false);
      }
    }
  };

  const handleBarcodeScan = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      handleBarcodeSearch();
    }
  };

  const handleCheckout = async () => {
    if (!cart.items.length || checkingOut) return;
    setCheckingOut(true);
    try {
      const invoiceNumber = generateInvoiceNumber();
      const saleId = generateId('sale');
      const idempotencyKey = cart.generateTransactionKey();

      const sale = {
        id: saleId,
        invoice_number: invoiceNumber,
        cashier_id: user.id,
        cashier_name: user.name,
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
        id: generateId('item'),
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        product_name: item.name,
      }));

      await createSale({ sale, items });
      await addToSyncQueue('CREATE_SALE', { sale, items, idempotencyKey });

      setReceipt({ sale, items });
      cart.clearCart();
      toast.success('Sale completed!');
      searchProducts('').then(setProducts);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const inStock = products.filter((p) => p.quantity > 0);

  return (
    <div className="grid min-h-[calc(100vh-3.75rem)] bg-surface-secondary dark:bg-black lg:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col border-r border-black/[0.04] dark:border-white/[0.06]">
        <div className="border-b border-black/[0.04] bg-white/75 p-4 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/75">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Sales terminal</p>
              <h2 className="mt-1">Point of Sale</h2>
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-emerald-700 dark:text-emerald-300">{inStock.length} in stock</span>
              <span className="rounded-full bg-brand-500/10 px-3 py-1.5 text-brand-700 dark:text-brand-300">{cart.itemCount} cart items</span>
            </div>
          </div>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products or scan barcode..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleBarcodeScan}
            className="w-full rounded-2xl border border-black/[0.06] bg-white px-5 py-3.5 text-base font-medium shadow-ios transition-all duration-200 ease-ios placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:border-white/[0.08] dark:bg-white/[0.04] dark:placeholder:text-gray-500"
          />
        </div>
        <ProductCardGrid className="flex-1 auto-rows-max overflow-auto p-4">
          {inStock.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              price={formatMoney(p.selling_price)}
              onClick={() => cart.addItem(p)}
            />
          ))}
          {inStock.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-gray-500">No products found</div>
          )}
        </ProductCardGrid>
      </div>

      <div className="flex min-h-[32rem] flex-col bg-white/90 backdrop-blur-ios dark:bg-surface-dark/90">
        <div className="border-b border-black/[0.04] px-5 py-4 text-[0px] [&>h3]:hidden dark:border-white/[0.06]">
          <div className="flex items-center justify-between gap-3 text-base">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400">Current sale</p>
              <h3>Cart</h3>
            </div>
            <span className="rounded-full bg-black/[0.04] px-3 py-1.5 text-xs font-semibold text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">{cart.itemCount} items</span>
          </div>
          <h3>Cart · {cart.itemCount} items</h3>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {cart.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Cart is empty</p>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.product_id} className="rounded-2xl border border-black/[0.04] bg-black/[0.02] p-3.5 dark:border-white/[0.06] dark:bg-white/[0.03]">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <button type="button" onClick={() => cart.removeItem(item.product_id)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-500 transition-all active:scale-90">✕</button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.05] text-sm font-bold transition-all active:scale-90 dark:bg-white/[0.08]">−</button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">{item.quantity}</span>
                      <button type="button" onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.05] text-sm font-bold transition-all active:scale-90 dark:bg-white/[0.08]">+</button>
                    </div>
                    <span className="text-sm font-bold">{formatMoney(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4 border-t border-black/[0.04] p-4 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Discount</label>
            <input
              type="number"
              min="0"
              max="100"
              value={cart.discount}
              onChange={(e) => cart.setDiscount(Number(e.target.value))}
              className="w-16 rounded-xl border border-black/[0.06] bg-black/[0.02] px-2 py-1.5 text-sm font-semibold dark:border-white/[0.08] dark:bg-white/[0.04]"
            />
            <span className="text-xs text-gray-400">%</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Subtotal</span><span className="font-medium text-gray-900 dark:text-white">{formatMoney(cart.subtotal)}</span></div>
            {cart.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatMoney(cart.discountAmount)}</span></div>}
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Tax ({taxRate}%)</span><span className="font-medium text-gray-900 dark:text-white">{formatMoney(taxAmount)}</span></div>
            <div className="flex justify-between border-t border-black/[0.04] pt-2 text-base font-bold dark:border-white/[0.06]"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
          <div className="flex gap-2">
            {['cash', 'card', 'mobile'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 rounded-2xl py-2.5 text-xs font-semibold capitalize transition-all duration-200 ease-ios active:scale-[0.97] ${
                  paymentMethod === m
                    ? 'bg-brand-500/10 text-brand-700 ring-2 ring-brand-500/30 dark:bg-brand-500/15 dark:text-brand-300'
                    : 'bg-black/[0.04] text-gray-600 hover:bg-black/[0.07] dark:bg-white/[0.06] dark:text-gray-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Button className="w-full" size="lg" onClick={handleCheckout} disabled={!cart.items.length || checkingOut}>
            {checkingOut ? 'Processing...' : `Checkout ${formatMoney(total)}`}
          </Button>
        </div>
      </div>

      <ReceiptModal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        sale={receipt?.sale}
        items={receipt?.items}
        settings={settings}
      />
    </div>
  );
}
