import { Product, Sale, InventoryLog, BusinessSettings, User, SyncQueueItem } from '../../types.js';

const DB_NAME = 'retailer_db';
const DB_VERSION = 1;

export class IndexedDBService {
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  private init(): Promise<IDBDatabase> {
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

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Generic methods
  public async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  public async get<T>(storeName: string, id: string): Promise<T | null> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async put<T>(storeName: string, data: T): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Specialized Helper Methods
  public async getProducts(): Promise<Product[]> {
    const products = await this.getAll<Product>('products');
    // Return non-archived products
    return products.filter(p => !p.archived);
  }

  public async saveProduct(product: Product): Promise<void> {
    await this.put<Product>('products', product);
  }

  public async getSales(): Promise<Sale[]> {
    return this.getAll<Sale>('sales');
  }

  public async saveSale(sale: Sale): Promise<void> {
    await this.put<Sale>('sales', sale);
  }

  public async getInventoryLogs(): Promise<InventoryLog[]> {
    return this.getAll<InventoryLog>('inventory_logs');
  }

  public async saveInventoryLog(log: InventoryLog): Promise<void> {
    await this.put<InventoryLog>('inventory_logs', log);
  }

  public async getSettings(): Promise<BusinessSettings | null> {
    const list = await this.getAll<any>('settings');
    const config = list.find(item => item.id === 'business_config');
    return config ? (config.data as BusinessSettings) : null;
  }

  public async saveSettings(settings: BusinessSettings): Promise<void> {
    await this.put<any>('settings', { id: 'business_config', data: settings });
  }

  public async getUsers(): Promise<User[]> {
    return this.getAll<User>('users');
  }

  public async saveUser(user: User): Promise<void> {
    await this.put<User>('users', user);
  }

  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>('sync_queue');
  }

  public async addSyncQueueItem(item: Omit<SyncQueueItem, 'status'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      status: 'pending'
    };
    await this.put<SyncQueueItem>('sync_queue', queueItem);
  }

  public async removeSyncQueueItem(id: string): Promise<void> {
    await this.delete('sync_queue', id);
  }

  // Pre-seed mock data on first load if empty
  public async seedIfEmpty(defaultProducts: Product[], defaultSettings: BusinessSettings, defaultUsers: User[]): Promise<void> {
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
