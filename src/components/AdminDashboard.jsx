import React, { useState, useEffect, useMemo} from "react";
import { localDb} from "../services/indexeddb/db";
import { Product, Sale, InventoryLog} from "../types";
import { TrendingUp, DollarSign, Package, AlertTriangle, ArrowRight, RefreshCw, ShoppingCart, Percent} from "lucide-react";



export default function AdminDashboard({ onNavigate, currencySymbol}: AdminDashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const prods = await localDb.getProducts();
      const s = await localDb.getSales();
      setProducts(prods);
      setSales(s);} catch (e) {
      console.error('Error fetching dashboard data:', e);} finally {
      setLoading(false);}};

  useEffect(() => {
    fetchDashboardData();

    // Listen for DB updates (like after sync completes)
    const handleDbUpdated = () => {
      fetchDashboardData();};
    window.addEventListener('retailer:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('retailer:db-updated', handleDbUpdated);};}, []);

  // Compute stats
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Filter today's sales
    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    
    // Profit calculation: (sellingPrice - costPrice) * quantity for each sold item
    let todayProfit = 0;
    todaySales.forEach(s => {
      s.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cost = prod ? prod.costPrice : item.price * 0.6; // fallback 40% margin
        todayProfit += (item.price - cost) * item.quantity;});});

    // Stock asset value
    const stockAssetValue = products.reduce((sum, p) => sum + (p.quantity * p.costPrice), 0);

    // Low stock items
    const lowStockItems = products.filter(p => p.quantity <= p.reorderLevel && !p.archived);

    return {
      todayRevenue,
      todayProfit,
      transactionCount: todaySales.length,
      stockAssetValue,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      recentSales: [...sales].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)};}, [products, sales]);

  // Chart data calculation (last 7 days)
  const chartData = useMemo(() => {
    const days = [];
    const date = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(date.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short'});
      
      const daySales = sales.filter(s => s.createdAt.startsWith(dateStr));
      const dayRevenue = daySales.reduce((sum, s) => sum + s.total, 0);
      
      days.push({ name, dateStr, total: dayRevenue});}
    return days;}, [sales]);

  const maxChartValue = useMemo(() => {
    const max = Math.max(...chartData.map(d => d.total), 100);
    return Math.ceil(max / 100) * 100;}, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mb-3.5" />
        <p className="text-xs font-bold text-slate-500">Loading dashboard statistics...</p>
      </div>);}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Today's Sales</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {currencySymbol}{stats.todayRevenue.toFixed(2)}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Live Terminal Activity
            </p>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Est. Net Profit</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {currencySymbol}{stats.todayProfit.toFixed(2)}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Based on wholesale cost
            </p>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Transactions</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {stats.transactionCount}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Completed sales today
            </p>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase font-display">Asset Value</p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">
              {currencySymbol}{stats.stockAssetValue.toFixed(2)}
            </h3>
            <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {stats.lowStockCount} items low stock
            </p>
          </div>
          <div className="w-10 h-10 border border-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            
              <h3 className="text-base font-bold text-slate-900 font-display">Sales Performance</h3>
              <p className="text-xs text-slate-500">Gross revenue for the last 7 days</p>
            </div>
            <span className="text-[10px] font-bold bg-slate-50 text-slate-600 px-2.5 py-1 rounded-md font-mono border border-slate-100">
              {currencySymbol} units
            </span>
          </div>

          <div className="h-64 relative w-full flex flex-col justify-between pt-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8 text-[9px] text-slate-400 font-mono">
              <div className="border-b border-slate-100 w-full pb-1 text-right">{currencySymbol}{maxChartValue}</div>
              <div className="border-b border-slate-100 w-full pb-1 text-right">{currencySymbol}{(maxChartValue / 2).toFixed(0)}</div>
              <div className="border-b border-slate-100 w-full pb-1 text-right">0</div>
            </div>

            <div className="h-48 flex items-end justify-around relative z-10 px-6 pb-2">
              {chartData.map((d) => {
                const heightPercent = maxChartValue > 0 ? (d.total / maxChartValue) * 100 : 0;
                return (
                  <div key={d.name} className="flex flex-col items-center group relative w-12">
                    <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-mono shadow z-20 whitespace-nowrap">
                      {currencySymbol}{d.total.toFixed(2)}
                    </div>
                    <div 
                      style={{ height: `${Math.max(4, heightPercent * 1.5)}px`, maxHeight: '140px'}}
                      className="w-7 bg-indigo-600 hover:bg-indigo-500 rounded-t transition-all duration-300"
                    />
                  </div>);})}
            </div>

            <div className="flex justify-around border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-600 font-display">
              {chartData.map(d => (
                <div key={d.name} className="w-12 text-center text-slate-400">{d.name}</div>))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 font-display">Low Stock Alerts</h3>
              <span className="text-[9px] bg-rose-50 border border-rose-150 text-rose-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                {stats.lowStockCount} Total
              </span>
            </div>
            
            {stats.lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-8 h-8 mx-auto stroke-1 mb-2 text-slate-300" />
                <p className="text-xs font-bold">All products are healthy</p>
                <p className="text-[11px] text-slate-400">No low stock thresholds triggered.</p>
              </div>) : (
              <div className="divide-y divide-slate-100">
                {stats.lowStockItems.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-[10px] font-bold font-mono px-2 py-0.5 bg-rose-50 text-rose-700 rounded">
                        {prod.quantity} Left
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">Min: {prod.reorderLevel}</p>
                    </div>
                  </div>))}
              </div>)}
          </div>
          
          <button 
            onClick={() => onNavigate('inventory')}
            className="w-full mt-4 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer transition-colors"
          >
            Manage Inventory
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          
            <h3 className="text-base font-bold text-slate-900 font-display">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Chronological history of recent store checkouts</p>
          </div>
          <button 
            onClick={() => onNavigate('history')}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            View All Sales
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {stats.recentSales.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShoppingCart className="w-10 h-10 mx-auto stroke-1 mb-2 text-slate-300" />
            <p className="text-xs font-semibold">No transactions recorded yet</p>
            <p className="text-[11px] text-slate-400">Sales completed at the checkout terminal will appear here.</p>
          </div>) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              
                <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-6">Invoice #</th>
                  <th className="py-3 px-6">Date / Time</th>
                  <th className="py-3 px-6">Cashier</th>
                  <th className="py-3 px-6">Payment</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {stats.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/20 transition-colors">
                    <td className="py-3 px-6 font-mono font-bold text-indigo-700">{sale.invoiceNumber}</td>
                    <td className="py-3 px-6 text-slate-500 font-mono">
                      {new Date(sale.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-slate-800 font-medium">{sale.cashierName}</td>
                    <td className="py-3 px-6">
                      <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right font-bold text-slate-950 font-mono">
                      {currencySymbol}{sale.total.toFixed(2)}
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </div>

    </div>);}
