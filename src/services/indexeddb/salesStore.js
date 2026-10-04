import { getDB } from './db';
import { generateId } from '../../utils/generateInvoiceNumber';

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
  if (!sale?.id || !items?.length) throw new Error('A sale must contain at least one item');

  const db = await getDB();
  const tx = db.transaction(['sales', 'sale_items', 'products', 'inventory_logs', 'audit_logs'], 'readwrite');

  // Validate the complete sale before mutating any stock. IndexedDB transactions
  // then commit the sale, items and stock movements together or not at all.
  const products = new Map();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error(`Invalid quantity for ${item.product_name || item.product_id}`);
    }

    const product = await tx.objectStore('products').get(item.product_id);
    if (!product || product.archived) {
      throw new Error(`Product unavailable: ${item.product_name || item.product_id}`);
    }
    if (product.quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
    }
    products.set(item.product_id, product);
  }

  const pendingSale = { ...sale, sync_status: sale.sync_status || 'pending' };\n  await tx.objectStore('sales').add(pendingSale);

  for (const item of items) {
    await tx.objectStore('sale_items').add(item);
    const product = products.get(item.product_id);
    const nextQuantity = product.quantity - item.quantity;

    await tx.objectStore('products').put({
      ...product,
      quantity: nextQuantity,
      updated_at: new Date().toISOString(),
    });

    await tx.objectStore('inventory_logs').add({
      id: generateId('inv'),
      product_id: product.id,
      type: 'SALE',
      quantity: -item.quantity,
      reference_id: sale.id,
      reference_type: 'sale',
      created_at: sale.created_at,
    });
  }

  await tx.objectStore('audit_logs').add({
    id: generateId('audit'),
    action: 'CREATE_SALE',
    entity_type: 'sale',
    entity_id: sale.id,
    actor_id: sale.cashier_id,
    metadata: { invoice_number: sale.invoice_number, total: sale.total, item_count: items.length },
    created_at: sale.created_at,
  });

  await tx.done;
  return pendingSale;
}

export async function getSalesByDateRange(startDate, endDate) {
  const sales = await getAllSales();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime() + 86400000;
  return sales.filter((s) => s.sync_status !== 'voided').filter((s) => {
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
