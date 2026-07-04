import { localDb } from '../indexeddb/db';
import { apiClient } from '../api';

export class SyncEngine {
  private isSyncing = false;

  constructor() {
    // Listen for online events to automatically trigger synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[v0] SyncEngine: Network connection restored. Auto-syncing...');
        this.sync();
      });
    }
  }

  public async sync(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, error: 'Sync already in progress' };
    }

    // Check if browser reports offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, syncedCount: 0, error: 'No internet connection' };
    }

    if (!apiClient.isAuthenticated()) {
      return { success: false, syncedCount: 0, error: 'User is not logged in' };
    }

    this.isSyncing = true;
    this.dispatchEvent('sync-start');

    try {
      const queue = await localDb.getSyncQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        this.dispatchEvent('sync-complete', { syncedCount: 0 });
        return { success: true, syncedCount: 0 };
      }

      console.log(`[v0] SyncEngine: Syncing ${queue.length} offline operations with server...`);

      const response = await apiClient.syncData(queue);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data) {
        throw new Error('No data returned from server');
      }

      console.log('[v0] SyncEngine: Server processed sync queue successfully:', response.data);

      const { syncedIds, serverProducts, serverSettings, serverUsers, serverSales, serverInventoryLogs } = response.data;

      // 1. Remove successfully processed items from our local sync queue
      for (const id of syncedIds) {
        await localDb.removeSyncQueueItem(id);
      }

      // 2. Synchronize local products with server copy (server is the source of truth)
      if (serverProducts && Array.isArray(serverProducts)) {
        // Clear local products first, then insert new server list
        await localDb.clear('products');
        for (const prod of serverProducts) {
          await localDb.saveProduct(prod);
        }
      }

      // 3. Synchronize settings
      if (serverSettings) {
        await localDb.saveSettings(serverSettings);
      }

      // 4. Synchronize cashiers/users for offline auth caching
      if (serverUsers && Array.isArray(serverUsers)) {
        await localDb.clear('users');
        for (const user of serverUsers) {
          await localDb.saveUser(user);
        }
      }

      // 5. Optionally cache completed sales and logs
      if (serverSales && Array.isArray(serverSales)) {
        await localDb.clear('sales');
        for (const sale of serverSales) {
          // ensure we keep status synced
          await localDb.saveSale({ ...sale, status: 'synced' });
        }
      }
      if (serverInventoryLogs && Array.isArray(serverInventoryLogs)) {
        await localDb.clear('inventory_logs');
        for (const log of serverInventoryLogs) {
          await localDb.saveInventoryLog(log);
        }
      }

      localStorage.setItem('retailer_last_sync_time', new Date().toISOString());
      
      this.isSyncing = false;
      this.dispatchEvent('sync-complete', { syncedCount: syncedIds.length });
      this.dispatchEvent('db-updated');

      return { success: true, syncedCount: syncedIds.length };
    } catch (err: any) {
      console.error('[v0] SyncEngine failed:', err);
      this.isSyncing = false;
      this.dispatchEvent('sync-error', { error: err.message });
      return { success: false, syncedCount: 0, error: err.message };
    }
  }

  // Trigger outbound events via DOM so multiple React elements can listen
  private dispatchEvent(name: string, detail: any = {}) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(`retailer:${name}`, { detail });
      window.dispatchEvent(event);
    }
  }
}

export const syncEngine = new SyncEngine();
export default syncEngine;
