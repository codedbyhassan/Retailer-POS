import React, { useState, useEffect, useRef, useMemo } from 'react';
import { localDb } from '../services/indexeddb/db';
import { Product, Sale } from '../types';
import { useCart } from '../hooks/useCart';
import { syncEngine } from '../services/sync/syncEngine';
import { useToast } from '../hooks/useToast';
import { 
  Search, ShoppingCart, Percent, User, Printer, Trash2, 
  Plus, Minus, Tag, Landmark, ShieldAlert, CreditCard, 
  Menu, Edit2, Sparkles, Coffee, Cake, Apple, Layers, 
  Utensils, X, Receipt, CheckCircle, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface POSPageProps {
  cashier: { id: string; name: string };
  currencySymbol: string;
  taxRate: number;
  receiptFooter: string;
}

// Map categories to modern, friendly Lucide icons
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name === 'all') return <Layers className="w-5 h-5" />;
  if (name.includes('food') || name.includes('dish') || name.includes('meal')) return <Utensils className="w-5 h-5" />;
  if (name.includes('drink') || name.includes('beverage') || name.includes('coffee') || name.includes('juice')) return <Coffee className="w-5 h-5" />;
  if (name.includes('bakery') || name.includes('bread') || name.includes('dessert') || name.includes('sweet')) return <Cake className="w-5 h-5" />;
  if (name.includes('hygiene') || name.includes('soap') || name.includes('clean') || name.includes('cosmetic')) return <Sparkles className="w-5 h-5" />;
  if (name.includes('dairy') || name.includes('milk') || name.includes('cheese')) return <Apple className="w-5 h-5" />;
  return <Layers className="w-5 h-5" />;
};

// Return CSS classes for premium product placeholders
const getProductColor = (name: string) => {
  const colors = [
    'from-emerald-500/20 to-teal-500/10 text-emerald-700 border-emerald-100',
    'from-amber-500/20 to-orange-500/10 text-amber-700 border-amber-100',
    'from-sky-500/20 to-blue-500/10 text-sky-700 border-sky-100',
    'from-rose-500/20 to-pink-500/10 text-rose-700 border-rose-100',
    'from-violet-500/20 to-purple-500/10 text-violet-700 border-violet-100',
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export default function POSPage({ cashier, currencySymbol, taxRate, receiptFooter }: POSPageProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeSale, setActiveSale] = useState<Sale | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MOBILE_MONEY' | 'CARD'>('CASH');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('Table #04');
  const [isEditingTable, setIsEditingTable] = useState(false);
  
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const {
    items: cartItems,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    totals
  } = useCart(taxRate);

  // Live order/table tags for bottom strip
  const [activeTickets, setActiveTickets] = useState([
    { id: '1', label: 'T1', name: 'John Doe', items: 3, status: 'Kitchen' },
    { id: '2', label: 'T2', name: 'Alice S.', items: 1, status: 'Process' },
    { id: '3', label: 'T5', name: 'Table 5', items: 5, status: 'Kitchen' },
    { id: '4', label: 'T8', name: 'Takeaway #1', items: 2, status: 'Process' },
  ]);

  const fetchProducts = async () => {
    try {
      const prods = await localDb.getProducts();
      setProducts(prods);
    } catch (e) {
      console.error('Error loading products for POS:', e);
    }
  };

  useEffect(() => {
    fetchProducts();

    const handleDbUpdated = () => {
      fetchProducts();
    };
    window.addEventListener('retailer:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('retailer:db-updated', handleDbUpdated);
    };
  }, []);

  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.archived) return false;
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.barcode === searchQuery;
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    const prod = products.find(p => p.barcode === barcodeQuery.trim() && !p.archived);
    if (prod) {
      addItem(prod);
      showToast(`Added ${prod.name} to checkout cart`, 'success');
      setBarcodeQuery('');
      barcodeInputRef.current?.focus();
    } else {
      showToast(`No product found with barcode "${barcodeQuery}"`, 'warning');
      setBarcodeQuery('');
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('Your checkout cart is empty!', 'warning');
      return;
    }

    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const newSale: Sale = {
      id: saleId,
      invoiceNumber,
      cashierId: cashier.id,
      cashierName: cashier.name,
      total: totals.total,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discountAmount: totals.discountAmount,
      paymentMethod,
      createdAt: new Date().toISOString(),
      items: cartItems.map(item => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        saleId,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      status: 'pending'
    };

    try {
      await localDb.saveSale(newSale);

      for (const item of cartItems) {
        const prod = products.find(p => p.id === item.product.id);
        if (prod) {
          const updatedProd: Product = {
            ...prod,
            quantity: Math.max(0, prod.quantity - item.quantity),
            updatedAt: new Date().toISOString()
          };
          await localDb.saveProduct(updatedProd);

          await localDb.saveInventoryLog({
            id: `log_sale_${saleId}_${item.product.id}`,
            productId: item.product.id,
            productName: prod.name,
            type: 'OUT',
            quantity: -item.quantity,
            reason: `POS sale checkout #${invoiceNumber}`,
            createdAt: new Date().toISOString()
          });
        }
      }

      await localDb.addSyncQueueItem({
        id: `q_${saleId}`,
        action: 'CREATE_SALE',
        payload: newSale,
        createdAt: new Date().toISOString()
      });

      // Update active tickets mock
      const ticketId = Math.random().toString(36).substring(2, 5);
      setActiveTickets(prev => [
        {
          id: ticketId,
          label: `T${Math.floor(Math.random() * 19) + 1}`,
          name: orderType === 'DINE_IN' ? tableNumber : orderType === 'TAKE_AWAY' ? 'Take Away' : 'Delivery Service',
          items: cartItems.reduce((acc, i) => acc + i.quantity, 0),
          status: 'Kitchen'
        },
        ...prev.slice(0, 3)
      ]);

      setActiveSale(newSale);
      setShowReceipt(true);
      clearCart();
      setPaymentMethod('CASH');
      fetchProducts();

      showToast(`Checkout complete! Invoice ${invoiceNumber} generated.`, 'success');
      syncEngine.sync();

    } catch (e) {
      console.error('POS checkout transaction failed:', e);
      showToast('An error occurred while saving the sale locally.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Mock static discount display (Rice and Bread discounted to show secondary yellow badge requirement)
  const getProductDiscountPercent = (prodId: string) => {
    if (prodId === 'prod_2') return 10; // Rice (10% off)
    if (prodId === 'prod_5') return 20; // Bread (20% off)
    return 0;
  };

  // Determine if item is veg/non-veg
  const isVegItem = (name: string) => {
    const lower = name.toLowerCase();
    return !lower.includes('chicken') && !lower.includes('beef') && !lower.includes('meat') && !lower.includes('fish') && !lower.includes('pork');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
      
      {/* Upper Main Split Pane */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6 overflow-hidden min-h-0">
        
        {/* Left Side: Center Content (Search, Categories, Product Grid) */}
        <div className="xl:col-span-2 flex flex-col h-full min-h-0">
          
          {/* Beautiful Pill-Shaped Search Row */}
          <div className="flex items-center gap-3 mb-4.5 shrink-0">
            <button className="p-2.5 bg-white rounded-full border border-slate-200/60 shadow-xs hover:bg-slate-50 transition-all cursor-pointer">
              <Menu className="w-4 h-4 text-slate-500" />
            </button>
            
            <div className="flex-1 relative bg-white rounded-full border border-slate-200/80 shadow-xs flex items-center px-4 py-2 hover:border-emerald-400 focus-within:border-emerald-500 transition-all">
              <Search className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search premium products or menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs placeholder-slate-400 font-display font-medium text-slate-800"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none pr-1">F1</span>
            </div>

            {/* Integrated barcode pill scan */}
            <form onSubmit={handleBarcodeSubmit} className="hidden md:flex w-60 relative bg-white rounded-full border border-slate-200/80 shadow-xs items-center px-4 py-1 hover:border-emerald-400 focus-within:border-emerald-500 transition-all">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scanner mode (1001)..."
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none py-1 text-xs placeholder-slate-400 font-mono font-medium text-slate-800"
              />
              <button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[9px] font-extrabold px-3 py-1 rounded-full shadow-sm cursor-pointer transition-all uppercase"
              >
                Scan
              </button>
            </form>
          </div>

          {/* Horizontal Category Cards */}
          <div className="flex gap-2.5 overflow-x-auto pb-3 mb-4 shrink-0 select-none scrollbar-thin">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex-shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center p-3 transition-all cursor-pointer active:scale-95 shadow-xs border ${
                    isActive
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className={`mb-2.5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-emerald-600'}`}>
                    {getCategoryIcon(cat)}
                  </div>
                  <span className="text-[10px] font-bold font-display truncate w-full text-center tracking-tight">{cat}</span>
                  <span className={`text-[9px] mt-0.5 font-medium ${isActive ? 'text-emerald-100' : 'text-slate-450'}`}>
                    {products.filter(p => !p.archived && (cat === 'All' || p.category === cat)).length} items
                  </span>
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid Area */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-0">
            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl py-16 px-6 text-center max-w-md mx-auto my-6 shadow-xs">
                <ShieldAlert className="w-12 h-12 mx-auto text-emerald-600 stroke-1.5 mb-3" />
                <p className="text-sm font-bold text-slate-900 font-display">No matching items</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  We couldn't find any products matching "{searchQuery}" under the "{selectedCategory}" category.
                </p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-xs"
                >
                  Clear Search Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                <AnimatePresence>
                  {filteredProducts.map((prod) => {
                    const isOutOfStock = prod.quantity <= 0;
                    const isLowStock = prod.quantity <= prod.reorderLevel;
                    const discount = getProductDiscountPercent(prod.id);
                    const isVeg = isVegItem(prod.name);

                    // Find if already in active cart to switch to stepper
                    const cartItem = cartItems.find(item => item.product.id === prod.id);
                    const cartQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={prod.id}
                        className={`bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col justify-between h-[215px] hover:shadow-md transition-all group relative overflow-hidden ${
                          isOutOfStock ? 'opacity-65' : ''
                        }`}
                      >
                        {/* Rounded Product Photo / Placeholder Design */}
                        <div className={`relative h-24 rounded-xl overflow-hidden bg-gradient-to-br ${getProductColor(prod.name)} flex items-center justify-center font-display font-black text-xl mb-3 border border-slate-100`}>
                          {prod.name.slice(0, 2).toUpperCase()}

                          {/* Yellow Discount Badge in Top Left */}
                          {discount > 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                              <Flame className="w-2.5 h-2.5 fill-current" />
                              {discount}% Off
                            </span>
                          )}

                          {/* Veg/Non-Veg overlay dot */}
                          <span className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-xs p-0.5 rounded-md flex items-center shadow-xs">
                            <span className={`inline-flex items-center justify-center w-3 h-3 border ${isVeg ? 'border-emerald-600' : 'border-rose-600'} p-0.5 rounded-xs`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            </span>
                          </span>
                        </div>

                        {/* Title and details */}
                        <div className="mb-2 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider truncate">
                              {prod.category}
                            </span>
                            {isOutOfStock ? (
                              <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.25 rounded-full">OUT</span>
                            ) : isLowStock ? (
                              <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.25 rounded-full">ONLY {prod.quantity}</span>
                            ) : (
                              <span className="text-[8px] font-bold text-slate-400">Qty: {prod.quantity}</span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 truncate leading-snug" title={prod.name}>
                            {prod.name}
                          </h4>
                        </div>

                        {/* Price and Add/Qty button wrapper */}
                        <div className="flex items-center justify-between gap-2 border-t border-slate-100/60 pt-2.5 mt-auto">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {currencySymbol}{prod.sellingPrice.toFixed(2)}
                          </span>

                          <div className="w-24 flex justify-end">
                            {isOutOfStock ? (
                              <button
                                disabled
                                className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full cursor-not-allowed"
                              >
                                Sold Out
                              </button>
                            ) : cartQty === 0 ? (
                              <button
                                onClick={() => {
                                  addItem(prod);
                                  showToast(`Added ${prod.name} to order`, 'success');
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[10px] rounded-full transition-all cursor-pointer shadow-xs hover:shadow-sm"
                              >
                                Add to Dish
                              </button>
                            ) : (
                              <div className="w-full flex items-center justify-between bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                                <button
                                  onClick={() => updateQuantity(prod.id, cartQty - 1)}
                                  className="p-1 hover:bg-emerald-700 rounded-full transition-colors cursor-pointer"
                                >
                                  <Minus className="w-2.5 h-2.5 text-white" />
                                </button>
                                <span className="text-[10px] font-bold font-mono px-1">{cartQty}</span>
                                <button
                                  onClick={() => updateQuantity(prod.id, cartQty + 1)}
                                  className="p-1 hover:bg-emerald-700 rounded-full transition-colors cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Order Panel (Cart, Summary, Payments) */}
        <div className="bg-white rounded-3xl border border-slate-150/70 shadow-lg flex flex-col h-full min-h-0 overflow-hidden">
          
          {/* Header context (Table or order context) */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              {isEditingTable ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    onBlur={() => setIsEditingTable(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingTable(false)}
                    autoFocus
                    className="border border-slate-200 rounded px-1.5 py-0.5 text-xs font-bold w-28 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button onClick={() => setIsEditingTable(false)} className="text-[10px] font-bold text-emerald-600">Save</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-slate-900 text-sm font-display leading-tight">{tableNumber}</h3>
                  <button 
                    onClick={() => setIsEditingTable(true)} 
                    className="p-0.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="text-[10px] text-slate-400 font-medium">Cashier Staff: {cashier.name}</p>
            </div>
            
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="text-[10px] font-extrabold text-slate-400 hover:text-rose-600 disabled:opacity-40 transition-colors cursor-pointer uppercase tracking-wider"
            >
              Reset Card
            </button>
          </div>

          {/* Segmented Pill style tab switcher (Dine In, Take Away, Delivery) */}
          <div className="px-4 py-1.5 shrink-0 bg-slate-50/50 border-b border-slate-100">
            <div className="bg-slate-200/50 p-1 rounded-full flex gap-1">
              {(['DINE_IN', 'TAKE_AWAY', 'DELIVERY'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-1.5 rounded-full text-[9px] font-extrabold font-display transition-all cursor-pointer text-center uppercase tracking-wider ${
                    orderType === type
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'DINE_IN' ? 'Dine In' : type === 'TAKE_AWAY' ? 'Take Away' : 'Delivery'}
                </button>
              ))}
            </div>
          </div>

          {/* Order Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 border border-emerald-100/50">
                  <ShoppingCart className="w-5 h-5 stroke-2" />
                </div>
                <p className="text-xs font-bold text-slate-800 font-display">No items added yet</p>
                <p className="text-[10px] max-w-[170px] mt-1 text-slate-400">
                  Tappable product cards or barcode scanner will display items in real time here.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={item.product.id} 
                    className="flex gap-3 justify-between items-center pb-3 border-b border-slate-100/60"
                  >
                    {/* Small product thumbnail */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${getProductColor(item.product.name)} text-[9px] font-black font-display flex-shrink-0 border border-slate-50 shadow-xs`}>
                      {item.product.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">{item.product.name}</h4>
                        <span className={`inline-flex items-center justify-center w-2.5 h-2.5 border ${isVegItem(item.product.name) ? 'border-emerald-600' : 'border-rose-600'} p-0.25 rounded-xs flex-shrink-0`}>
                          <span className={`w-1 h-1 rounded-full ${isVegItem(item.product.name) ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono font-medium">{currencySymbol}{item.price.toFixed(2)}</span>
                        <span className="text-[9px] text-slate-300">×</span>
                        <span className="text-[10px] font-bold text-slate-600">{item.quantity}</span>
                      </div>
                    </div>

                    {/* Quantity action list */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {currencySymbol}{item.subtotal.toFixed(2)}
                      </span>
                      
                      <div className="flex items-center bg-slate-50 border border-slate-150 rounded-full overflow-hidden scale-90">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 text-slate-550 hover:bg-slate-150 transition-colors cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="px-2 text-[10px] font-bold font-mono text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 text-slate-550 hover:bg-slate-150 transition-colors cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>

                    {/* Delete row trigger */}
                    <button 
                      onClick={() => { removeItem(item.product.id); showToast(`Removed ${item.product.name}`, 'warning'); }}
                      className="p-1 text-slate-350 hover:text-rose-600 rounded hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Checkout & Summary panel at bottom of right side */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-150 shrink-0 space-y-3.5">
            
            {/* Custom discount badge trigger */}
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Apply Discount (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                disabled={cartItems.length === 0}
                placeholder="0%"
                value={totals.discountPercent || ''}
                onChange={(e) => applyDiscount(Number(e.target.value))}
                className="w-16 px-2.5 py-1.5 text-right text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1.5 text-xs border-t border-slate-150/60 pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-800">{currencySymbol}{totals.subtotal.toFixed(2)}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-rose-650 font-bold bg-rose-50/50 py-0.5 px-1.5 rounded-md">
                  <span>Discount ({totals.discountPercent}%)</span>
                  <span className="font-mono">-{currencySymbol}{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>VAT ({taxRate}%)</span>
                <span className="font-mono font-bold text-slate-800">{currencySymbol}{totals.taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-slate-900 border-t border-slate-150/60 pt-2.5">
                <span className="text-xs font-extrabold font-display">Order Total</span>
                <span className="text-base font-black text-emerald-600 font-mono">{currencySymbol}{totals.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Selection Block */}
            <div className="grid grid-cols-3 gap-2 py-1.5 border-t border-slate-150/65">
              <button
                onClick={() => setPaymentMethod('CASH')}
                disabled={cartItems.length === 0}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center border text-center transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'CASH'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs font-bold'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Landmark className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('MOBILE_MONEY')}
                disabled={cartItems.length === 0}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center border text-center transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'MOBILE_MONEY'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs font-bold'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Mobile</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                disabled={cartItems.length === 0}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center border text-center transition-all cursor-pointer active:scale-95 ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs font-bold'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Landmark className="w-4 h-4 mb-1" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Card</span>
              </button>
            </div>

            {/* Place Order Primary Trigger */}
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className="w-full mt-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Place Order ({currencySymbol}{totals.total.toFixed(2)})
            </button>

          </div>

        </div>

      </div>

      {/* Bottom strip representing active table or order ticket chips */}
      <div className="bg-white border-t border-slate-150/80 px-4 py-2.5 flex items-center gap-3 overflow-x-auto select-none shrink-0 rounded-b-2xl">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider font-display shrink-0">Kitchen Hub:</span>
        <div className="flex gap-2.5">
          {activeTickets.map(t => (
            <div key={t.id} className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-150 rounded-full hover:bg-slate-100 transition-colors shrink-0">
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100/50">{t.label}</span>
              <span className="text-[9px] font-bold text-slate-700 font-display">{t.name}</span>
              <span className="text-[9px] text-slate-400 font-mono">({t.items} {t.items === 1 ? 'item' : 'items'})</span>
              <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.25 rounded-full ${
                t.status === 'Kitchen' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'
              }`}>{t.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Printable Receipt Modal */}
      {showReceipt && activeSale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]"
          >
            
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 font-display text-xs uppercase tracking-wide">Checkout Success</h3>
              </div>
              <button 
                onClick={() => { setShowReceipt(false); setActiveSale(null); }}
                className="text-xs text-slate-450 hover:text-slate-700 font-semibold cursor-pointer p-1"
              >
                Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-[11px] text-slate-800 space-y-4" id="printable-receipt">
              <div className="text-center space-y-1">
                <h2 className="text-xs font-black text-slate-900 tracking-widest font-display uppercase">RETAILER OUTLET RECEIPT</h2>
                <p className="text-[8px] text-slate-400 font-sans">Point of Sale Offline Transaction Record</p>
                <div className="border-t border-dashed border-slate-300 my-2" />
              </div>

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>INVOICE NO:</span>
                  <span className="font-bold">{activeSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{activeSale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE-TIME:</span>
                  <span>{new Date(activeSale.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>PAYMENT MODE:</span>
                  <span className="font-bold">{activeSale.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300" />

              <div className="space-y-1.5">
                <div className="grid grid-cols-4 font-extrabold text-slate-900 uppercase text-[9px] tracking-wider">
                  <span className="col-span-2">Product Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                </div>
                {activeSale.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 text-slate-650 text-[10px]">
                    <span className="col-span-2 truncate font-sans text-slate-800">{item.productName}</span>
                    <span className="text-center font-mono">{item.quantity}</span>
                    <span className="text-right font-mono">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300" />

              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{currencySymbol}{activeSale.subtotal.toFixed(2)}</span>
                </div>
                {activeSale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount Amount:</span>
                    <span className="font-mono">-{currencySymbol}{activeSale.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>VAT ({taxRate}%):</span>
                  <span className="font-mono">{currencySymbol}{activeSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-900 pt-2 border-t border-dotted border-slate-300">
                  <span>TOTAL PAID:</span>
                  <span className="font-mono">{currencySymbol}{activeSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-4" />

              <div className="text-center space-y-1 text-[9px] text-slate-400 font-sans">
                <p className="leading-relaxed px-2">{receiptFooter}</p>
                <p className="font-mono mt-1.5 text-[7px] tracking-wider">TX_ID: {activeSale.id}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex gap-3 select-none">
              <button
                onClick={() => { setShowReceipt(false); setActiveSale(null); }}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer text-center active:scale-95"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
  );
}
