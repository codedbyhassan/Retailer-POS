import { getDB } from './db';
import { generateId } from '../../utils/generateInvoiceNumber';

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
  const delta = Number(quantity);
  if (!product_id) throw new Error('Product is required');
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Inventory adjustment must be a non-zero integer');

  const log = {
    id: generateId('inv'),
    product_id,
    type: type || 'ADJUSTMENT',
    quantity: delta,
    note,
    created_at: new Date().toISOString(),
  };

  const tx = db.transaction(['products', 'inventory_logs', 'audit_logs'], 'readwrite');
  const product = await tx.objectStore('products').get(product_id);
  if (!product) {
    tx.abort();
    throw new Error('Product not found');
  }
  if (product.archived) {
    tx.abort();
    throw new Error('Cannot adjust archived product');
  }

  const nextQuantity = Number(product.quantity || 0) + delta;
  if (nextQuantity < 0) {
    tx.abort();
    throw new Error(`Inventory cannot become negative for ${product.name}`);
  }

  await tx.objectStore('products').put({ ...product, quantity: nextQuantity, updated_at: new Date().toISOString() });
  await tx.objectStore('inventory_logs').add(log);
  await tx.objectStore('audit_logs').add({
    id: `audit_${log.id}`,
    action: 'INVENTORY_ADJUST',
    entity_type: 'product',
    entity_id: product_id,
    metadata: { delta, type: log.type, note },
    created_at: log.created_at,
  });
  await tx.done;
  return log;
}

export async function getInventorySummary() {
  const db = await getDB();
  const products = await db.getAll('products');
  const active = products.filter((p) => !p.archived);
  const totalValue = active.reduce((sum, p) => sum + (Number(p.cost_price) || 0) * (Number(p.quantity) || 0), 0);
  const lowStock = active.filter((p) => p.quantity <= (p.reorder_level ?? 10));
  return { products: active, totalValue, lowStock };
}
