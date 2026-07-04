const DB_NAME = 'retailer_db';
const DB_VERSION = 1;

export class IndexedDBService {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('IndexedDB failed to open:', request.error);
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create products store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        
        // Create sales store
        if (!db.objectStoreNames.contains('sales')) {
          db.createObjectStore('sales', { keyPath: 'id' });
        }

        // Create inventory logs store
        if (!db.objectStoreNames.contains('inventory_logs')) {
          db.createObjectStore('inventory_logs', { keyPath: 'id' });
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id' });
        }

        // Create users store (for offline login caching)
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id' });
        }
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic methods
  async getAll(storeName) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, id) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, data) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Specialized Helper Methods
  async getProducts() {
    const products = await this.getAll('products');
    // Return non-archived products
    return products.filter(p => !p.archived);
  }

  async saveProduct(product) {
    await this.put('products', product);
  }

  async getSales() {
    return this.getAll('sales');
  }

  async saveSale(sale) {
    await this.put('sales', sale);
  }

  async getInventoryLogs() {
    return this.getAll('inventory_logs');
  }

  async saveInventoryLog(log) {
    await this.put('inventory_logs', log);
  }

  async getSettings() {
    const list = await this.getAll('settings');
    const config = list.find(item => item.id === 'business_config');
    return config ? config.data : null;
  }

  async saveSettings(settings) {
    await this.put('settings', { id: 'business_config', data: settings });
  }

  async getUsers() {
    return this.getAll('users');
  }

  async saveUser(user) {
    await this.put('users', user);
  }

  async getSyncQueue() {
    return this.getAll('sync_queue');
  }

  async addSyncQueueItem(item) {
    const queueItem = {
      ...item,
      status: 'pending'
    };
    await this.put('sync_queue', queueItem);
  }

  async removeSyncQueueItem(id) {
    await this.delete('sync_queue', id);
  }

  // Pre-seed mock data on first load if empty
  async seedIfEmpty(defaultProducts, defaultSettings, defaultUsers) {
    const existingProds = await this.getProducts();
    if (existingProds.length === 0) {
      console.log('[IndexedDB] Pre-seeding default products...');
      for (const p of defaultProducts) {
        await this.saveProduct(p);
      }
    }

    const existingSettings = await this.getSettings();
    if (!existingSettings) {
      console.log('[IndexedDB] Pre-seeding default settings...');
      await this.saveSettings(defaultSettings);
    }

    const existingUsers = await this.getUsers();
    if (existingUsers.length === 0) {
      console.log('[IndexedDB] Pre-seeding default users...');
      for (const u of defaultUsers) {
        await this.saveUser(u);
      }
    }
  }
}

export const localDb = new IndexedDBService();
