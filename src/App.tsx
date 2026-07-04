import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { localDb } from './services/indexeddb/db.js';
import { BusinessSettings, Product, User } from './types.js';
import { useAuth } from './hooks/useAuth.js';
import { useOfflineStatus } from './hooks/useOfflineStatus.js';
import { useSyncStatus } from './hooks/useSyncStatus.js';
import { useToast } from './hooks/useToast.tsx';

// Modular Page Components
import LoginPage from './components/LoginPage.js';
import AdminDashboard from './components/AdminDashboard.js';
import POSPage from './components/POSPage.js';
import ProductsPage from './components/ProductsPage.js';
import InventoryPage from './components/InventoryPage.js';
import SalesHistoryPage from './components/SalesHistoryPage.js';
import ReportsPage from './components/ReportsPage.js';
import SettingsPage from './components/SettingsPage.js';

// Icons
import { 
  LayoutDashboard, ShoppingCart, Package, ArrowDownUp, 
  History, BarChart2, Settings, LogOut, Wifi, WifiOff, RefreshCw,
  Menu, X, ChevronDown, ChevronLeft, ChevronRight, ShoppingBag
} from 'lucide-react';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'Soap (Anti-bacterial)',
    sku: 'SKU-SOAP-01',
    barcode: '1001',
    category: 'Hygiene',
    costPrice: 0.80,
    sellingPrice: 1.50,
    quantity: 50,
    reorderLevel: 10,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_2',
    name: 'Rice (Jasmine 1kg)',
    sku: 'SKU-RICE-01',
    barcode: '1002',
    category: 'Food',
    costPrice: 2.00,
    sellingPrice: 3.50,
    quantity: 20,
    reorderLevel: 8,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_3',
    name: 'Cooking Oil 1L',
    sku: 'SKU-OIL-01',
    barcode: '1003',
    category: 'Food',
    costPrice: 4.50,
    sellingPrice: 6.80,
    quantity: 12,
    reorderLevel: 5,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_4',
    name: 'Fresh Milk 1L',
    sku: 'SKU-MILK-01',
    barcode: '1004',
    category: 'Dairy',
    costPrice: 1.20,
    sellingPrice: 2.20,
    quantity: 5,
    reorderLevel: 10,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'prod_5',
    name: 'Bread (Whole Wheat)',
    sku: 'SKU-BREAD-01',
    barcode: '1005',
    category: 'Bakery',
    costPrice: 0.90,
    sellingPrice: 1.80,
    quantity: 15,
    reorderLevel: 5,
    archived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Retailer Commerce',
  currency: 'GHS',
  currencySymbol: '₵',
  taxRate: 15,
  receiptFooter: 'Thank you for shopping with us.'
};

const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    name: 'Amina Diallo',
    email: 'admin@retailer.com',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'usr_cashier',
    name: 'Kofi Mensah',
    email: 'cashier@retailer.com',
    role: 'cashier',
    active: true,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const { showToast } = useToast();
  const isOnline = useOfflineStatus();
  const { user, isLoggedIn, loading: authLoading, login, logout } = useAuth();
  const { pendingCount, isSyncing, syncNow } = useSyncStatus();

  const [isPending, startTransition] = useTransition();

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('pos');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Business settings cache state
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [dbSeeding, setDbSeeding] = useState(true);

  // Initialize and Seed local databases
  useEffect(() => {
    const initDatabase = async () => {
      try {
        await localDb.seedIfEmpty(DEFAULT_PRODUCTS, DEFAULT_SETTINGS, DEFAULT_USERS);
        
        // Fetch current settings
        const currentSettings = await localDb.getSettings();
        if (currentSettings) {
          setBusinessSettings(currentSettings);
        }
      } catch (err) {
        console.error('[App] Database seeding failed:', err);
      } finally {
        setDbSeeding(false);
      }
    };

    initDatabase();
  }, []);

  // Sync settings when modified
  const handleUpdateSettings = (newSettings: BusinessSettings) => {
    setBusinessSettings(newSettings);
  };

  // Auto-redirect on login role change
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        setCurrentView('dashboard');
      } else {
        setCurrentView('pos');
      }
    }
  }, [user]);

  // Handle manual sync button click
  const triggerSync = async () => {
    const result = await syncNow();
    if (result.success) {
      showToast(`Synchronized successfully! Processed ${result.syncedCount} queued actions.`, 'success');
    } else {
      showToast(`Synchronization failed: ${result.error}`, 'error');
    }
  };

  if (authLoading || dbSeeding) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600 font-display">Securing retail workspace database...</p>
        <p className="text-xs text-slate-400 mt-1">Bootstrapping IndexedDB storage systems</p>
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return <LoginPage onLogin={login} isOnline={isOnline} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex h-screen overflow-hidden text-slate-800">
      
      {/* MOBILE SLIDE-OUT MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* MOBILE SLIDE-OUT MENU DRAWER */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <ShoppingBag className="text-white w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                Retailer Menu
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                    currentView === 'dashboard'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 ${currentView === 'dashboard' ? 'text-white' : 'text-emerald-600'}`} />
                  Analytics
                </button>

                <button
                  onClick={() => {
                    setCurrentView('products');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                    currentView === 'products'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Package className={`w-4 h-4 ${currentView === 'products' ? 'text-white' : 'text-emerald-600'}`} />
                  Products
                </button>

                <button
                  onClick={() => {
                    setCurrentView('inventory');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                    currentView === 'inventory'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownUp className={`w-4 h-4 ${currentView === 'inventory' ? 'text-white' : 'text-emerald-600'}`} />
                  Inventory
                </button>
              </>
            )}

            <button
              onClick={() => {
                setCurrentView('pos');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                currentView === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShoppingCart className={`w-4 h-4 ${currentView === 'pos' ? 'text-white' : 'text-emerald-600'}`} />
              Checkout
            </button>

            <button
              onClick={() => {
                setCurrentView('history');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                currentView === 'history'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <History className={`w-4 h-4 ${currentView === 'history' ? 'text-white' : 'text-emerald-600'}`} />
              History
            </button>

            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('reports');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                    currentView === 'reports'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <BarChart2 className={`w-4 h-4 ${currentView === 'reports' ? 'text-white' : 'text-emerald-600'}`} />
                  Reports
                </button>

                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-semibold font-display transition-colors cursor-pointer ${
                    currentView === 'settings'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Settings className={`w-4 h-4 ${currentView === 'settings' ? 'text-white' : 'text-emerald-600'}`} />
                  Settings
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            logout();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </aside>

      {/* DESKTOP SIDEBAR NAVIGATION - Starts from top of screen */}
      <aside 
        className={`bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 transition-all duration-300 ease-in-out hidden md:flex shrink-0 ${
          sidebarCollapsed ? 'w-20 items-center' : 'w-64'
        }`}
      >
        <div className="space-y-7 w-full flex flex-col h-full justify-between">
          
          <div className="space-y-6">
            {/* Top Logo and Name Side by Side */}
            <div className={`flex items-center gap-3 select-none ${sidebarCollapsed ? 'justify-center' : 'px-2'}`}>
              <div className="h-10 w-10 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-md border border-emerald-500/10">
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-xs font-extrabold text-slate-900 font-display uppercase tracking-widest leading-none truncate">
                    {businessSettings.businessName}
                  </h1>
                  <span className="inline-block text-[9px] font-extrabold text-emerald-600 font-display mt-1 tracking-wider uppercase bg-emerald-50 px-2 py-0.25 rounded-full border border-emerald-100/50">POS Hub</span>
                </div>
              )}
            </div>

            {/* Navigation List */}
            <div className={`space-y-3 ${sidebarCollapsed ? 'flex flex-col items-center w-full' : ''}`}>
              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => startTransition(() => setCurrentView('dashboard'))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                      currentView === 'dashboard'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                    title={sidebarCollapsed ? 'Analytics' : ''}
                  >
                    <LayoutDashboard className={`w-4 h-4 flex-shrink-0 ${currentView === 'dashboard' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                    {!sidebarCollapsed && <span>Analytics</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                        Analytics
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => startTransition(() => setCurrentView('products'))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                      currentView === 'products'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                    title={sidebarCollapsed ? 'Products' : ''}
                  >
                    <Package className={`w-4 h-4 flex-shrink-0 ${currentView === 'products' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                    {!sidebarCollapsed && <span>Products</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                        Products
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => startTransition(() => setCurrentView('inventory'))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                      currentView === 'inventory'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                    title={sidebarCollapsed ? 'Inventory' : ''}
                  >
                    <ArrowDownUp className={`w-4 h-4 flex-shrink-0 ${currentView === 'inventory' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                    {!sidebarCollapsed && <span>Inventory</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                        Inventory
                      </div>
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() => startTransition(() => setCurrentView('pos'))}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                  currentView === 'pos'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                title={sidebarCollapsed ? 'Checkout' : ''}
              >
                <ShoppingCart className={`w-4 h-4 flex-shrink-0 ${currentView === 'pos' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                {!sidebarCollapsed && <span>Checkout</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    Checkout
                  </div>
                )}
              </button>

              <button
                onClick={() => startTransition(() => setCurrentView('history'))}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                  currentView === 'history'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                title={sidebarCollapsed ? 'History' : ''}
              >
                <History className={`w-4 h-4 flex-shrink-0 ${currentView === 'history' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                {!sidebarCollapsed && <span>History</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    History
                  </div>
                )}
              </button>

              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => startTransition(() => setCurrentView('reports'))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                      currentView === 'reports'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                    title={sidebarCollapsed ? 'Reports' : ''}
                  >
                    <BarChart2 className={`w-4 h-4 flex-shrink-0 ${currentView === 'reports' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                    {!sidebarCollapsed && <span>Reports</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                        Reports
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => startTransition(() => setCurrentView('settings'))}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display transition-all cursor-pointer relative group ${
                      currentView === 'settings'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    } ${sidebarCollapsed ? 'justify-center p-2' : ''}`}
                    title={sidebarCollapsed ? 'Settings' : ''}
                  >
                    <Settings className={`w-4 h-4 flex-shrink-0 ${currentView === 'settings' ? 'text-white' : 'text-emerald-600 stroke-[2]'}`} />
                    {!sidebarCollapsed && <span>Settings</span>}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                        Settings
                      </div>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom Area: Active Cashiers stacked list & Logout Row */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            
            {/* Cashiers currently on shift list (stacked avatars) */}
            {!sidebarCollapsed && (
              <div className="space-y-2 px-2 select-none">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">Active Shift</p>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-emerald-500 text-white font-extrabold text-[9px] flex items-center justify-center font-display" title="Kofi Mensah">KM</div>
                    <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-amber-500 text-white font-extrabold text-[9px] flex items-center justify-center font-display" title="Amina Diallo">AD</div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500">2 active cashiers</span>
                </div>
              </div>
            )}

            {/* Logout Row */}
            <button
              onClick={() => logout()}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold font-display text-rose-600 hover:bg-rose-50 transition-all cursor-pointer ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title="Log Out"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Log Out</span>}
            </button>

            {/* Sidebar Expand/Collapse Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer group relative"
            >
              {sidebarCollapsed ? (
                <>
                  <ChevronRight className="w-4 h-4 mx-auto group-hover:text-slate-600" />
                  <div className="absolute left-full ml-2.5 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-lg font-bold opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-md">
                    Expand Menu
                  </div>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 group-hover:text-slate-600" />
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600">Collapse</span>
                </>
              )}
            </button>

          </div>

        </div>
      </aside>

      {/* RIGHT COLUMN: MAIN CONTENT WITH HEADER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Simple Soft Header for Right Side */}
        <header className="bg-white border-b border-slate-200/60 px-4 md:px-6 py-2.5 flex items-center justify-between relative z-20 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* Hamburger Trigger for Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors md:hidden cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Active page title name */}
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest hidden md:inline">
              {currentView === 'pos' ? 'POS Checkout Terminal' : currentView}
            </span>
          </div>

          {/* Right Side Status & User Menu */}
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Status Indicators */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {isOnline ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span>Online</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Offline</span>
                </span>
              )}
              
              {pendingCount > 0 && (
                <button
                  onClick={triggerSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-bold border border-emerald-100 cursor-pointer transition-colors"
                  title={`${pendingCount} unsynced. Click to force sync.`}
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{pendingCount} Sync</span>
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* User Profile Trigger */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold font-display uppercase shadow-xs">
                  {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 font-display leading-none">{user.name}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl py-2.5 z-35 divide-y divide-slate-100 text-xs">
                  <div className="px-4 py-2">
                    <p className="font-bold text-slate-900 truncate leading-snug">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                    <span className="inline-block mt-1.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setCurrentView('pos');
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                      Checkout Terminal
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setCurrentView('settings');
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        Settings
                      </button>
                    )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 cursor-pointer font-bold"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Backdrop filter */}
        {isProfileOpen && (
          <div 
            className="fixed inset-0 z-25 cursor-default" 
            onClick={() => setIsProfileOpen(false)} 
          />
        )}

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#faf9f6] relative">
          {isPending && (
            <div className="absolute top-4 right-4 bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-full font-mono font-medium shadow flex items-center gap-1.5 z-40 transition-opacity">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Routing...
            </div>
          )}

          {currentView === 'dashboard' && user.role === 'admin' && (
            <AdminDashboard onNavigate={(view) => setCurrentView(view)} currencySymbol={businessSettings.currencySymbol} />
          )}

          {currentView === 'pos' && (
            <POSPage 
              cashier={user} 
              currencySymbol={businessSettings.currencySymbol} 
              taxRate={businessSettings.taxRate} 
              receiptFooter={businessSettings.receiptFooter}
            />
          )}

          {currentView === 'products' && user.role === 'admin' && (
            <ProductsPage currencySymbol={businessSettings.currencySymbol} />
          )}

          {currentView === 'inventory' && user.role === 'admin' && (
            <InventoryPage currencySymbol={businessSettings.currencySymbol} />
          )}

          {currentView === 'history' && (
            <SalesHistoryPage currencySymbol={businessSettings.currencySymbol} taxRate={businessSettings.taxRate} />
          )}

          {currentView === 'reports' && user.role === 'admin' && (
            <ReportsPage currencySymbol={businessSettings.currencySymbol} />
          )}

          {currentView === 'settings' && user.role === 'admin' && (
            <SettingsPage 
              adminUser={user} 
              settings={businessSettings} 
              onUpdateSettings={handleUpdateSettings} 
            />
          )}

          {user.role === 'cashier' && currentView !== 'pos' && currentView !== 'history' && (
            <div className="p-6 text-center text-slate-500 max-w-sm mx-auto">
              <p className="text-sm font-semibold">Workspace view redirected. Cashiers are restricted to POS Terminal access.</p>
            </div>
          )}
        </main>

      </div>

    </div>
  );
}
