import { serverDb } from '../config/db.js';
import { createProduct, updateProduct, archiveProduct } from './productService.js';
import { addInventoryLog } from './inventoryService.js';
import { createSale } from './salesService.js';

export const processSyncQueue = (user, queue) => {
  const syncedIds = [];

  // Sort queue items chronologically to process operations in exact sequence of occurrence
  const sortedQueue = [...queue].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  for (const item of sortedQueue) {
    try {
      const { id, action, payload, createdAt } = item;

      if (action === 'CREATE_PRODUCT') {
        const barcodeExists = serverDb.getProducts().some(p => p.barcode === payload.barcode && !p.archived);
        const skuExists = serverDb.getProducts().some(p => p.sku === payload.sku && !p.archived);
        
        if (!barcodeExists && !skuExists) {
          createProduct(payload, createdAt);
        }
      } 
      
      else if (action === 'UPDATE_PRODUCT') {
        updateProduct(payload);
      } 
      
      else if (action === 'ARCHIVE_PRODUCT') {
        archiveProduct(payload.id);
      } 
      
      else if (action === 'ADJUST_STOCK') {
        const existing = serverDb.getProducts().find(p => p.id === payload.productId);
        if (existing) {
          addInventoryLog({
            productId: payload.productId,
            type: payload.type,
            quantity: Number(payload.quantity),
            reason: payload.reason || 'Offline stock adjustment',
            createdAt: createdAt || new Date().toISOString()
          });
        }
      } 
      
      else if (action === 'CREATE_SALE') {
        const saleExists = serverDb.getSales().some(s => s.id === payload.id || s.invoiceNumber === payload.invoiceNumber);
        if (!saleExists) {
          createSale(user, payload);
        }
      }

      syncedIds.push(id);
    } catch (err) {
      console.error(`[SyncEngine] Error syncing item ${item.id}:`, err);
    }
  }

  // Force server database save to trigger disk persistence
  serverDb.save();

  return syncedIds;
};
