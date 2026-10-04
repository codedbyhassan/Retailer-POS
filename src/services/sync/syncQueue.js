import { getDB } from '../indexeddb/db';
import { generateId } from '../../utils/generateInvoiceNumber';

const MAX_RETRIES = 8;

export async function addToSyncQueue(action, payload) {
  const db = await getDB();
  const entry = {
    id: generateId('queue'),
    action,
    payload,
    idempotencyKey: payload?.idempotencyKey || (action === 'INVENTORY_ADJUST' ? payload?.id : null),
    status: 'pending',
    retryCount: 0,
    createdAt: new Date().toISOString(),
    nextRetryAt: new Date().toISOString(),
  };
  await db.add('sync_queue', entry);
  return entry;
}

export async function getPendingSyncItems() {
  const db = await getDB();
  const now = Date.now();
  const all = await db.getAll('sync_queue');

  return all
    .filter((item) => {
      if (item.status === 'pending') return true;
      if (item.status !== 'failed') return false;
      if ((item.retryCount || 0) >= MAX_RETRIES) return false;
      return !item.nextRetryAt || new Date(item.nextRetryAt).getTime() <= now;
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

export async function getSyncQueueCount() {
  return (await getPendingSyncItems()).length;
}

async function updateSaleSyncStatus(db, item, status) {
  if (item?.action !== 'CREATE_SALE' || !item.payload?.sale?.id) return;
  const sale = await db.get('sales', item.payload.sale.id);
  if (sale) await db.put('sales', { ...sale, sync_status: status });
}

async function reconcileRejectedInventoryAdjustment(db, item, error) {
  if (item?.action !== 'INVENTORY_ADJUST' || !item.payload?.product_id) return false;
  const log = item.payload;
  const product = await db.get('products', log.product_id);
  if (!product) return false;

  const delta = Number(log.quantity);
  if (!Number.isInteger(delta) || delta === 0) return false;

  const tx = db.transaction(['products', 'inventory_logs', 'audit_logs'], 'readwrite');
  const products = tx.objectStore('products');
  const inventory = tx.objectStore('inventory_logs');
  const audit = tx.objectStore('audit_logs');
  const current = await products.get(log.product_id);

  if (!current) {
    await tx.done;
    return false;
  }

  const restoredQuantity = Number.isInteger(log.before_quantity)
    ? log.before_quantity
    : Number(current.quantity || 0) - delta;
  if (restoredQuantity < 0) {
    await tx.done;
    return false;
  }

  const now = new Date().toISOString();
  await products.put({
    ...current,
    quantity: restoredQuantity,
    updated_at: now,
  });

  await inventory.add({
    id: generateId('inv'),
    product_id: log.product_id,
    type: 'ADJUSTMENT_REVERSAL',
    quantity: -delta,
    note: 'Reversed rejected cloud inventory adjustment',
    reference_id: log.id,
    reference_type: 'inventory_conflict',
    created_at: now,
  });

  await audit.add({
    id: generateId('audit'),
    action: 'REVERSE_CONFLICTED_INVENTORY_ADJUST',
    entity_type: 'product',
    entity_id: log.product_id,
    metadata: {
      adjustment_id: log.id,
      original_delta: delta,
      restored_quantity: restoredQuantity,
      reason: error instanceof Error ? error.message : String(error),
    },
    created_at: now,
  });

  await tx.done;
  return true;
}

async function reconcileRejectedSale(db, item, error) {
  if (item?.action !== 'CREATE_SALE' || !item.payload?.sale?.id) return false;
  const { sale, items = [] } = item.payload;
  const currentSale = await db.get('sales', sale.id);
  if (!currentSale || currentSale.status === 'voided') return false;

  const tx = db.transaction(['sales', 'products', 'inventory_logs', 'audit_logs'], 'readwrite');
  const sales = tx.objectStore('sales');
  const products = tx.objectStore('products');
  const inventory = tx.objectStore('inventory_logs');
  const audit = tx.objectStore('audit_logs');

  for (const line of items) {
    const product = await products.get(line.product_id);
    if (!product) continue;
    await products.put({
      ...product,
      quantity: product.quantity + line.quantity,
      updated_at: new Date().toISOString(),
    });
    await inventory.add({
      id: generateId('inv'),
      product_id: product.id,
      type: 'SALE_REVERSAL',
      quantity: line.quantity,
      reference_id: sale.id,
      reference_type: 'sale_conflict',
      created_at: new Date().toISOString(),
    });
  }

  await sales.put({
    ...currentSale,
    status: 'voided',
    sync_status: 'conflict',
    sync_error: error instanceof Error ? error.message : String(error),
    voided_at: new Date().toISOString(),
  });

  await audit.add({
    id: generateId('audit'),
    action: 'VOID_CONFLICTED_SALE',
    entity_type: 'sale',
    entity_id: sale.id,
    actor_id: sale.cashier_id,
    metadata: {
      invoice_number: sale.invoice_number,
      reason: error instanceof Error ? error.message : String(error),
      inventory_reversed: items.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
      })),
    },
    created_at: new Date().toISOString(),
  });

  await tx.done;
  return true;
}

export async function markSyncItemComplete(id) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (!item) return;

  await db.put('sync_queue', {
    ...item,
    status: 'completed',
    completedAt: new Date().toISOString(),
    error: null,
  });
  await updateSaleSyncStatus(db, item, 'synced');
}

export async function markSyncItemFailed(id, error) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (!item) return;

  const retryCount = (item.retryCount || 0) + 1;
  const delayMs = Math.min(60 * 60 * 1000, 5_000 * (2 ** Math.min(retryCount - 1, 8)));

  await db.put('sync_queue', {
    ...item,
    status: 'failed',
    error: error instanceof Error ? error.message : String(error),
    retryCount,
    nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
  });
}

export async function resetFailedItems() {
  const db = await getDB();
  const failed = await db.getAllFromIndex('sync_queue', 'status', 'failed');
  const tx = db.transaction('sync_queue', 'readwrite');
  for (const item of failed) {
    if ((item.retryCount || 0) < MAX_RETRIES) {
      await tx.store.put({
        ...item,
        status: 'pending',
        nextRetryAt: new Date().toISOString(),
      });
    }
  }
  await tx.done;
}

export async function markSyncItemConflict(id, error, details = {}) {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (!item) return;

  let reconciled = false;
  if (item.action === 'CREATE_SALE') {
    reconciled = await reconcileRejectedSale(db, item, error);
  } else if (item.action === 'INVENTORY_ADJUST') {
    reconciled = await reconcileRejectedInventoryAdjustment(db, item, error);
  }

  await db.put('sync_queue', {
    ...item,
    status: 'conflict',
    error: error instanceof Error ? error.message : String(error),
    conflict: {
      ...details,
      reconciled,
      detectedAt: new Date().toISOString(),
    },
  });
}

export async function getSyncConflicts() {
  const db = await getDB();
  return (await db.getAll('sync_queue'))
    .filter((item) => item.status === 'conflict')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function resolveSyncConflict(id, resolution = 'discard_local') {
  const db = await getDB();
  const item = await db.get('sync_queue', id);
  if (!item || item.status !== 'conflict') return false;

  if (resolution === 'discard_local') {
    await db.delete('sync_queue', id);
    return true;
  }

  if (resolution !== 'retry') return false;

  await db.put('sync_queue', {
    ...item,
    status: 'pending',
    retryCount: 0,
    nextRetryAt: new Date().toISOString(),
    error: null,
    conflict: null,
  });
  return true;
}
