import { supabase, isSupabaseConfigured } from '../config/db.js';
import { logger } from '../utils/logger.js';

const memoryStore = { products: [], sales: [], inventory_logs: [] };

export async function applySyncAction(item) {
  const { action, payload } = item;
  logger('info', 'Applying sync action', { action, id: item.id });

  if (!isSupabaseConfigured()) {
    return applyToMemory(action, payload);
  }

  switch (action) {
    case 'CREATE_PRODUCT':
      return supabase.from('products').upsert(mapProduct(payload));
    case 'UPDATE_PRODUCT':
      return supabase.from('products').upsert(mapProduct(payload));
    case 'ARCHIVE_PRODUCT':
      return supabase.from('products').update({ archived: true }).eq('id', payload.id);
    case 'CREATE_SALE':
      await supabase.from('sales').upsert(mapSale(payload.sale));
      if (payload.items?.length) {
        await supabase.from('sale_items').upsert(payload.items.map(mapSaleItem));
      }
      return { ok: true };
    case 'INVENTORY_ADJUST':
      return supabase.from('inventory_logs').upsert(mapInventoryLog(payload));
    default:
      logger('warn', 'Unknown sync action', { action });
      return { ok: true };
  }
}

function applyToMemory(action, payload) {
  switch (action) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT':
      memoryStore.products = memoryStore.products.filter((p) => p.id !== payload.id);
      memoryStore.products.push(payload);
      break;
    case 'CREATE_SALE':
      memoryStore.sales.push(payload.sale);
      break;
    case 'INVENTORY_ADJUST':
      memoryStore.inventory_logs.push(payload);
      break;
    default:
      break;
  }
  return { ok: true };
}

function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    category: p.category,
    cost_price: p.cost_price,
    selling_price: p.selling_price,
    quantity: p.quantity,
    reorder_level: p.reorder_level,
    image_id: p.image_id,
    archived: p.archived ?? false,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function mapSale(s) {
  return {
    id: s.id,
    invoice_number: s.invoice_number,
    cashier_id: s.cashier_id,
    total: s.total,
    created_at: s.created_at,
  };
}

function mapSaleItem(i) {
  return {
    id: i.id,
    sale_id: i.sale_id,
    product_id: i.product_id,
    quantity: i.quantity,
    price: i.price,
    subtotal: i.subtotal,
  };
}

function mapInventoryLog(l) {
  return {
    id: l.id,
    product_id: l.product_id,
    type: l.type,
    quantity: l.quantity,
    created_at: l.created_at,
  };
}
