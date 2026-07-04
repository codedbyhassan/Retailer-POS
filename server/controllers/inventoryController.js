import * as inventoryService from '../services/inventoryService.js';

export const getInventory = (req, res) => {
  try {
    const logs = inventoryService.getInventoryLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve inventory logs' });
  }
};

export const adjustStock = (req, res) => {
  try {
    const { productId, type, quantity, reason, createdAt } = req.body;
    if (!productId || !type || quantity === undefined) {
      return res.status(400).json({ error: 'Product ID, type, and quantity are required' });
    }

    const log = inventoryService.addInventoryLog({ productId, type, quantity, reason, createdAt });
    if (!log) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: 'Failed to adjust stock' });
  }
};
