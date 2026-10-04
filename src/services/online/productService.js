import { supabase } from '../../lib/supabase';

export async function listProducts({ includeArchived = false } = {}) {
  let query = supabase.from('products').select('*').order('name');
  if (!includeArchived) query = query.eq('archived', false);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getProduct(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function searchProducts(query = '') {
  const products = await listProducts();
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter((p) =>
    [p.name, p.sku, p.barcode, p.category].some((value) => value?.toLowerCase().includes(q))
  );
}

export async function createProduct(product) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('business_id').eq('id', user.id).single();
  if (profileError) throw profileError;
  const { image: _image, image_data: _imageData, image_id: _imageId, ...input } = product;
  const payload = { ...input, business_id: profile.business_id, quantity: Number(input.quantity) || 0, cost_price: Number(input.cost_price) || 0, selling_price: Number(input.selling_price) || 0, reorder_level: Number(input.reorder_level) || 10 };
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, changes) {
  const { quantity: _quantity, image: _image, image_data: _imageData, image_id: _imageId, ...safeChanges } = changes;
  const { data, error } = await supabase.from('products').update(safeChanges).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function archiveProduct(id) {
  return updateProduct(id, { archived: true });
}

export async function getLowStockProducts() {
  const products = await listProducts();
  return products.filter((p) => p.quantity <= (p.reorder_level ?? 10));
}
