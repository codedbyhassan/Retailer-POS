import { supabase } from '../../lib/supabase';

const defaults = {
  business_name: 'My Retail Shop',
  currency: 'GHS',
  tax_rate: 0,
  receipt_footer: 'Thank you for shopping with us!',
  low_stock_threshold: 10,
  preset: 'classic-blue',
};

export async function getBusinessSettings() {
  const { data, error } = await supabase.from('business_settings').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return { ...defaults, ...(data || {}) };
}

export async function saveBusinessSettings(settings) {
  const { data, error } = await supabase.from('business_settings').upsert({ id: 1, ...settings }).select().single();
  if (error) throw error;
  return data;
}
