import { serverDb } from '../config/db.js';

export const getSales = () => {
  return serverDb.getSales();
};

export const createSale = (user, saleData) => {
  const {
    id,
    invoiceNumber,
    total,
    subtotal,
    taxAmount,
    discountAmount,
    paymentMethod,
    items,
    createdAt
  } = saleData;

  const saleId = id || `sale_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newSale = {
    id: saleId,
    invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-8)}`,
    cashierId: user.id,
    cashierName: user.name,
    total: Number(total),
    subtotal: Number(subtotal),
    taxAmount: Number(taxAmount || 0),
    discountAmount: Number(discountAmount || 0),
    paymentMethod: paymentMethod || 'CASH',
    createdAt: createdAt || new Date().toISOString(),
    items: items.map((item) => ({
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      saleId: saleId,
      productId: item.productId,
      productName: item.productName || 'Unknown Product',
      quantity: Number(item.quantity),
      price: Number(item.price),
      subtotal: Number(item.subtotal)
    }))
  };

  serverDb.addSale(newSale);
  return newSale;
};
