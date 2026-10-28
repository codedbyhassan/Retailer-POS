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
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const toast = useToast();

  const load = async () => {
    setPageLoading(true);
    setLoadError('');
    try {
      const [prods, inventoryLogs, inventorySummary] = await Promise.all([
        listProducts(),
        listInventoryLogs(),
        getInventorySummary(),
      ]);
      setProducts(prods);
      setLogs(inventoryLogs.slice(0, 20));
      setSummary(inventorySummary);
    } catch (error) {
      setLoadError(error?.message || 'Unable to load inventory right now.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdjust = async (data) => {
    setLoading(true);
    try {
      const amount = Number(data.quantity);
      const delta = String(data.type).toLowerCase() === 'remove' ? -amount : amount;
      await adjustInventory({ ...data, delta });
      toast.success('Stock updated');
      setShowAdjust(false);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2>Inventory</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Monitor available stock and review adjustments.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setShowAdjust(true)}>Adjust Stock</Button>
      </div>

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-300">Inventory could not be loaded</p>
          <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">{loadError}</p>
          <Button className="mt-4" variant="secondary" onClick={load} disabled={pageLoading}>Try again</Button>
        </div>
      ) : pageLoading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading inventory">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.06] dark:bg-surface-dark" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-2xl border border-black/[0.05] bg-white dark:border-white/[0.06] dark:bg-surface-dark" />
        </div>
      ) : (
        <>
          {summary && (
            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
              <div className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-surface-dark sm:p-5">
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="mt-1 break-words text-xl font-bold tabular-nums sm:text-2xl">{summary.products.length}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-surface-dark sm:p-5">
                <p className="text-sm text-gray-500">Inventory Value</p>
                <p className="mt-1 break-words text-xl font-bold tabular-nums sm:text-2xl">{formatMoney(summary.totalValue)}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 dark:border-amber-800/50 dark:bg-amber-900/20 sm:p-5">
                <p className="text-sm text-gray-600 dark:text-gray-300">Low Stock Items</p>
                <p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{summary.lowStock.length}</p>
              </div>
            </div>
          )}

          <section className="min-w-0">
            <h3 className="mb-3 text-lg">Current Stock</h3>
            <InventoryTable products={products} currency={currency} />
          </section>

          <section className="mt-7 min-w-0 sm:mt-8">
            <h3 className="mb-3 text-lg">Recent Adjustments</h3>
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/[0.12] p-6 text-center text-sm text-gray-500 dark:border-white/[0.12] sm:p-8">
                No stock movements yet.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const product = products.find((item) => item.id === log.product_id);
                  return (
                    <div key={log.id} className="flex flex-col gap-1.5 rounded-xl border border-black/[0.05] bg-white px-3 py-3 dark:border-white/[0.06] dark:bg-surface-dark sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
                      <span className="min-w-0 break-words text-sm">
                        <span className="font-semibold">{product?.name || 'Unknown product'}</span>
                        <span className="text-gray-500"> · {log.type} {log.quantity}</span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-500 sm:text-sm">{formatDate(log.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust Stock">
        <StockAdjustForm products={products} onSubmit={handleAdjust} onCancel={() => setShowAdjust(false)} loading={loading} />
      </Modal>
    </div>
  );
}
