import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '../services/indexeddb/db';
import { Product, InventoryLog } from '../types';
import { syncEngine } from '../services/sync/syncEngine';
import { useToast } from '../hooks/useToast';
import { Plus, ArrowDownUp, ShieldAlert, CheckCircle, Package, History, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, X } from 'lucide-react';

interface InventoryPageProps {
  currencySymbol: string;
}

export default function InventoryPage({ currencySymbol }: InventoryPageProps) {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const prods = await localDb.getProducts();
      const logsList = await localDb.getInventoryLogs();
      setProducts(prods);
      // Sort logs chronologically descending
      setLogs([...logsList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (e) {
      console.error('Error fetching inventory data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for database sync refreshes
    const handleDbUpdated = () => {
      loadData();
    };
    window.addEventListener('retailer:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('retailer:db-updated', handleDbUpdated);
    };
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      alert('Please select a product.');
      return;
    }
    if (adjustmentQuantity <= 0) {
      alert('Please specify a positive quantity value.');
      return;
    }
    if (!reason.trim()) {
      alert('Please specify an adjustment reason.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) {
      alert('Selected product not found.');
      return;
    }

    try {
      // Calculate new quantity
      let qDelta = 0;
      let newQty = prod.quantity;

      if (adjustmentType === 'IN') {
        qDelta = adjustmentQuantity;
        newQty += adjustmentQuantity;
      } else if (adjustmentType === 'OUT') {
        qDelta = -adjustmentQuantity;
        newQty = Math.max(0, newQty - adjustmentQuantity);
      } else if (adjustmentType === 'ADJUST') {
        qDelta = adjustmentQuantity - prod.quantity;
        newQty = adjustmentQuantity;
      }

      // 1. Save updated product quantity
      const updatedProduct: Product = {
        ...prod,
        quantity: newQty,
        updatedAt: new Date().toISOString()
      };
      await localDb.saveProduct(updatedProduct);

      // 2. Create local inventory log
      const logId = `log_adjust_${Date.now()}`;
      const newLog: InventoryLog = {
        id: logId,
        productId: prod.id,
        productName: prod.name,
        type: adjustmentType,
        quantity: qDelta,
        reason: reason.trim(),
        createdAt: new Date().toISOString()
      };
      await localDb.saveInventoryLog(newLog);

      // 3. Queue action
      await localDb.addSyncQueueItem({
        id: `q_adj_${logId}`,
        action: 'ADJUST_STOCK',
        payload: {
          id: logId,
          productId: prod.id,
          type: adjustmentType,
          quantity: qDelta,
          reason: reason.trim()
        },
        createdAt: new Date().toISOString()
      });

      setShowModal(false);
      setSelectedProductId('');
      setAdjustmentQuantity(0);
      setReason('');
      
      // Reload UI
      await loadData();

      // Show toast
      showToast(`Stock for "${prod.name}" adjusted successfully!`, 'success');

      // Trigger auto-sync
      syncEngine.sync();

    } catch (err) {
      console.error('Adjustment failed:', err);
      showToast('An error occurred while saving the inventory adjustment.', 'error');
    }
  };

  const stats = useMemo(() => {
    const totalItems = products.reduce((sum, p) => sum + p.quantity, 0);
    const lowStockItems = products.filter(p => p.quantity <= p.reorderLevel && !p.archived);
    const outOfStockItems = products.filter(p => p.quantity === 0 && !p.archived);

    return {
      totalItems,
      lowCount: lowStockItems.length,
      outCount: outOfStockItems.length
    };
  }, [products]);

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">Inventory Control</h2>
          <p className="text-xs text-slate-500">Audit stock balances, record damage waste, and adjust wholesale deliveries</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <ArrowDownUp className="w-4 h-4" />
          Adjust Stock
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Total Stock Pieces</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {stats.totalItems} <span className="text-xs text-slate-400 font-sans font-medium">units</span>
            </h3>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Low Stock Alerts</p>
            <h3 className="text-2xl font-bold text-amber-600 font-mono mt-1">
              {stats.lowCount} <span className="text-xs text-slate-400 font-sans font-medium">products</span>
            </h3>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Out of Stock</p>
            <h3 className="text-2xl font-bold text-rose-600 font-mono mt-1">
              {stats.outCount} <span className="text-xs text-slate-400 font-sans font-medium">products</span>
            </h3>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main split: Current Quantities & Audit Log History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 font-display text-sm">Store Stock Levels</h3>
            <p className="text-xs text-slate-400">Current available products on shelf</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">Product</th>
                  <th className="py-3 px-5">SKU</th>
                  <th className="py-3 px-5 text-right">In-Stock</th>
                  <th className="py-3 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map((prod) => {
                  const isOutOfStock = prod.quantity <= 0;
                  const isLowStock = prod.quantity <= prod.reorderLevel;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 px-5 font-semibold text-slate-950">{prod.name}</td>
                      <td className="py-3 px-5 font-mono text-slate-500">{prod.sku}</td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-slate-950">{prod.quantity}</td>
                      <td className="py-3 px-5 text-center">
                        {isOutOfStock ? (
                          <span className="inline-block text-[10px] font-bold bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded">
                            Empty
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded font-mono">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-[500px]">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 font-display text-sm flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                Inventory Logs
              </h3>
              <p className="text-xs text-slate-400">Audit trail of stock movements</p>
            </div>
            <button 
              onClick={loadData}
              className="text-[11px] font-bold text-indigo-650 hover:text-indigo-700 cursor-pointer"
            >
              Refresh
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center">
                <History className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-800">No stock history recorded</p>
                <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 text-center">Manual edits, sales checkouts, and wholesale adjustments will generate logs here.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3.5 px-3 py-1 bg-indigo-50 text-indigo-750 hover:bg-indigo-100 border border-indigo-150 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Adjust Stock Now
                </button>
              </div>
            ) : (
              logs.map((log) => {
                const isAddition = log.quantity > 0;
                
                return (
                  <div key={log.id} className="flex gap-3 justify-between items-start pb-3 border-b border-slate-50 text-xs">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`p-0.5 rounded ${isAddition ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          {isAddition ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                        </span>
                        <h4 className="font-bold text-slate-900 truncate leading-snug">{log.productName}</h4>
                      </div>
                      <p className="text-slate-450 italic">" {log.reason} "</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <span className={`font-mono font-bold ${isAddition ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {isAddition ? '+' : ''}{log.quantity}
                      </span>
                      <span className="text-[9px] text-slate-450 block font-mono uppercase">{log.type}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* ADJUSTMENT ENTRY OVERLAY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-250 shadow-xl max-w-sm w-full overflow-hidden flex flex-col">
            
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 font-display text-sm">Record Stock Adjustment</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-5 space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Product *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-shadow cursor-pointer"
                >
                  <option value="">-- Choose inventory item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku}, Qty: {p.quantity})</option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adjustment Action *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('IN')}
                    className={`py-2 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer ${
                      adjustmentType === 'IN'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    IN
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('OUT')}
                    className={`py-2 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer ${
                      adjustmentType === 'OUT'
                        ? 'border-rose-600 bg-rose-50 text-rose-700'
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    OUT
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('ADJUST')}
                    className={`py-2 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer ${
                      adjustmentType === 'ADJUST'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'
                    }`}
                  >
                    ADJUST
                  </button>
                </div>
              </div>

              {/* Adjustment Quantity */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {adjustmentType === 'IN' ? 'Quantity to Add *' : adjustmentType === 'OUT' ? 'Quantity to Deduct *' : 'Set Absolute Stock Level *'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 10"
                  value={adjustmentQuantity || ''}
                  onChange={(e) => setAdjustmentQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              {/* Adjustment Reason */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reason / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Received shipment, damaged item, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-3 border-t border-slate-150">
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
                  Apply Change
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
