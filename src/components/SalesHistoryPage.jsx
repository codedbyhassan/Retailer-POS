import React, { useState, useEffect, useMemo} from "react";
import { localDb} from "../services/indexeddb/db";
import { Sale} from "../types";
import { Search, Printer, Receipt, Eye, Landmark, Calendar, User, ArrowLeft, RefreshCw, X} from "lucide-react";



export default function SalesHistoryPage({ currencySymbol, taxRate}: SalesHistoryPageProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');

  // Detailed Modal view state
  const [activeSale, setActiveSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const list = await localDb.getSales();
      // Sort chronologically descending
      setSales([...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));} catch (e) {
      console.error('Failed to load transaction history:', e);} finally {
      setLoading(false);}};

  useEffect(() => {
    fetchSales();

    const handleDbUpdated = () => {
      fetchSales();};
    window.addEventListener('retailer:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('retailer:db-updated', handleDbUpdated);};}, []);

  // Compute cashiers list for filters
  const cashiers = useMemo(() => {
    const list = new Set(sales.map(s => s.cashierName).filter(Boolean));
    return ['All', ...Array.from(list)];}, [sales]);

  // Filter list
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchesSearch = s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.id.includes(searchQuery);
      const matchesCashier = selectedCashier === 'All' || s.cashierName === selectedCashier;
      
      let matchesDate = true;
      if (selectedDate) {
        const saleDateStr = s.createdAt.split('T')[0];
        matchesDate = saleDateStr === selectedDate;}

      return matchesSearch && matchesCashier && matchesDate;});}, [sales, searchQuery, selectedCashier, selectedDate]);

  const handlePrint = () => {
    window.print();};

  return (
    <div className="space-y-6">
      
      
        <h2 className="text-lg font-bold text-slate-900 font-display">Sales History</h2>
        <p className="text-xs text-slate-500">Search past checkout invoices, audit receipts, and inspect cashier sales logs</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number or UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="relative">
          <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCashier}
            onChange={(e) => setSelectedCashier(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
          >
            <option value="All">All Cashiers</option>
            {cashiers.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>))}
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono font-medium cursor-pointer"
          />
        </div>

      </div>

      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-400">Loading checkout history...</p>
        </div>) : filteredSales.length === 0 ? (
        <div className="bg-white py-16 text-center border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center">
          <Receipt className="w-10 h-10 text-slate-300 stroke-1 mb-2" />
          <p className="text-sm font-bold text-slate-900 font-display">
            {sales.length === 0 ? 'No Transactions Recorded' : 'No Matching Transactions'}
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {sales.length === 0
              ? 'Once checkout sales are completed at the POS terminal, their itemized receipt records will show up here.'
              : 'Try clearing your search keyword, adjusting cashier filters, or picking a different date range.'}
          </p>
          {(searchQuery || selectedDate || selectedCashier !== 'All') && (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCashier('All'); setSelectedDate('');}}
              className="mt-4 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Reset All Filters
            </button>)}
        </div>) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              
                <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-5">Invoice #</th>
                  <th className="py-3 px-5">Date & Time</th>
                  <th className="py-3 px-5">Cashier</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5 text-right">Invoice Amount</th>
                  <th className="py-3 px-5 text-center">Cloud Synced</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSales.map((sale) => {
                  const isSynced = sale.status === 'synced';

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/20 transition-colors">
                      <td className="py-3 px-5 font-mono font-bold text-indigo-700">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-5 text-slate-500 font-mono text-[11px]">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-slate-950 font-semibold">{sale.cashierName}</td>
                      <td className="py-3 px-5">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {sale.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-bold text-slate-950">
                        {currencySymbol}{sale.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-5 text-center">
                        {isSynced ? (
                          <span className="inline-block text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                            Synced
                          </span>) : (
                          <span className="inline-block text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded animate-pulse">
                            Pending Cloud
                          </span>)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => setActiveSale(sale)}
                          className="px-2.5 py-1.5 text-slate-650 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect</span>
                        </button>
                      </td>
                    </tr>);})}
              </tbody>
            </table>
          </div>
        </div>)}

      {/* DETAILED TRANSACTION INSPECT MODAL */}
      {activeSale && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-250 shadow-xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 font-display text-sm">Invoice Detail Panel</h3>
              <button 
                onClick={() => setActiveSale(null)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thermal styled print invoice area */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 space-y-4" id="printable-receipt">
              <div className="text-center space-y-1">
                <h2 className="text-sm font-bold text-slate-900 tracking-wide font-display">RETAILER OUTLET</h2>
                <p className="text-[10px] text-slate-500">Sales Transaction Copy</p>
                <div className="border-t border-dashed border-slate-300 my-2" />
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  INVOICE:</span>
                  <span className="font-bold">{activeSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  CASHIER:</span>
                  {activeSale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  DATE:</span>
                  {new Date(activeSale.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  PAYMENT:</span>
                  <span className="font-bold">{activeSale.paymentMethod.replace('_', ' ')}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300" />

              {/* Itemized list */}
              <div className="space-y-2">
                <div className="grid grid-cols-4 font-bold text-slate-900">
                  <span className="col-span-2">Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Price</span>
                </div>
                {activeSale.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 text-slate-600">
                    <span className="col-span-2 truncate font-sans text-slate-800">{item.productName}</span>
                    <span className="text-center font-mono">{item.quantity}</span>
                    <span className="text-right font-mono">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                  </div>))}
              </div>

              <div className="border-t border-dashed border-slate-300" />

              {/* Totals */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  Subtotal:</span>
                  <span className="font-mono">{currencySymbol}{activeSale.subtotal.toFixed(2)}</span>
                </div>
                {activeSale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    Discount:</span>
                    <span className="font-mono">-{currencySymbol}{activeSale.discountAmount.toFixed(2)}</span>
                  </div>)}
                <div className="flex justify-between">
                  VAT ({taxRate}%):</span>
                  <span className="font-mono">{currencySymbol}{activeSale.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-dotted border-slate-200">
                  FINAL TOTAL:</span>
                  <span className="font-mono">{currencySymbol}{activeSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 my-4" />

              <div className="text-center text-[10px] text-slate-400">
                Record status: {activeSale.status.toUpperCase()}</p>
                <p className="font-mono text-[9px] mt-1">UUID: {activeSale.id}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveSale(null)}
                className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

          </div>
        </div>)}

    </div>);}
