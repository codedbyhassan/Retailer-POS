import { serverDb } from '../config/db.js';

export const getReportSummary = (req, res) => {
  try {
    const products = serverDb.getProducts();
    const sales = serverDb.getSales();
    const logs = serverDb.getInventoryLogs();

    const totalSalesValue = sales.reduce((sum, s) => sum + s.total, 0);
    const totalCostOfGoods = sales.reduce((sum, s) => {
      let cost = 0;
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        cost += (prod ? prod.costPrice : item.price * 0.6) * item.quantity;
      });
      return sum + cost;
    }, 0);

    res.json({
      totalSales: sales.length,
      totalRevenue: totalSalesValue,
      totalCostOfGoods,
      netProfit: totalSalesValue - totalCostOfGoods,
      totalProducts: products.length,
      inventoryLogsCount: logs.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report summary' });
  }
};
