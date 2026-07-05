import { getDB } from './db';
import { generateId } from '../../utils/generateInvoiceNumber';
import { adjustProductQuantity } from './productsStore';

export async function getAllInventoryLogs() {
  const db = await getDB();
  const logs = await db.getAllFromIndex('inventory_logs', 'created_at');
  return logs.reverse();
}

export async function getInventoryLogsByProduct(productId) {
  const db = await getDB();
  return db.getAllFromIndex('inventory_logs', 'product_id', productId);
}

export async function addInventoryLog({ product_id, type, quantity, note = '' }) {
  const db = await getDB();
  const log = {
    id: generateId('inv'),
    product_id,
    type,
    quantity: Number(quantity),
    note,
    created_at: new Date().toISOString(),
  };

  const delta = type === 'remove' ? -quantity : Number(quantity);
  await adjustProductQuantity(product_id, delta);
  await db.add('inventory_logs', log);
  return log;
}

export async function getInventorySummary() {
  const db = await getDB();
  const products = await db.getAll('products');
  const active = products.filter((p) => !p.archived);
  const totalValue = active.reduce((sum, p) => sum + p.cost_price * p.quantity, 0);
  const lowStock = active.filter((p) => p.quantity <= (p.reorder_level ?? 10));
  return { products: active, totalValue, lowStock };
}
