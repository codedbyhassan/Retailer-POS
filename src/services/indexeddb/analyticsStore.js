import { getSalesWithItems } from './salesStore';
import { getAllProducts } from './productsStore';
import { getAllInventoryLogs } from './inventoryStore';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function inRange(dateStr, start, end) {
  const t = new Date(dateStr).getTime();
  return t >= start.getTime() && t < end.getTime();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return startOfDay(d);
}

export async function getAnalyticsData() {
  const [sales, products, inventoryLogs] = await Promise.all([getSalesWithItems(), getAllProducts(), getAllInventoryLogs()]);
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = daysAgo(7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let todayRevenue = 0;
  let todayProfit = 0;
  let todayCount = 0;
  let weekRevenue = 0;
  let weekProfit = 0;
  let weekCount = 0;
  let monthRevenue = 0;
  let monthProfit = 0;
  let monthCount = 0;
  let totalUnits = 0;

  const productStats = {};
  const categoryStats = {};
  const paymentStats = {};
  const cashierStats = {};
  const hourlyStats = Array.from({ length: 24 }, (_, i) => ({ hour: i, revenue: 0, count: 0 }));
  const dailyTrend = [];

  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    dailyTrend.push({ date: d.toISOString().slice(0, 10), label, revenue: 0, profit: 0, count: 0 });
  }

  for (const sale of sales) {
    const saleDate = new Date(sale.created_at);
    let saleProfit = 0;

    for (const item of sale.items || []) {
      const product = productMap[item.product_id];
      const cost = product?.cost_price ?? 0;
      saleProfit += (item.price - cost) * item.quantity;

      if (!productStats[item.product_id]) {
        productStats[item.product_id] = {
          product_id: item.product_id,
          name: product?.name || item.product_name || 'Unknown',
          category: product?.category || 'Uncategorized',
          image: product?.image || null,
          qty: 0,
          revenue: 0,
          profit: 0,
          transactions: 0,
          lastSoldAt: null,
          stock: product?.quantity ?? 0,
          reorderLevel: product?.reorder_level ?? 10,
        };
      }
      productStats[item.product_id].qty += item.quantity;
      productStats[item.product_id].revenue += item.subtotal;
      productStats[item.product_id].profit += (item.price - cost) * item.quantity;
      productStats[item.product_id].transactions += 1;
      productStats[item.product_id].lastSoldAt = sale.created_at;
      totalUnits += item.quantity;

      const cat = product?.category || 'Uncategorized';
      if (!categoryStats[cat]) categoryStats[cat] = { category: cat, revenue: 0, profit: 0, qty: 0 };
      categoryStats[cat].revenue += item.subtotal;
      categoryStats[cat].profit += (item.price - cost) * item.quantity;
      categoryStats[cat].qty += item.quantity;
    }

    const payment = sale.payment_method || 'cash';
    if (!paymentStats[payment]) paymentStats[payment] = { method: payment, count: 0, revenue: 0 };
    paymentStats[payment].count += 1;
    paymentStats[payment].revenue += sale.total;

    const cashier = sale.cashier_name || sale.cashier_id || 'Unknown';
    if (!cashierStats[cashier]) cashierStats[cashier] = { name: cashier, count: 0, revenue: 0, avgOrder: 0 };
    cashierStats[cashier].count += 1;
    cashierStats[cashier].revenue += sale.total;
    cashierStats[cashier].avgOrder = cashierStats[cashier].revenue / cashierStats[cashier].count;

    const hour = saleDate.getHours();
    hourlyStats[hour].revenue += sale.total;
    hourlyStats[hour].count += 1;

    const dayKey = sale.created_at.slice(0, 10);
    const trendDay = dailyTrend.find((d) => d.date === dayKey);
    if (trendDay) {
      trendDay.revenue += sale.total;
      trendDay.profit += saleProfit;
      trendDay.count += 1;
    }

    if (inRange(sale.created_at, todayStart, tomorrow)) {
      todayRevenue += sale.total;
      todayProfit += saleProfit;
      todayCount += 1;
    }
    if (inRange(sale.created_at, weekStart, tomorrow)) {
      weekRevenue += sale.total;
      weekProfit += saleProfit;
      weekCount += 1;
    }
    if (inRange(sale.created_at, monthStart, tomorrow)) {
      monthRevenue += sale.total;
      monthProfit += saleProfit;
      monthCount += 1;
    }
  }

  const productList = Object.values(productStats).map((p) => ({
    ...p,
    avgUnitPrice: p.qty ? p.revenue / p.qty : 0,
    margin: p.revenue ? (p.profit / p.revenue) * 100 : 0,
    velocity: p.qty / 7,
    stockCoverDays: p.qty > 0 ? p.stock / (p.qty / 7) : null,
  }));
  const bestSellers = [...productList].sort((a, b) => b.qty - a.qty).slice(0, 10);
  const topRevenue = [...productList].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const slowMovers = products
    .filter((p) => !p.archived)
    .map((p) => ({
      ...p,
      sold: productStats[p.id]?.qty || 0,
      revenue: productStats[p.id]?.revenue || 0,
      stockCoverDays: productStats[p.id]?.stockCoverDays ?? null,
    }))
    .sort((a, b) => a.sold - b.sold)
    .slice(0, 10);

  const lowStock = products.filter((p) => !p.archived && p.quantity > 0 && p.quantity <= (p.reorder_level ?? 10));
  const outOfStock = products.filter((p) => !p.archived && p.quantity <= 0);
  const inventoryValue = products.filter((p) => !p.archived).reduce((s, p) => s + p.cost_price * p.quantity, 0);
  const retailValue = products.filter((p) => !p.archived).reduce((s, p) => s + p.selling_price * p.quantity, 0);
  const inventoryAtRisk = slowMovers.reduce((s, p) => s + ((p.sold === 0 ? p.cost_price * p.quantity : 0) || 0), 0);

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalProfit = productList.reduce((s, p) => s + p.profit, 0);
  const avgOrderValue = sales.length ? totalRevenue / sales.length : 0;
  const avgUnitsPerOrder = sales.length ? totalUnits / sales.length : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const inventoryMovements = inventoryLogs.slice(0, 10);

  return {
    summary: {
      todayRevenue,
      todayProfit,
      todayCount,
      weekRevenue,
      weekProfit,
      weekCount,
      monthRevenue,
      monthProfit,
      monthCount,
      avgOrderValue,
      avgUnitsPerOrder,
      profitMargin,
      totalRevenue,
      totalProfit,
      totalUnits,
      inventoryValue,
      retailValue,
      inventoryAtRisk,
      totalProducts: products.filter((p) => !p.archived).length,
      activeProducts: productList.length,
    },
    bestSellers,
    topRevenue,
    slowMovers,
    categoryBreakdown: Object.values(categoryStats)
      .map((c) => ({ ...c, margin: c.revenue ? (c.profit / c.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    paymentBreakdown: Object.values(paymentStats)
      .map((p) => ({ ...p, share: totalRevenue ? (p.revenue / totalRevenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
    cashierBreakdown: Object.values(cashierStats).sort((a, b) => b.revenue - a.revenue),
    hourlySales: hourlyStats,
    dailyTrend,
    lowStock,
    outOfStock,
    inventoryMovements,
  };
}
