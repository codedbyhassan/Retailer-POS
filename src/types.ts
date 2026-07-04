export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
  active: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  cashierId: string;
  cashierName: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: 'CASH' | 'MOBILE_MONEY' | 'CARD';
  createdAt: string;
  items: SaleItem[];
  status: 'pending' | 'synced'; // local storage sync state
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
  createdAt: string;
}

export interface BusinessSettings {
  businessName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  receiptFooter: string;
}

export interface SyncQueueItem {
  id: string;
  action: 'CREATE_PRODUCT' | 'UPDATE_PRODUCT' | 'ARCHIVE_PRODUCT' | 'ADJUST_STOCK' | 'CREATE_SALE';
  payload: any;
  status: 'pending' | 'synced';
  createdAt: string;
}
