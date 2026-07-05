import { getDB } from './db';
import { generateId } from '../../utils/generateInvoiceNumber';
import { adjustProductQuantity } from './productsStore';

export async function getAllSales() {
  const db = await getDB();
  const sales = await db.getAll('sales');
  return sales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function getSaleById(id) {
  const db = await getDB();
  return db.get('sales', id);
}

export async function getSaleItems(saleId) {
  const db = await getDB();
  return db.getAllFromIndex('sale_items', 'sale_id', saleId);
}

export async function createSale({ sale, items }) {
  const db = await getDB();
  const tx = db.transaction(['sales', 'sale_items', 'products'], 'readwrite');

  await tx.objectStore('sales').add(sale);

  for (const item of items) {
    await tx.objectStore('sale_items').add(item);
    const product = await tx.objectStore('products').get(item.product_id);
    if (product) {
      await tx.objectStore('products').put({
        ...product,
        quantity: Math.max(0, product.quantity - item.quantity),
      });
    }
  }

  await tx.done;
  return sale;
}

export async function getSalesByDateRange(startDate, endDate) {
  const sales = await getAllSales();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime() + 86400000;
  return sales.filter((s) => {
    const t = new Date(s.created_at).getTime();
    return t >= start && t < end;
  });
}

export async function getSalesWithItems() {
  const sales = await getAllSales();
  const result = [];
  for (const sale of sales.reverse()) {
    const items = await getSaleItems(sale.id);
    result.push({ ...sale, items });
  }
  return result;
}

export async function getSaleDetail(id) {
  const sale = await getSaleById(id);
  if (!sale) return null;
  const items = await getSaleItems(id);
  const db = await getDB();
  const enrichedItems = await Promise.all(
    items.map(async (item) => {
      const product = await db.get('products', item.product_id);
      return { ...item, product_name: product?.name ?? 'Unknown' };
    })
  );
  return { ...sale, items: enrichedItems };
}
