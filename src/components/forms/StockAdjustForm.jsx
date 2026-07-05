import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function StockAdjustForm({ products, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ product_id: '', type: 'add', quantity: '', note: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product_id) return setError('Select a product');
    if (!form.quantity || Number(form.quantity) <= 0) return setError('Enter a valid quantity');
    setError('');
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
        <select
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="">Select product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} (Qty: {p.quantity})</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900"
        >
          <option value="add">Add Stock</option>
          <option value="remove">Remove Stock</option>
        </select>
      </div>
      <Input label="Quantity" name="quantity" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
      <Input label="Note (optional)" name="note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Apply'}</Button>
      </div>
    </form>
  );
}
