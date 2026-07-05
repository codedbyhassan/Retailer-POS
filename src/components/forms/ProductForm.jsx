import { useState, useRef } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { validateProduct } from '../../utils/validators';
import { compressImage, getProductImageSrc } from '../../utils/imageUtils';

const empty = {
  name: '',
  sku: '',
  barcode: '',
  category: '',
  cost_price: '',
  selling_price: '',
  quantity: '',
  reorder_level: '10',
  image: '',
};

export default function ProductForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ ...empty, ...initial, image: getProductImageSrc(initial) || '' });
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState('');
  const fileRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: null });
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      const dataUrl = await compressImage(file);
      setForm({ ...form, image: dataUrl });
    } catch (err) {
      setImageError(err.message);
    }
  };

  const removeImage = () => {
    setForm({ ...form, image: '' });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validateProduct(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="rounded-2xl border border-black/[0.06] bg-black/[0.02] p-4 dark:border-white/[0.08] dark:bg-white/[0.03]">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white dark:bg-black/20">
            {form.image ? (
              <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs font-medium text-gray-400">No image</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Product Image</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-500/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-700 dark:file:text-brand-300" />
            {form.image && (
              <Button type="button" variant="ghost" size="sm" onClick={removeImage}>Remove image</Button>
            )}
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            <p className="text-xs text-gray-400">Stored locally in IndexedDB. JPG/PNG, auto-compressed.</p>
          </div>
        </div>

        <div className="grid content-start gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Input label="Product Name" name="name" value={form.name} onChange={handleChange} error={errors.name} required />
          </div>
          <Input label="SKU" name="sku" value={form.sku} onChange={handleChange} />
          <Input label="Barcode" name="barcode" value={form.barcode} onChange={handleChange} />
          <div className="md:col-span-2">
            <Input label="Category" name="category" value={form.category} onChange={handleChange} />
          </div>
          <Input label="Cost Price" name="cost_price" type="number" step="0.01" value={form.cost_price} onChange={handleChange} error={errors.cost_price} />
          <Input label="Selling Price" name="selling_price" type="number" step="0.01" value={form.selling_price} onChange={handleChange} error={errors.selling_price} />
          <Input label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} />
          <Input label="Reorder Level" name="reorder_level" type="number" value={form.reorder_level} onChange={handleChange} />
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Product'}</Button>
      </div>
    </form>
  );
}
