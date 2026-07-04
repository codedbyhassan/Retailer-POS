import { serverDb } from '../config/db.js';

export const getAllProducts = () => {
  return serverDb.getProducts();
};

export const createProduct = (payload, createdAt) => {
  const newProd = {
    id: payload.id || `prod_${Date.now()}`,
    name: payload.name,
    sku: payload.sku,
    barcode: payload.barcode,
    category: payload.category || 'General',
    costPrice: Number(payload.costPrice),
    sellingPrice: Number(payload.sellingPrice),
    quantity: Number(payload.quantity || 0),
    reorderLevel: Number(payload.reorderLevel || 5),
    archived: false,
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  serverDb.addProduct(newProd);
  
  // Log inventory entry
  serverDb.addInventoryLog({
    id: `log_sync_${payload.id || Date.now()}`,
    productId: newProd.id,
    productName: newProd.name,
    type: 'IN',
    quantity: newProd.quantity,
    reason: 'Product Created (Offline Sync)',
    createdAt: createdAt || new Date().toISOString()
  });
  return newProd;
};

export const updateProduct = (payload) => {
  const existing = serverDb.getProducts().find(p => p.id === payload.id);
  if (existing) {
    const updated = {
      ...existing,
      name: payload.name || existing.name,
      sku: payload.sku || existing.sku,
      barcode: payload.barcode || existing.barcode,
      category: payload.category || existing.category,
      costPrice: payload.costPrice !== undefined ? Number(payload.costPrice) : existing.costPrice,
      sellingPrice: payload.sellingPrice !== undefined ? Number(payload.sellingPrice) : existing.sellingPrice,
      reorderLevel: payload.reorderLevel !== undefined ? Number(payload.reorderLevel) : existing.reorderLevel,
      updatedAt: new Date().toISOString()
    };
    serverDb.updateProduct(updated);
    return updated;
  }
  return null;
};

export const archiveProduct = (id) => {
  const existing = serverDb.getProducts().find(p => p.id === id);
  if (existing) {
    existing.archived = true;
    existing.updatedAt = new Date().toISOString();
    serverDb.updateProduct(existing);
    return existing;
  }
  return null;
};
