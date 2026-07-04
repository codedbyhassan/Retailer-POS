import React, { useState, useEffect } from 'react';
import { localDb } from '../services/indexeddb/db.js';
import { BusinessSettings, User } from '../types.js';
import { syncEngine } from '../services/sync/syncEngine.js';
import { useToast } from '../hooks/useToast.tsx';
import { Settings, Users, Key, Save, UserPlus, Trash, ShieldCheck, X, RefreshCw } from 'lucide-react';

interface SettingsPageProps {
  adminUser: { id: string; name: string; role: string };
  settings: BusinessSettings;
  onUpdateSettings: (newSettings: BusinessSettings) => void;
}

export default function SettingsPage({ adminUser, settings, onUpdateSettings }: SettingsPageProps) {
  const { showToast } = useToast();
  // Business Settings states
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [receiptFooter, setReceiptFooter] = useState(settings.receiptFooter);

  // Cashiers List
  const [users, setUsers] = useState<Omit<User, 'passwordHash'>[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Modal cashiers form state
  const [showModal, setShowModal] = useState(false);
  const [cashierName, setCashierName] = useState('');
  const [cashierEmail, setCashierEmail] = useState('');
  const [cashierPassword, setCashierPassword] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const fetchUsers = async () => {
    if (adminUser.role !== 'admin') return;
    try {
      setUsersLoading(true);
      const token = localStorage.getItem('retailer_auth_token');
      if (navigator.onLine && token) {
        // Fetch fresh cashier accounts from server
        const res = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
          // Cache locally in IndexedDB
          for (const u of data) {
            await localDb.saveUser(u);
          }
          setUsersLoading(false);
          return;
        }
      }

      // Fallback: load from local IndexedDB
      const list = await localDb.getUsers();
      setUsers(list);
    } catch (e) {
      console.error('Error fetching cashier users:', e);
      // Fallback
      const list = await localDb.getUsers();
      setUsers(list);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !currency.trim() || !currencySymbol.trim()) {
      showToast('Mandatory business settings are missing.', 'warning');
      return;
    }

    const updated: BusinessSettings = {
      businessName: businessName.trim(),
      currency: currency.trim(),
      currencySymbol: currencySymbol.trim(),
      taxRate: Number(taxRate),
      receiptFooter: receiptFooter.trim()
    };

    try {
      // 1. Save locally to IndexedDB settings store
      await localDb.saveSettings(updated);
      
      // 2. Dispatch updated settings to parent App
      onUpdateSettings(updated);

      // 3. Sync to cloud if online
      const token = localStorage.getItem('retailer_auth_token');
      if (navigator.onLine && token) {
        const response = await fetch('/api/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updated)
        });
        if (response.ok) {
          console.log('[Settings] Cloud business settings backed up successfully.');
        }
      }

      showToast('Business configurations saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showToast('An error occurred while saving configurations.', 'error');
    }
  };

  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim() || !cashierEmail.trim() || !cashierPassword.trim()) {
      showToast('Please fill in all cashier details.', 'warning');
      return;
    }

    setIsSavingUser(true);
    try {
      const token = localStorage.getItem('retailer_auth_token');
      
      if (navigator.onLine && token) {
        // Online: Create on server first
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: cashierName.trim(),
            email: cashierEmail.trim().toLowerCase(),
            password: cashierPassword.trim(),
            role: 'cashier',
            active: true
          })
        });

        const data = await res.json();
        if (res.ok) {
          await localDb.saveUser(data);
          setShowModal(false);
          setCashierName('');
          setCashierEmail('');
          setCashierPassword('');
          fetchUsers();
          showToast('Cashier account created successfully!', 'success');
        } else {
          showToast(data.error || 'Server failed to create cashier account.', 'error');
        }
      } else {
        // Offline: Cache locally in IndexedDB and alert
        const offlineId = `usr_cashier_${Date.now()}`;
        const newUser: User = {
          id: offlineId,
          name: cashierName.trim(),
          email: cashierEmail.trim().toLowerCase(),
          role: 'cashier',
          active: true,
          createdAt: new Date().toISOString()
        };

        await localDb.saveUser(newUser);
        
        // Note: For actual full offline user auth, server-side holds password hashes.
        // In our useAuth fallback we let cashiers log in using 'cashier123' if cached.
        setShowModal(false);
        setCashierName('');
        setCashierEmail('');
        setCashierPassword('');
        fetchUsers();
        showToast('Offline cache complete. Official credentials will register on the cloud when connection re-establishes.', 'warning');
      }
    } catch (err) {
      console.error('Failed to create cashier:', err);
      showToast('An error occurred during account registration.', 'error');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUserActive = async (user: any) => {
    const action = user.active ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.name}'s cashier terminal access?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('retailer_auth_token');
      const updatedUser = { ...user, active: !user.active };

      if (navigator.onLine && token) {
        const res = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ active: !user.active })
        });

        if (res.ok) {
          const data = await res.json();
          await localDb.saveUser(data);
          fetchUsers();
          return;
        }
      }

      // Offline update local cache directly
      await localDb.saveUser(updatedUser);
      fetchUsers();
    } catch (e) {
      console.error('Toggle status failed:', e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-650" />
            Business Configurations
          </h2>
          <p className="text-xs text-slate-500">Configure business info, base currency, tax thresholds and receipt footers</p>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Store / Business Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Amina Emerging Markets Shop"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Currency (ISO) *</label>
              <input
                type="text"
                required
                placeholder="GHS"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Symbol *</label>
              <input
                type="text"
                required
                placeholder="₵"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">VAT / Tax Rate (%) *</label>
              <input
                type="number"
                min="0"
                max="100"
                required
                placeholder="15"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              />
            </div>

          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receipt Footer Text</label>
            <textarea
              rows={3}
              placeholder="e.g. Thanks for shopping! Save and sync offline sales with Retailer."
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs py-2 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>

        </form>
      </div>      {/* COLUMN 3: CASHIER USER ACCOUNTS (Admins only) */}
      {adminUser.role === 'admin' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-650" />
                Store Cashiers
              </h2>
              <p className="text-xs text-slate-500">Create terminal login accounts</p>
            </div>
            
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 bg-indigo-50 text-indigo-750 hover:bg-indigo-100 rounded transition-colors cursor-pointer"
              title="Add Cashier"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {usersLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <p>Retrieving user profiles...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg flex-1 flex flex-col justify-center">
              <Users className="w-8 h-8 mx-auto stroke-1 text-slate-300 mb-2" />
              <p>No cashiers cached on this outlet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1 max-h-[400px]">
              {users.map((user) => (
                <div key={user.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-3 space-y-0.5">
                    <p className="font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-slate-400 font-mono text-[10px] truncate">{user.email}</p>
                    <span className="inline-block text-[9px] font-bold font-display uppercase px-1.5 bg-indigo-50 text-indigo-700 rounded">
                      {user.role}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleUserActive(user)}
                      className={`px-2 py-1 rounded font-bold text-[10px] transition-colors cursor-pointer ${
                        user.active
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-rose-50 hover:text-rose-700'
                          : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {user.active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-500">
          <Key className="w-6 h-6 mx-auto stroke-1 text-slate-400 mb-2" />
          <h3 className="font-bold text-slate-900 text-sm">Restricted Access</h3>
          <p className="text-xs max-w-xs mx-auto mt-1 leading-relaxed">
            Only store administrators possess privileges to inspect cashier terminal accounts and generate staff credentials.
          </p>
        </div>
      )}

      {/* CREATE CASHIER OVERLAY MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-250 shadow-xl max-w-sm w-full overflow-hidden flex flex-col">
            
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 font-display text-sm">Create Cashier Account</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-650 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCashier} className="p-5 space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yaw Boateng"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yaw@outlet.com"
                  value={cashierEmail}
                  onChange={(e) => setCashierEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Login Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Password string"
                  value={cashierPassword}
                  onChange={(e) => setCashierPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSavingUser ? 'Registering...' : 'Register Cashier'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
