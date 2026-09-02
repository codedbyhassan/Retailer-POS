import { supabase, isSupabaseConfigured } from '../config/db.js';
import { logger } from '../utils/logger.js';

const memoryStore = {
  products: [],
  sales: [],
  inventory_logs: [],
  sale_items: [],
};

export async function applySyncAction(item) {
  const { action, payload } = item;
  logger('info', 'Applying sync action', { action, id: item.id });

  if (!isSupabaseConfigured()) return applyToMemory(action, payload);

  let result;
  switch (action) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT':
      result = await supabase.from('products').upsert(mapProduct(payload));
      break;

    case 'ARCHIVE_PRODUCT':
      result = await supabase
        .from('products')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('id', payload.id);
      break;

    case 'CREATE_SALE': {
      const { data, error } = await supabase.rpc('apply_sale_atomic', {
        p_sale: mapSale(payload.sale),
        p_items: (payload.items || []).map(mapSaleItem),
      });
      if (error) {
        logger('error', 'Atomic sale sync failed', { id: item.id, error: error.message });
        throw error;
      }
      return data || { ok: true };
    }

    case 'INVENTORY_ADJUST': {
      const { data, error } = await supabase.rpc('apply_inventory_adjustment_atomic', {
        p_log: mapInventoryLog(payload),
        p_actor_id: item.actor_id || null,
      });
      if (error) {
        logger('error', 'Atomic inventory sync failed', { id: item.id, error: error.message });
        throw error;
      }
      return data || { ok: true };
    }

    default:
      throw new Error(`Unknown sync action: ${action}`);
  }

  if (result.error) throw result.error;
  await recordAudit(item);
  return result;
}

async function recordAudit(item) {
  try {
    const payload = item.payload || {};
    await supabase.from('audit_logs').upsert({
      id: `sync_${item.id}`,
      action: item.action,
      entity_type: item.action.includes('PRODUCT') ? 'product' : 'inventory',
      entity_id: payload.id || payload.product_id || item.id,
      actor_id: item.actor_id || payload.actor_id || null,
      metadata: { sync_id: item.id },
      created_at: item.createdAt || new Date().toISOString(),
    });
  } catch (error) {
    logger('warn', 'Audit log write failed', { id: item.id, error: error.message });
  }
}

function applyToMemory(action, payload) {
  switch (action) {
    case 'CREATE_PRODUCT':
    case 'UPDATE_PRODUCT': {
      const existing = memoryStore.products.find((p) => p.id === payload.id);
      if (existing) Object.assign(existing, payload);
      else memoryStore.products.push(payload);
      return { ok: true };
    }

    case 'CREATE_SALE': {
      if (memoryStore.sales.some((sale) => sale.id === payload.sale.id)) return { ok: true, is_duplicate: true };

      for (const item of payload.items || []) {
        const product = memoryStore.products.find((p) => p.id === item.product_id);
        if (product && product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.name}`);
      }

      for (const item of payload.items || []) {
        const product = memoryStore.products.find((p) => p.id === item.product_id);
        if (!product) throw new Error(`Product unavailable: ${item.product_id}`);
        product.quantity -= item.quantity;
        memoryStore.sale_items.push(mapSaleItem(item));
        memoryStore.inventory_logs.push(mapInventoryLog({
          id: `sale_${payload.sale.id}_${item.product_id}`,
          product_id: item.product_id,
          type: 'SALE',
          quantity: -item.quantity,
          reference_id: payload.sale.id,
          reference_type: 'sale',
          created_at: payload.sale.created_at,
        }));
      }

      memoryStore.sales.push(payload.sale);
      return { ok: true, is_duplicate: false };
    }

    case 'INVENTORY_ADJUST': {
      const product = memoryStore.products.find((p) => p.id === payload.product_id);
      if (!product) throw new Error(`Product unavailable: ${payload.product_id}`);
      const delta = Number(payload.quantity);
      if (!Number.isInteger(delta) || delta === 0) throw new Error('Inventory adjustment quantity cannot be zero');
      if (product.quantity + delta < 0) throw new Error(`Inventory cannot become negative for ${product.name}`);
      if (memoryStore.inventory_logs.some((log) => log.id === payload.id)) return { ok: true, is_duplicate: true };
      product.quantity += delta;
      memoryStore.inventory_logs.push(mapInventoryLog(payload));
      return { ok: true, is_duplicate: false, new_quantity: product.quantity };
    }

    default:
      throw new Error(`Unknown sync action: ${action}`);
  }
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
    updated_at: p.updated_at || new Date().toISOString(),
  };
}

function mapSale(s) {
  return {
    id: s.id,
    invoice_number: s.invoice_number,
    cashier_id: s.cashier_id,
    cashier_email: s.cashier_email,
    cashier_name: s.cashier_name,
    subtotal: s.subtotal,
    discount: s.discount,
    discount_amount: s.discount_amount,
    tax_rate: s.tax_rate,
    tax_amount: s.tax_amount,
    total: s.total,
    payment_method: s.payment_method,
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
    cost_price: i.cost_price,
    subtotal: i.subtotal,
    product_name: i.product_name,
  };
}

function mapInventoryLog(l) {
  const quantity = Number(l.quantity);
  if (!Number.isInteger(quantity) || quantity === 0) throw new Error('Inventory adjustment quantity must be a non-zero integer');
  return {
    id: l.id || `inv_${Date.now()}_${l.product_id}`,
    product_id: l.product_id,
    type: l.type || 'ADJUSTMENT',
    quantity,
    reference_id: l.reference_id,
    reference_type: l.reference_type || 'inventory_adjustment',
    created_at: l.created_at || new Date().toISOString(),
  };
}
