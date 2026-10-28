import { useEffect, useState } from 'react';
import { listProducts, createProduct, updateProduct, archiveProduct } from '../../services/online/productService';
import { useBusinessSettings } from '../../hooks/useBusinessSettings';
import ProductTable from '../../components/tables/ProductTable';
import ProductForm from '../../components/forms/ProductForm';
import Modal, { ConfirmModal } from '../../components/ui/Modal';
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
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const toast = useToast();

  const load = async () => {
    setPageLoading(true);
    setLoadError('');
    try {
      const result = await listProducts();
      setProducts(result);
    } catch (error) {
      setLoadError(error?.message || 'Unable to load products right now.');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = products.filter((product) =>
    !normalizedSearch ||
    product.name?.toLowerCase().includes(normalizedSearch) ||
    product.sku?.toLowerCase().includes(normalizedSearch) ||
    product.barcode?.toLowerCase().includes(normalizedSearch)
  );

  const handleSave = async (data) => {
    setLoading(true);
    try {
      if (modal?.product) {
        await updateProduct(modal.product.id, { ...data, quantity: modal.product.quantity });
        toast.success('Product updated');
      } else {
        await createProduct(data);
        toast.success('Product created');
      }
      setModal(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget || loading) return;
    setLoading(true);
    try {
      await archiveProduct(archiveTarget.id);
      toast.success('Product archived');
      setArchiveTarget(null);
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
          <h2>Products</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your catalogue, pricing and stock.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setModal({ type: 'create' })}>Add Product</Button>
      </div>

      <div className="mb-4 max-w-xl">
        <Input
          label="Search products"
          type="search"
          autoComplete="off"
          placeholder="Search by name, SKU or barcode"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-300">Products could not be loaded</p>
          <p className="mt-1 break-words text-sm text-red-700 dark:text-red-400">{loadError}</p>
          <Button className="mt-4" variant="secondary" onClick={load} disabled={pageLoading}>Try again</Button>
        </div>
      ) : pageLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading products">
          <div className="h-12 animate-pulse rounded-xl bg-black/[0.04] dark:bg-white/[0.06]" />
          <div className="h-64 animate-pulse rounded-2xl border border-black/[0.04] bg-white dark:border-white/[0.06] dark:bg-surface-dark" />
        </div>
      ) : (
        <ProductTable
          products={filtered}
          currency={currency}
          emptyTitle={normalizedSearch ? 'No matching products' : 'No products yet'}
          emptyDescription={normalizedSearch ? 'Try another name, SKU or barcode.' : 'Add your first product to get started.'}
          onEdit={(product) => setModal({ type: 'edit', product })}
          onArchive={(product) => setArchiveTarget(product)}
        />
      )}

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
        message={'Archive "' + (archiveTarget?.name || 'this product') + '"? It will be hidden from the POS.'}
        loading={loading}
      />
    </div>
  );
}
