import { useEffect, useState } from 'react';
import { getAllProducts } from '../../services/indexeddb/productsStore';
import { getAllInventoryLogs, addInventoryLog, getInventorySummary } from '../../services/indexeddb/inventoryStore';
import { addToSyncQueue } from '../../services/sync/syncQueue';
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
  const toast = useToast();

  const load = async () => {
    const [prods, invLogs, invSummary] = await Promise.all([
      getAllProducts(),
      getAllInventoryLogs(),
      getInventorySummary(),
    ]);
    setProducts(prods);
    setLogs(invLogs.slice(0, 20));
    setSummary(invSummary);
  };

  useEffect(() => { load(); }, []);

  const handleAdjust = async (data) => {
    setLoading(true);
    try {
      const log = await addInventoryLog(data);
      await addToSyncQueue('INVENTORY_ADJUST', log);
      toast.success('Stock updated');
      setShowAdjust(false);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2>Inventory</h2>
        <Button onClick={() => setShowAdjust(true)}>Adjust Stock</Button>
      </div>
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-4 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{summary.products.length}</p>
          </div>
          <div className="rounded-xl border p-4 dark:border-gray-800">
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
      <h3 className="mb-3 mt-8">Recent Adjustments</h3>
      {logs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500 dark:border-gray-700">
          No stock movements yet
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const prod = products.find((p) => p.id === log.product_id);
            return (
              <div key={log.id} className="flex justify-between rounded-lg border px-4 py-3 dark:border-gray-800">
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
