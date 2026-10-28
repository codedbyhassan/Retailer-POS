import { useEffect, useState } from 'react';
import { listProducts } from '../../services/online/productService';
import { listInventoryLogs, adjustInventory, getInventorySummary } from '../../services/online/inventoryService';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import InventoryTable from '../../components/tables/InventoryTable';
import StockAdjustForm from '../../components/forms/StockAdjustForm';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatCurrency';
import { useToast } from '../../components/ui/Toast';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const { currency, formatMoney } = useBusinessSettings();
  const [showAdjust, setShowAdjust] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState('');
  const toast = useToast();

  const load = async () => {
    setLoadingData(true);
    setLoadError('');
    try {
      const [prods, invLogs, invSummary] = await Promise.all([
        listProducts(),
        listInventoryLogs(),
        getInventorySummary(),
      ]);
      setProducts(prods);
      setLogs(invLogs.slice(0, 20));
      setSummary(invSummary);
    } catch (error) {
      setLoadError(error.message || 'Inventory could not be loaded.');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdjust = async (data) => {
    setLoading(true);
    try {
      const amount = Number(data.quantity);
      const delta = String(data.type).toLowerCase() === 'remove' ? -amount : amount;
      await adjustInventory({ ...data, delta });
      toast.success('Stock updated');
      setShowAdjust(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Stock control</p><h2>Inventory</h2><p className="mt-1 text-sm text-gray-500">Track quantities, value and restocking needs.</p></div>
        <Button onClick={() => setShowAdjust(true)} disabled={!products.length}>Adjust stock</Button>
      </div>
      {loadError && <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"><span>{loadError}</span><Button variant="secondary" size="sm" onClick={load}>Retry</Button></div>}
      {loadingData && !summary && <div aria-live="polite" className="mb-6 grid gap-3 sm:grid-cols-3"><div className="h-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/[0.06]" /><div className="h-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/[0.06]" /><div className="h-24 animate-pulse rounded-2xl bg-black/[0.05] dark:bg-white/[0.06]" /></div>}
      {summary && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-surface-dark">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{summary.products.length}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-surface-dark">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <p className="text-2xl font-bold">{formatMoney(summary.totalValue)}</p>
          </div>
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold">{summary.lowStock.length}</p>
          </div>
        </div>
      )}
      <h3 className="mb-3">Current Stock</h3>
      <InventoryTable products={products} currency={currency} />
      <h3 className="mb-3 mt-8">Recent adjustments</h3>
      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500 dark:border-gray-700">
          No stock movements yet
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const prod = products.find((p) => p.id === log.product_id);
            return (
              <div key={log.id} className="flex flex-col gap-1 rounded-xl border border-black/[0.06] px-4 py-3 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
                <span>{prod?.name || 'Unknown'} — <span className="capitalize">{log.type}</span> {log.quantity}</span>
                <span className="text-gray-500">{formatDate(log.created_at)}</span>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <StockAdjustForm products={products} onSubmit={handleAdjust} onCancel={() => setShowAdjust(false)} loading={loading} />
      </Modal>
    </div>
  );
}
