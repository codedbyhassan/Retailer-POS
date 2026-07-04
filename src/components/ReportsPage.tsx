import React, { useState, useEffect, useMemo } from 'react';
import { localDb } from '../services/indexeddb/db.js';
import { Product, Sale } from '../types.js';
import { BarChart, DollarSign, Package, TrendingUp, AlertCircle, ShoppingBag, ShieldAlert, Award, FileText, Printer, CheckCircle } from 'lucide-react';

interface ReportsPageProps {
  currencySymbol: string;
}

type ReportTab = 'sales' | 'products' | 'valuation';

export default function ReportsPage({ currencySymbol }: ReportsPageProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const prods = await localDb.getProducts();
      const s = await localDb.getSales();
      setProducts(prods);
      setSales(s);
    } catch (e) {
      console.error('Error loading reports data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDbUpdated = () => {
      loadData();
    };
    window.addEventListener('retailer:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('retailer:db-updated', handleDbUpdated);
    };
  }, []);

  // 1. Daily Sales Computations
  const dailyReport = useMemo(() => {
    const daySales = sales.filter(s => s.createdAt.startsWith(selectedDate));
    
    let grossRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    daySales.forEach(sale => {
      grossRevenue += sale.total;
      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const prod = products.find(p => p.id === item.productId);
        const cost = prod ? prod.costPrice : item.price * 0.6; // fallback cost
        totalCost += cost * item.quantity;
      });
    });

    const netProfit = grossRevenue - totalCost;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    return {
      salesCount: daySales.length,
      grossRevenue,
      totalCost,
      netProfit,
      profitMargin,
      totalItemsSold
    };
  }, [sales, products, selectedDate]);

  // 2. Product Sales Reports (Best Sellers & Slow Movers)
  const productReports = useMemo(() => {
    // Map of product ID -> quantity sold
    const salesMap: Record<string, { quantity: number; revenue: number; name: string; sku: string }> = {};
    
    // Initialize map
    products.forEach(p => {
      salesMap[p.id] = { quantity: 0, revenue: 0, name: p.name, sku: p.sku };
    });

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (salesMap[item.productId]) {
          salesMap[item.productId].quantity += item.quantity;
          salesMap[item.productId].revenue += item.subtotal;
        } else {
          salesMap[item.productId] = {
            quantity: item.quantity,
            revenue: item.subtotal,
            name: item.productName,
            sku: 'N/A'
          };
        }
      });
    });

    const sortedProducts = Object.entries(salesMap)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.quantity - a.quantity);

    const bestSellers = sortedProducts.filter(p => p.quantity > 0).slice(0, 5);
    const slowMoers = sortedProducts.filter(p => p.quantity === 0).slice(0, 5);

    return {
      bestSellers,
      slowMoers
    };
  }, [sales, products]);

  // 3. Inventory Valuation report
  const valuationReport = useMemo(() => {
    let totalStockPieces = 0;
    let assetValuationCost = 0;
    let assetValuationRetail = 0;

    products.filter(p => !p.archived).forEach(p => {
      totalStockPieces += p.quantity;
      assetValuationCost += p.quantity * p.costPrice;
      assetValuationRetail += p.quantity * p.sellingPrice;
    });

    const potentialProfit = assetValuationRetail - assetValuationCost;
    const marginPercent = assetValuationRetail > 0 ? (potentialProfit / assetValuationRetail) * 100 : 0;

    return {
      totalStockPieces,
      assetValuationCost,
      assetValuationRetail,
      potentialProfit,
      marginPercent
    };
  }, [products]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
        <p className="text-xs font-semibold text-slate-500">Compiling financial indicators...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-display">Business Intelligence & Reports</h2>
          <p className="text-xs text-slate-500">Track cost of goods sold, profit margins, asset valuations and retail analytics</p>
        </div>
        <button
          onClick={handlePrint}
          className="bg-white border border-slate-200 text-slate-700 font-bold text-xs py-2 px-3.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          Print Report
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sales')}
          className={`py-2.5 px-4 text-xs font-bold font-display border-b-2 transition-colors cursor-pointer ${
            activeTab === 'sales'
              ? 'border-indigo-600 text-indigo-750'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daily Revenue & Margin
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2.5 px-4 text-xs font-bold font-display border-b-2 transition-colors cursor-pointer ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-750'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Best Sellers & Movers
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`py-2.5 px-4 text-xs font-bold font-display border-b-2 transition-colors cursor-pointer ${
            activeTab === 'valuation'
              ? 'border-indigo-600 text-indigo-750'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Inventory Asset Valuation
        </button>
      </div>

      <div id="printable-report">
        
        {activeTab === 'sales' && (
          <div className="space-y-6">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 font-display flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Select Reporting Day:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Gross Sales</p>
                <h3 className="text-lg font-extrabold text-slate-900 font-mono mt-1">
                  {currencySymbol}{dailyReport.grossRevenue.toFixed(2)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">From {dailyReport.salesCount} cash checkouts</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Cost of Goods (COGS)</p>
                <h3 className="text-lg font-extrabold text-slate-600 font-mono mt-1">
                  {currencySymbol}{dailyReport.totalCost.toFixed(2)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Wholesale asset value sold</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Est. Net Profit</p>
                <h3 className="text-lg font-extrabold text-emerald-650 font-mono mt-1">
                  {currencySymbol}{dailyReport.netProfit.toFixed(2)}
                </h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">Real profit margin cash</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Profit Margin %</p>
                <h3 className="text-lg font-extrabold text-indigo-600 font-mono mt-1">
                  {dailyReport.profitMargin.toFixed(1)}%
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">ROI margin performance</p>
              </div>

            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-150">
                <h3 className="font-bold text-slate-900 font-display text-xs">Today's Ledger Entries</h3>
                <p className="text-[11px] text-slate-400">All invoices closed on {selectedDate}</p>
              </div>
              
              {dailyReport.salesCount === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-2" />
                  <p>No transactions registered on this date.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase">
                        <th className="py-2.5 px-5">Invoice</th>
                        <th className="py-2.5 px-5">Time</th>
                        <th className="py-2.5 px-5">Cashier</th>
                        <th className="py-2.5 px-5">Payment</th>
                        <th className="py-2.5 px-5 text-right">Items Count</th>
                        <th className="py-2.5 px-5 text-right">Invoice Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {sales.filter(s => s.createdAt.startsWith(selectedDate)).map(s => {
                        const totalQty = s.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/20 text-slate-800">
                            <td className="py-2.5 px-5 font-mono font-bold text-indigo-700">{s.invoiceNumber}</td>
                            <td className="py-2.5 px-5 font-mono text-slate-500">
                              {new Date(s.createdAt).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-5 text-slate-950 font-medium">{s.cashierName}</td>
                            <td className="py-2.5 px-5 font-semibold text-slate-600">{s.paymentMethod.replace('_', ' ')}</td>
                            <td className="py-2.5 px-5 text-right font-mono">{totalQty} items</td>
                            <td className="py-2.5 px-5 text-right font-mono font-bold text-slate-950">
                              {currencySymbol}{s.total.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: PRODUCT SALES ANALYSIS */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Best Sellers */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full text-xs">
              <div className="p-4 border-b border-slate-150 bg-emerald-50/20 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 font-display text-xs flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    Top Best Sellers
                  </h3>
                  <p className="text-[10px] text-slate-400">Products with highest offline transaction volume</p>
                </div>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded uppercase">
                  Demand
                </span>
              </div>
              
              {productReports.bestSellers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs flex-1 flex flex-col justify-center">
                  <Package className="w-8 h-8 mx-auto stroke-1 mb-2 text-slate-300" />
                  <p>Complete sales at checkout to generate best seller charts.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 flex-1">
                  {productReports.bestSellers.map((item, index) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <span className="w-5.5 h-5.5 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate leading-snug">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-indigo-600 font-mono">
                          {item.quantity} Sold
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {currencySymbol}{item.revenue.toFixed(2)} Revenue
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow Movers / Cold Inventory */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full text-xs">
              <div className="p-4 border-b border-slate-150 bg-rose-50/20 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-900 font-display text-xs flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Slow Moving Products
                  </h3>
                  <p className="text-[10px] text-slate-400">Products with zero sales volume</p>
                </div>
                <span className="text-[9px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded uppercase">
                  Inactive
                </span>
              </div>
              
              {productReports.slowMoers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs flex-1 flex flex-col justify-center">
                  <CheckCircle className="w-8 h-8 mx-auto stroke-1 mb-2 text-emerald-350" />
                  <p>All catalog products are active and selling!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 flex-1">
                  {productReports.slowMoers.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900 leading-snug truncate max-w-[200px]">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded">
                        0 Sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: INVENTORY VALUATION */}
        {activeTab === 'valuation' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Stock Hand-on</p>
                <h3 className="text-lg font-extrabold text-slate-900 font-mono mt-1">
                  {valuationReport.totalStockPieces} <span className="text-[10px] text-slate-400 font-sans font-medium">units</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Accumulated stock piece volume</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Valuation at Cost</p>
                <h3 className="text-lg font-extrabold text-slate-750 font-mono mt-1">
                  {currencySymbol}{valuationReport.assetValuationCost.toFixed(2)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Total wholesale asset value</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Valuation at Retail</p>
                <h3 className="text-lg font-extrabold text-indigo-700 font-mono mt-1">
                  {currencySymbol}{valuationReport.assetValuationRetail.toFixed(2)}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Potential gross sales revenue</p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Potential Profit</p>
                <h3 className="text-lg font-extrabold text-emerald-650 font-mono mt-1">
                  {currencySymbol}{valuationReport.potentialProfit.toFixed(2)}
                </h3>
                <p className="text-[10px] text-emerald-500 mt-0.5">Potential ROI: {valuationReport.marginPercent.toFixed(1)}%</p>
              </div>

            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-150">
                <h3 className="font-bold text-slate-900 font-display text-xs">Detailed Inventory Assets Valuation Ledger</h3>
                <p className="text-[11px] text-slate-400">Current financial cost/retail values per product catalog</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase">
                      <th className="py-2.5 px-5">Product</th>
                      <th className="py-2.5 px-5 text-center">Qty on Shelf</th>
                      <th className="py-2.5 px-5 text-right">Cost Price</th>
                      <th className="py-2.5 px-5 text-right">Retail Price</th>
                      <th className="py-2.5 px-5 text-right">Total Cost Value</th>
                      <th className="py-2.5 px-5 text-right">Total Retail Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                    {products.filter(p => !p.archived).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/25">
                        <td className="py-2.5 px-5 font-semibold text-slate-950">{p.name}</td>
                        <td className="py-2.5 px-5 text-center font-mono font-bold text-slate-950">{p.quantity}</td>
                        <td className="py-2.5 px-5 text-right font-mono text-slate-500">{currencySymbol}{p.costPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-5 text-right font-mono text-slate-600">{currencySymbol}{p.sellingPrice.toFixed(2)}</td>
                        <td className="py-2.5 px-5 text-right font-mono text-slate-900 font-medium">{currencySymbol}{(p.quantity * p.costPrice).toFixed(2)}</td>
                        <td className="py-2.5 px-5 text-right font-mono font-bold text-indigo-700">{currencySymbol}{(p.quantity * p.sellingPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
