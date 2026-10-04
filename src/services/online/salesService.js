import { supabase } from '../../lib/supabase';

export async function createSale({ sale, items }) {
  const { data, error } = await supabase.rpc('create_sale', {
    p_sale: sale,
    p_items: items,
  });
  if (error) throw error;
  return data;
}

export async function listSales({ from, to } = {}) {
  let query = supabase
    .from('sales')
    .select('*, sale_items(*)')
    .order('created_at', { ascending: false });
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getSale(id) {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}
