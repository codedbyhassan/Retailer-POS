import { serverDb } from '../config/db.js';
import * as syncService from '../services/syncService.js';

export const syncQueue = (req, res) => {
  try {
    const user = req.user;
    const { queue } = req.body;

    if (!queue || !Array.isArray(queue)) {
      return res.status(400).json({ error: 'Invalid sync payload' });
    }

    console.log(`[SyncEngine] Processing ${queue.length} items from ${user.name} (${user.role})`);
    
    const syncedIds = syncService.processSyncQueue(user, queue);

    res.json({
      success: true,
      syncedIds,
      serverProducts: serverDb.getProducts(),
      serverSettings: serverDb.getSettings(),
      serverUsers: serverDb.getUsers().map(({ passwordHash, ...rest }) => rest),
      serverSales: serverDb.getSales(),
      serverInventoryLogs: serverDb.getInventoryLogs()
    });
  } catch (error) {
    console.error('[SyncEngine] Critical failure processing sync request:', error);
    res.status(500).json({ error: 'Failed to process sync queue' });
  }
};
