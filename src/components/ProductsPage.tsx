import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '../services/indexeddb/db.js';
import { Product } from '../types.js';
import { syncEngine } from '../services/sync/syncEngine.js';
import { useToast } from '../hooks/useToast.tsx';
import { Plus, Search, Edit2, Archive, Trash2, X, Filter, Package, AlertCircle } from 'lucide-react';

interface ProductsPageProps {
  currencySymbol: string;
}

export default function ProductsPage({ currencySymbol }: ProductsPageProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form values
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(5);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const list = await localDb.getProducts();
      setProducts(list);
    } catch (e) {
      console.error('Error loading products:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    // Listen for database sync refreshes
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
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.barcode.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    // Auto-generate SKU & Barcode for convenience
    const uniqueId = Date.now().toString().slice(-6);
    setSku(`SKU-PROD-${uniqueId}`);
    setBarcode(Math.floor(1000 + Math.random() * 9000).toString());
    setCategory('');
    setCostPrice(0);
    setSellingPrice(0);
    setQuantity(0);
    setReorderLevel(5);
    setShowModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setSku(prod.sku);
    setBarcode(prod.barcode);
    setCategory(prod.category);
    setCostPrice(prod.costPrice);
    setSellingPrice(prod.sellingPrice);
    setQuantity(prod.quantity);
    setReorderLevel(prod.reorderLevel);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim() || !barcode.trim() || !category.trim()) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    if (sellingPrice < costPrice) {
      if (!confirm('Warning: The selling price is lower than the cost price. Do you want to proceed?')) {
        return;
      }
    }

    try {
      if (editingProduct) {
        // Edit existing product
        const updated: Product = {
          ...editingProduct,
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim(),
          category: category.trim(),
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          reorderLevel: Number(reorderLevel),
          updatedAt: new Date().toISOString()
        };

        await localDb.saveProduct(updated);
        await localDb.addSyncQueueItem({
          id: `q_edit_${updated.id}_${Date.now()}`,
          action: 'UPDATE_PRODUCT',
          payload: updated,
          createdAt: new Date().toISOString()
        });
        showToast(`Product "${updated.name}" updated successfully!`, 'success');

      } else {
        // Create new product
        const newId = `prod_${Date.now()}`;
        const newProduct: Product = {
          id: newId,
          name: name.trim(),
          sku: sku.trim(),
          barcode: barcode.trim(),
          category: category.trim(),
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          quantity: Number(quantity),
          reorderLevel: Number(reorderLevel),
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await localDb.saveProduct(newProduct);
        await localDb.addSyncQueueItem({
          id: `q_add_${newId}_${Date.now()}`,
          action: 'CREATE_PRODUCT',
          payload: newProduct,
          createdAt: new Date().toISOString()
        });
        showToast(`Product "${newProduct.name}" created successfully!`, 'success');
      }

      setShowModal(false);
      fetchProducts();
      
      // Auto-trigger background sync
      syncEngine.sync();

    } catch (e) {
      console.error('Error saving product:', e);
      showToast('An error occurred while saving the product.', 'error');
    }
  };

  const handleArchive = async (prod: Product) => {
    if (!confirm(`Are you sure you want to archive "${prod.name}"? It will be removed from the POS catalog.`)) {
      return;
    }

    try {
      const archivedProd: Product = {
        ...prod,
        archived: true,
        updatedAt: new Date().toISOString()
      };

      await localDb.saveProduct(archivedProd);
      await localDb.addSyncQueueItem({
        id: `q_arch_${prod.id}_${Date.now()}`,
        action: 'ARCHIVE_PRODUCT',
        payload: { id: prod.id },
        createdAt: new Date().toISOString()
      });

      showToast(`Product "${prod.name}" archived successfully!`, 'success');
      fetchProducts();
      syncEngine.sync();
    } catch (e) {
      console.error('Failed to archive product:', e);
      showToast(`Failed to archive "${prod.name}"`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">Product Catalog</h2>
          <p className="text-xs text-slate-500">Manage products, pricing, categories and offline inventories</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by name, SKU or barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>

        <div className="flex gap-2 items-center overflow-x-auto pb-1 md:pb-0">
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 font-display uppercase tracking-wider">
            <Filter className="w-3 h-3 text-slate-400" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {loading ? (
        <div className="bg-white p-12 text-center border border-slate-200 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-slate-500">Retrieving product registry...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white py-16 text-center border border-slate-200 rounded-xl shadow-sm">
          <Package className="w-10 h-10 mx-auto text-slate-300 stroke-1 mb-2" />
          <p className="text-sm font-bold text-slate-900 font-display">
            {searchQuery || selectedCategory !== 'All' ? 'No Matching Products' : 'No Products Listed'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try refining your search keyword or clearing the active category filters.'
              : 'Add a product to your inventory system or trigger a cloud sync to pull down products.'}
          </p>
          {searchQuery || selectedCategory !== 'All' ? (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="mt-4 px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          ) : (
            <button 
              onClick={openAddModal}
              className="mt-4 px-3.5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Create first product
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">SKU / Barcode</th>
                  <th className="py-3 px-6 text-right">Cost</th>
                  <th className="py-3 px-6 text-right">Selling Price</th>
                  <th className="py-3 px-6 text-center">Stock Level</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = prod.quantity <= 0;
                  const isLowStock = prod.quantity <= prod.reorderLevel;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-semibold text-slate-950">{prod.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Created: {new Date(prod.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">
                          {prod.category}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-[11px] text-slate-500 space-y-0.5">
                        <div>SKU: {prod.sku}</div>
                        <div>BAR: {prod.barcode}</div>
                      </td>
                      <td className="py-3 px-6 text-right font-mono text-slate-600">
                        {currencySymbol}{prod.costPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-semibold text-slate-950">
                        {currencySymbol}{prod.sellingPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {isOutOfStock ? (
                          <span className="inline-block text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                              Low Stock: {prod.quantity}
                            </span>
                            <div className="text-[9px] text-slate-400">Alert threshold: {prod.reorderLevel}</div>
                          </div>
                        ) : (
                          <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded font-mono">
                            {prod.quantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 text-slate-500 hover:text-indigo-650 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchive(prod)}
                            className="p-1.5 text-slate-500 hover:text-rose-650 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Archive Product"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-250 shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 font-display text-sm">
                {editingProduct ? 'Edit Product Catalog Entry' : 'Add New Catalog Product'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jasmine Rice 1kg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="SKU-CODE"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Barcode *</label>
                  <input
                    type="text"
                    required
                    placeholder="Barcode Number"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Food, Hygiene, Dairy, Bakery"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="Wholesale cost"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selling Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="POS sale price"
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!!editingProduct}
                    placeholder="Count"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono disabled:opacity-50 disabled:bg-slate-50 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                  {editingProduct && (
                    <p className="text-[9px] text-slate-400 font-medium">Qty handled via Inventory panel.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reorder Level Alert *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Alert below this level"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
