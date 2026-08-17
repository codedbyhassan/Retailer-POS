import { useEffect, useMemo, useState } from 'react';
import { getAllProducts, createProduct, updateProduct, archiveProduct } from '../../services/indexeddb/productsStore';
import { addToSyncQueue } from '../../services/sync/syncQueue';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ProductTable from '../../components/tables/ProductTable';
import ProductForm from '../../components/forms/ProductForm';
import Modal from '../../components/ui/Modal';
import { ConfirmModal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { currency } = useBusinessSettings();
  const [modal, setModal] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => setProducts(await getAllProducts());
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    all: products.length,
    low: products.filter((p) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= Number(p.reorder_level || 5)).length,
    out: products.filter((p) => Number(p.quantity || 0) <= 0).length,
  }), [products]);

  const filtered = useMemo(() => products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || [p.name, p.sku, p.barcode, p.category].some((v) => String(v || '').toLowerCase().includes(q));
    const qty = Number(p.quantity || 0);
    const matchesFilter = filter === 'all' || (filter === 'low' && qty > 0 && qty <= Number(p.reorder_level || 5)) || (filter === 'out' && qty <= 0);
    return matchesSearch && matchesFilter;
  }), [products, search, filter]);

  const handleSave = async (data) => {
    setLoading(true);
    try {
      if (modal?.product) {
        const updated = await updateProduct(modal.product.id, data);
        await addToSyncQueue('UPDATE_PRODUCT', updated);
        toast.success('Product updated');
      } else {
        const created = await createProduct(data);
        await addToSyncQueue('CREATE_PRODUCT', created);
        toast.success('Product created');
      }
      setModal(null); await load();
    } catch (err) { toast.error(err.message); } finally { setLoading(false); }
  };

  const handleArchive = async () => {
    setLoading(true);
    try { await archiveProduct(archiveTarget.id); await addToSyncQueue('ARCHIVE_PRODUCT', { id: archiveTarget.id }); toast.success('Product archived'); setArchiveTarget(null); await load(); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Catalog & stock</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">Products</h1><p className="mt-1 text-sm text-gray-500">Manage your catalog, pricing and stock visibility.</p></div>
        <Button onClick={() => setModal({ type: 'create' })}>+ Add product</Button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[['all', 'All products'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`rounded-xl border px-4 py-3 text-left transition ${filter === key ? 'border-brand-500/30 bg-brand-500/5' : 'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.03]'}`}><p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">{counts[key]}</p></button>)}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="flex-1"><Input placeholder="Search name, SKU, barcode or category…" value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="flex items-center rounded-xl border border-black/[0.06] bg-white px-3 text-xs font-medium text-gray-500 dark:border-white/[0.08] dark:bg-white/[0.03]">Showing {filtered.length} of {products.length}</div></div>

      <ProductTable products={filtered} currency={currency} onEdit={(p) => setModal({ type: 'edit', product: p })} onArchive={(p) => setArchiveTarget(p)} />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.product ? 'Edit product' : 'New product'} size="xl"><ProductForm initial={modal?.product} onSubmit={handleSave} onCancel={() => setModal(null)} loading={loading} /></Modal>
      <ConfirmModal open={!!archiveTarget} onClose={() => setArchiveTarget(null)} onConfirm={handleArchive} title="Archive product" message={`Archive "${archiveTarget?.name}"? It will be hidden from the POS.`} loading={loading} />
    </div>
  );
}
