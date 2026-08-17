import Badge, { stockBadge, stockLabel } from '../ui/Badge';
import { formatCurrency } from '../../utils/formatCurrency';
import { getProductImageSrc } from '../../utils/imageUtils';

export default function ProductTable({ products, onEdit, onArchive, currency = 'USD' }) {
  if (!products.length) return <div className="rounded-2xl border border-dashed border-black/[0.1] bg-white p-14 text-center dark:border-white/[0.1] dark:bg-white/[0.03]"><p className="text-base font-semibold text-gray-700 dark:text-gray-200">No products found</p><p className="mt-1 text-sm text-gray-400">Try another search or add a new product.</p></div>;

  return <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm dark:border-white/[0.08] dark:bg-surface-dark">
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
      <thead className="border-b border-black/[0.06] bg-gray-50/80 dark:border-white/[0.08] dark:bg-white/[0.03]"><tr>{['Product','SKU / Barcode','Category','Price','Stock','Status',''].map((h, i) => <th key={h || i} className={`px-4 py-3 text-${i >= 3 && i <= 4 ? 'right' : 'left'} text-[11px] font-bold uppercase tracking-wide text-gray-400`}>{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06]">{products.map((p) => <tr key={p.id} className="group transition hover:bg-gray-50/80 dark:hover:bg-white/[0.025]">
        <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.06]">{getProductImageSrc(p) ? <img src={getProductImageSrc(p)} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-bold text-gray-400">{p.name?.slice(0,1)?.toUpperCase() || 'P'}</div>}</div><div className="min-w-0"><p className="truncate font-semibold text-gray-900 dark:text-white">{p.name}</p><p className="text-xs text-gray-400">Cost {formatCurrency(p.cost_price || 0, currency)}</p></div></div></td>
        <td className="px-4 py-3"><p className="font-medium text-gray-700 dark:text-gray-300">{p.sku || '—'}</p><p className="text-xs text-gray-400">{p.barcode || 'No barcode'}</p></td>
        <td className="px-4 py-3 text-gray-500">{p.category || 'Uncategorised'}</td>
        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.selling_price, currency)}</td>
        <td className="px-4 py-3 text-right font-bold">{p.quantity}</td>
        <td className="px-4 py-3"><Badge variant={stockBadge(p.quantity, p.reorder_level)}>{stockLabel(p.quantity, p.reorder_level)}</Badge></td>
        <td className="px-4 py-3 text-right"><div className="flex justify-end gap-2 opacity-70 transition group-hover:opacity-100"><button onClick={() => onEdit(p)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-500/10">Edit</button><button onClick={() => onArchive(p)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10">Archive</button></div></td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}
