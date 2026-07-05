import { useEffect, useState } from 'react';
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
  const { currency } = useBusinessSettings();
  const [modal, setModal] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const load = async () => {
    const prods = await getAllProducts();
    setProducts(prods);
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.includes(search)
  );

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
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setLoading(true);
    try {
      await archiveProduct(archiveTarget.id);
      await addToSyncQueue('ARCHIVE_PRODUCT', { id: archiveTarget.id });
      toast.success('Product archived');
      setArchiveTarget(null);
      load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2>Products</h2>
        <Button onClick={() => setModal({ type: 'create' })}>Add Product</Button>
      </div>
      <div className="mb-4">
        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <ProductTable
        products={filtered}
        currency={currency}
        onEdit={(p) => setModal({ type: 'edit', product: p })}
        onArchive={(p) => setArchiveTarget(p)}
      />
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.product ? 'Edit Product' : 'New Product'} size="xl">
        <ProductForm
          initial={modal?.product}
          onSubmit={handleSave}
          onCancel={() => setModal(null)}
          loading={loading}
        />
      </Modal>
      <ConfirmModal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Archive Product"
        message={`Archive "${archiveTarget?.name}"? It will be hidden from the POS.`}
        loading={loading}
      />
    </div>
  );
}
