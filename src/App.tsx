import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { localDb } from './services/indexeddb/db.js';
import { BusinessSettings, Product, User } from './types.js';
import { useAuth } from './hooks/useAuth.js';
import { useOfflineStatus } from './hooks/useOfflineStatus.js';
import { useSyncStatus } from './hooks/useSyncStatus.js';
import { useToast } from './hooks/useToast.tsx';
import { apiClient } from './services/api.js';

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
  Menu, X
} from 'lucide-react';

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Retailer Commerce',
  currency: 'GHS',
  currencySymbol: '₵',
  taxRate: 15,
  receiptFooter: 'Thank you for shopping with us.'
};

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

  // Initialize database on first load
  useEffect(() => {
    const initDatabase = async () => {
      try {
        // Load settings from local cache
        const cachedSettings = await localDb.getSettings();
        if (cachedSettings) {
          setBusinessSettings(cachedSettings);
        }

        setDbSeeding(false);
      } catch (error) {
        console.error('[v0] Database initialization error:', error);
        setDbSeeding(false);
      }
    };

    initDatabase();
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      const result = await login(email, password);
      if (result.success) {
        showToast('Login successful', 'success');
        setCurrentView('pos');
      } else {
        showToast(result.error || 'Login failed', 'error');
      }
      return result;
    },
    [login, showToast]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    setCurrentView('login');
  }, [logout]);

  const handleSyncNow = useCallback(async () => {
    const result = await syncNow();
    if (result.success) {
      showToast(`Synced ${result.syncedCount} items`, 'success');
    } else {
      showToast(result.error || 'Sync failed', 'error');
    }
  }, [syncNow, showToast]);

  // Show loading state while authentication is being determined
  if (authLoading || dbSeeding) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page when not authenticated
  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} isOnline={isOnline} />;
  }

  // Main app layout with iOS/Material UI styling
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Navigation - iOS style */}
      <aside
        className={`
          fixed lg:relative z-40 h-full bg-white border-r border-slate-200 
          transition-all duration-300 ease-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${isMobileMenuOpen ? 'left-0' : '-left-full lg:left-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <h1 className="text-lg font-bold text-slate-900">Retailer</h1>
                  <p className="text-xs text-slate-500">POS System</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                  ${
                    currentView === item.id
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* User Profile & Logout */}
          <div className="border-t border-slate-100 p-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-700 transition-all"
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {navItems.find((item) => item.id === currentView)?.label || 'Dashboard'}
            </h2>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Sync Status */}
            <button
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing}
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-amber-500 rounded-full" />
              )}
            </button>

            {/* Online Status */}
            {isOnline ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg">
                <WifiOff className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Offline</span>
              </div>
            )}

            {/* User Profile */}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {currentView === 'pos' && <POSPage />}
          {currentView === 'products' && <ProductsPage />}
          {currentView === 'inventory' && <InventoryPage />}
          {currentView === 'sales' && <SalesHistoryPage />}
          {currentView === 'reports' && <ReportsPage />}
          {currentView === 'settings' && <SettingsPage />}
          {currentView === 'admin' && user?.role === 'admin' && <AdminDashboard />}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

// Navigation configuration
const navItems = [
  { id: 'pos', label: 'Point of Sale', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: ArrowDownUp },
  { id: 'sales', label: 'Sales History', icon: History },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
  { id: 'admin', label: 'Administration', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', icon: Settings },
];
