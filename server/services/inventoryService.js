import { serverDb } from '../config/db.js';

export const getInventoryLogs = () => {
  return serverDb.getInventoryLogs();
};

export const addInventoryLog = ({ productId, type, quantity, reason, createdAt }) => {
  const prod = serverDb.getProducts().find(p => p.id === productId);
  if (!prod) {
    return null;
  }

  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    productId,
    productName: prod.name,
    type,
    quantity: Number(quantity),
    reason: reason || 'Manual adjustment',
    createdAt: createdAt || new Date().toISOString()
  };

  serverDb.addInventoryLog(log);
  return log;
};
