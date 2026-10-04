import { supabase } from '../../lib/supabase';

export async function listInventoryLogs({ productId } = {}) {
  let query = supabase.from('inventory_movements').select('*').order('created_at', { ascending: false });
  if (productId) query = query.eq('product_id', productId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function adjustInventory({ product_id, delta, type = 'ADJUSTMENT', note = '' }) {
  const { data, error } = await supabase.rpc('adjust_inventory', {
    p_product_id: product_id,
    p_delta: Number(delta),
    p_type: type,
    p_note: note,
  });
  if (error) throw error;
  return data;
}

export async function getInventorySummary() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,quantity,cost_price,reorder_level,archived')
    .eq('archived', false);
  if (error) throw error;
  const products = data || [];
  const totalValue = products.reduce((sum, p) => sum + Number(p.cost_price || 0) * Number(p.quantity || 0), 0);
  return { products, totalValue, lowStock: products.filter((p) => p.quantity <= (p.reorder_level ?? 10)) };
}
