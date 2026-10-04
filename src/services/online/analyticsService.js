import { listProducts } from './productService';
import { listSales } from './salesService';

export async function getAnalyticsData() {
  const [products, sales] = await Promise.all([listProducts(), listSales()]);
  const validSales = sales.filter((s) => s.status !== 'voided');
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
  const weekStart = new Date(startOfToday); weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const itemStats = {};
  const categoryStats = {};
  const paymentStats = {};
  const cashierStats = {};

  for (const sale of validSales) {
    paymentStats[sale.payment_method] = (paymentStats[sale.payment_method] || 0) + Number(sale.total || 0);
    const cashier = sale.cashier_id || 'unknown';
    if (!cashierStats[cashier]) cashierStats[cashier] = { name: sale.cashier_name || 'Cashier', revenue: 0, count: 0 };
    cashierStats[cashier].revenue += Number(sale.total || 0);
    cashierStats[cashier].count += 1;

    for (const item of sale.sale_items || []) {
      const product = products.find((p) => p.id === item.product_id);
      const key = item.product_id;
      const cost = Number(item.cost_price ?? product?.cost_price ?? 0);
      const revenue = Number(item.subtotal || 0);
      const profit = (Number(item.price) - cost) * Number(item.quantity);
      if (!itemStats[key]) itemStats[key] = { product_id: key, name: item.product_name || product?.name || 'Unknown', qty: 0, revenue: 0, profit: 0 };
      itemStats[key].qty += Number(item.quantity);
      itemStats[key].revenue += revenue;
      itemStats[key].profit += profit;
      const category = product?.category || 'Uncategorized';
      if (!categoryStats[category]) categoryStats[category] = { category, revenue: 0, profit: 0 };
      categoryStats[category].revenue += revenue;
      categoryStats[category].profit += profit;
    }
  }

  const bestSellers = Object.values(itemStats).map((p) => {
    const product = products.find((x) => x.id === p.product_id);
    return { ...p, margin: p.revenue ? p.profit / p.revenue * 100 : 0, velocity: p.qty / 7, stockCoverDays: p.qty ? (product?.quantity || 0) / (p.qty / 7) : null, image: null };
  }).sort((a,b)=>b.qty-a.qty);

  const topRevenue = [...bestSellers].sort((a,b)=>b.revenue-a.revenue);
  const slowMovers = products.map((p) => ({ ...p, sold: itemStats[p.id]?.qty || 0 })).sort((a,b)=>a.sold-b.sold).slice(0,8);
  const todaySales = validSales.filter((s) => new Date(s.created_at) >= startOfToday);
  const weekSales = validSales.filter((s) => new Date(s.created_at) >= weekStart);
  const monthSales = validSales.filter((s) => new Date(s.created_at) >= monthStart);
  const revenue = (rows) => rows.reduce((sum,s)=>sum+Number(s.total||0),0);
  const units = (rows) => rows.reduce((sum,s)=>sum+(s.sale_items||[]).reduce((n,i)=>n+Number(i.quantity||0),0),0);

  const dailyTrend = Array.from({length:7},(_,i)=>{
    const day=new Date(weekStart); day.setDate(day.getDate()+i);
    const next=new Date(day); next.setDate(next.getDate()+1);
    return { label: day.toLocaleDateString(undefined,{weekday:'short'}), value: revenue(validSales.filter(s=>{const t=new Date(s.created_at);return t>=day&&t<next;})) };
  });
  const hourlySales = Array.from({length:24},(_,hour)=>({hour,revenue:todaySales.filter(s=>new Date(s.created_at).getHours()===hour).reduce((n,s)=>n+Number(s.total||0),0),count:todaySales.filter(s=>new Date(s.created_at).getHours()===hour).length}));
  const totalRevenue = revenue(validSales);
  const totalProfit = validSales.reduce((sum,s)=>sum+(s.sale_items||[]).reduce((n,i)=>n+(Number(i.price)-Number(i.cost_price||0))*Number(i.quantity),0),0);
  const inventoryValue = products.reduce((n,p)=>n+Number(p.cost_price||0)*Number(p.quantity||0),0);
  const retailValue = products.reduce((n,p)=>n+Number(p.selling_price||0)*Number(p.quantity||0),0);
  const paymentTotal = Object.values(paymentStats).reduce((a,b)=>a+b,0);

  return {
    summary: {
      todayRevenue: revenue(todaySales), todayProfit: totalProfit, todayCount: todaySales.length,
      avgOrderValue: todaySales.length ? revenue(todaySales)/todaySales.length : 0,
      avgUnitsPerOrder: todaySales.length ? units(todaySales)/todaySales.length : 0,
      totalUnits: units(validSales), totalRevenue, totalProfit,
      profitMargin: totalRevenue ? totalProfit/totalRevenue*100 : 0,
      activeProducts: bestSellers.length, inventoryAtRisk: products.filter(p=>p.quantity<=p.reorder_level).reduce((n,p)=>n+Number(p.cost_price||0)*Number(p.quantity||0),0),
      weekRevenue: revenue(weekSales), weekCount: weekSales.length, monthRevenue: revenue(monthSales), monthCount: monthSales.length,
      inventoryValue, retailValue,
    },
    dailyTrend, hourlySales, bestSellers, topRevenue,
    categoryBreakdown: Object.values(categoryStats).map(c=>({...c,margin:c.revenue?c.profit/c.revenue*100:0})).sort((a,b)=>b.revenue-a.revenue),
    paymentBreakdown: Object.entries(paymentStats).map(([method,r])=>({method,revenue:r,share:paymentTotal?r/paymentTotal*100:0})),
    cashierBreakdown: Object.values(cashierStats).map(c=>({...c,avgOrder:c.count?c.revenue/c.count:0})).sort((a,b)=>b.revenue-a.revenue),
    slowMovers, outOfStock: products.filter(p=>p.quantity<=0), lowStock: products.filter(p=>p.quantity>0&&p.quantity<=p.reorder_level),
  };
}
