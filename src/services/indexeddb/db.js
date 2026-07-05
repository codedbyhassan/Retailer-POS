import { openDB } from 'idb';
import { generateId } from '../../utils/generateInvoiceNumber';

const DB_NAME = 'retailer_db';
const DB_VERSION = 2;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        const products = db.createObjectStore('products', { keyPath: 'id' });
        products.createIndex('sku', 'sku', { unique: false });
        products.createIndex('barcode', 'barcode', { unique: false });
        products.createIndex('archived', 'archived', { unique: false });
      }

      if (!db.objectStoreNames.contains('product_images')) {
        const images = db.createObjectStore('product_images', { keyPath: 'id' });
        images.createIndex('product_id', 'product_id', { unique: false });
        images.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains('sales')) {
        const sales = db.createObjectStore('sales', { keyPath: 'id' });
        sales.createIndex('invoice_number', 'invoice_number', { unique: true });
        sales.createIndex('cashier_id', 'cashier_id', { unique: false });
        sales.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains('sale_items')) {
        const items = db.createObjectStore('sale_items', { keyPath: 'id' });
        items.createIndex('sale_id', 'sale_id', { unique: false });
        items.createIndex('product_id', 'product_id', { unique: false });
      }

      if (!db.objectStoreNames.contains('inventory_logs')) {
        const logs = db.createObjectStore('inventory_logs', { keyPath: 'id' });
        logs.createIndex('product_id', 'product_id', { unique: false });
        logs.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('users')) {
        const users = db.createObjectStore('users', { keyPath: 'id' });
        users.createIndex('email', 'email', { unique: true });
      }

      if (!db.objectStoreNames.contains('sync_queue')) {
        const queue = db.createObjectStore('sync_queue', { keyPath: 'id' });
        queue.createIndex('status', 'status', { unique: false });
        queue.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
}

export async function seedDatabase() {
  const db = await getDB();
  const userCount = await db.count('users');
  if (userCount > 0) return;

  const defaultUsers = [
    {
      id: generateId('user'),
      name: 'Admin User',
      email: 'admin@retailer.com',
      password: 'admin123',
      role: 'admin',
      active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: generateId('user'),
      name: 'Cashier User',
      email: 'cashier@retailer.com',
      password: 'cashier123',
      role: 'cashier',
      active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const tx = db.transaction(['users', 'settings', 'products'], 'readwrite');

  for (const user of defaultUsers) {
    await tx.objectStore('users').add(user);
  }

  await tx.objectStore('settings').put({
    key: 'business',
    value: {
      business_name: 'My Retail Shop',
      currency: 'USD',
      tax_rate: 10,
      receipt_footer: 'Thank you for shopping with us!',
      low_stock_threshold: 10,
      preset: 'classic-blue',
    },
  });

  const sampleProducts = [
    { name: 'Rice 5kg', sku: 'RICE-5KG', barcode: '8901234567890', category: 'Groceries', cost_price: 8, selling_price: 12, quantity: 50, reorder_level: 10 },
    { name: 'Cooking Oil 1L', sku: 'OIL-1L', barcode: '8901234567891', category: 'Groceries', cost_price: 3.5, selling_price: 5.5, quantity: 30, reorder_level: 8 },
    { name: 'Soft Drink 500ml', sku: 'DRINK-500', barcode: '8901234567892', category: 'Beverages', cost_price: 0.8, selling_price: 1.5, quantity: 100, reorder_level: 20 },
    { name: 'Bread Loaf', sku: 'BREAD-01', barcode: '8901234567893', category: 'Bakery', cost_price: 1.2, selling_price: 2, quantity: 25, reorder_level: 5 },
    { name: 'Soap Bar', sku: 'SOAP-01', barcode: '8901234567894', category: 'Personal Care', cost_price: 0.5, selling_price: 1, quantity: 5, reorder_level: 10 },
  ];

  for (const p of sampleProducts) {
    await tx.objectStore('products').add({
      id: generateId('prod'),
      ...p,
      archived: false,
      created_at: new Date().toISOString(),
    });
  }

  await tx.done;
}
