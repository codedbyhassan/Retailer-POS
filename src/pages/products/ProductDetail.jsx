import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../../services/indexeddb/productsStore';
import { getInventoryLogsByProduct } from '../../services/indexeddb/inventoryStore';
import Badge, { stockBadge, stockLabel } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils/formatCurrency';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import { getProductImageSrc } from '../../utils/imageUtils';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [logs, setLogs] = useState([]);
  const { currency } = useBusinessSettings();

  useEffect(() => {
    async function load() {
      const [p, l] = await Promise.all([
        getProductById(id),
        getInventoryLogsByProduct(id),
      ]);
      setProduct(p);
      setLogs(l.reverse());
    }
    load();
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/admin/products" className="text-sm text-brand-600 hover:underline">← Back to products</Link>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black/[0.04] dark:bg-white/[0.06]">
            {getProductImageSrc(product) ? (
              <img src={getProductImageSrc(product)} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-400">No image</div>
            )}
          </div>
          <div>
          <h2>{product.name}</h2>
          <p className="text-gray-500">{product.sku} · {product.category}</p>
          </div>
        </div>
        <Badge variant={stockBadge(product.quantity, product.reorder_level)}>
          {stockLabel(product.quantity, product.reorder_level)}
        </Badge>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border p-4 dark:border-gray-800"><p className="text-sm text-gray-500">Selling Price</p><p className="text-xl font-bold">{formatCurrency(product.selling_price, currency)}</p></div>
        <div className="rounded-xl border p-4 dark:border-gray-800"><p className="text-sm text-gray-500">Cost Price</p><p className="text-xl font-bold">{formatCurrency(product.cost_price, currency)}</p></div>
        <div className="rounded-xl border p-4 dark:border-gray-800"><p className="text-sm text-gray-500">In Stock</p><p className="text-xl font-bold">{product.quantity}</p></div>
        <div className="rounded-xl border p-4 dark:border-gray-800"><p className="text-sm text-gray-500">Barcode</p><p className="text-xl font-bold">{product.barcode || '—'}</p></div>
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Stock History</h2>
      {logs.length === 0 ? (
        <p className="text-gray-500">No stock movements recorded</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between rounded-lg border px-4 py-3 dark:border-gray-800">
              <span className="capitalize">{log.type} {log.quantity} units</span>
              <span className="text-gray-500">{formatDate(log.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
