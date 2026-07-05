import { getDB } from './db';
import { generateId } from '../../utils/generateInvoiceNumber';

async function saveProductImage(db, productId, currentImageId, imageData) {
  if (imageData === undefined) return currentImageId || null;

  if (!imageData) {
    if (currentImageId) await db.delete('product_images', currentImageId);
    return null;
  }

  const imageId = currentImageId || generateId('img');
  await db.put('product_images', {
    id: imageId,
    product_id: productId,
    data_url: imageData,
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  return imageId;
}

async function attachImages(products) {
  const db = await getDB();
  return Promise.all(
    products.map(async (product) => {
      if (product.image) return product;
      const image = product.image_id ? await db.get('product_images', product.image_id) : null;
      return { ...product, image: image?.data_url || product.image_data || null };
    })
  );
}

export async function getAllProducts(includeArchived = false) {
  const db = await getDB();
  const products = await db.getAll('products');
  const visible = includeArchived ? products : products.filter((p) => !p.archived);
  return attachImages(visible);
}

export async function getProductById(id) {
  const db = await getDB();
  const product = await db.get('products', id);
  if (!product) return null;
  const [withImage] = await attachImages([product]);
  return withImage;
}

export async function searchProducts(query) {
  const products = await getAllProducts();
  const q = query.toLowerCase().trim();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(q) ||
      p.category?.toLowerCase().includes(q)
  );
}

export async function createProduct(data) {
  const db = await getDB();
  const id = generateId('prod');
  const imageId = await saveProductImage(db, id, null, data.image);
  const product = {
    id,
    ...data,
    image: undefined,
    image_data: undefined,
    image_id: imageId,
    quantity: Number(data.quantity) || 0,
    cost_price: Number(data.cost_price) || 0,
    selling_price: Number(data.selling_price) || 0,
    reorder_level: Number(data.reorder_level) || 10,
    archived: false,
    created_at: new Date().toISOString(),
  };
  await db.add('products', product);
  return product;
}

export async function updateProduct(id, data) {
  const db = await getDB();
  const existing = await db.get('products', id);
  if (!existing) throw new Error('Product not found');
  const imageId = await saveProductImage(db, id, existing.image_id, data.image);
  const updated = {
    ...existing,
    ...data,
    id,
    image: undefined,
    image_data: undefined,
    image_id: imageId,
    quantity: Number(data.quantity) || 0,
    cost_price: Number(data.cost_price) || 0,
    selling_price: Number(data.selling_price) || 0,
    reorder_level: Number(data.reorder_level) || 10,
    updated_at: new Date().toISOString(),
  };
  await db.put('products', updated);
  const [withImage] = await attachImages([updated]);
  return withImage;
}

export async function archiveProduct(id) {
  return updateProduct(id, { archived: true });
}

export async function getLowStockProducts() {
  const products = await getAllProducts();
  return products.filter((p) => p.quantity <= (p.reorder_level ?? 10));
}

export async function adjustProductQuantity(productId, delta) {
  const db = await getDB();
  const product = await db.get('products', productId);
  if (!product) throw new Error('Product not found');
  const updated = { ...product, quantity: Math.max(0, product.quantity + delta) };
  await db.put('products', updated);
  return updated;
}
