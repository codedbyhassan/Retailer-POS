import React, { useState } from 'react';
import { Shield, Mail, Lock, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isOnline: boolean;
}

export default function LoginPage({ onLogin, isOnline }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please specify both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await onLogin(email, password);
    if (!res.success) {
      setErrorMsg(res.error || 'Invalid login credentials.');
      setLoading(false);
    }
  };

  const prefillDemo = (role: 'admin' | 'cashier') => {
    if (role === 'admin') {
      setEmail('admin@retailer.com');
      setPassword('admin123');
    } else {
      setEmail('cashier@retailer.com');
      setPassword('cashier123');
    }
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        {/* Brand Rounded Logo Mark */}
        <div className="mx-auto h-14 w-14 bg-emerald-600 rounded-3xl flex items-center justify-center shadow-md border border-emerald-500/20">
          <ShoppingBag className="w-6 h-6 text-white" />
        </div>

        <h2 className="mt-5 text-center text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Retailer
        </h2>
        <p className="mt-1 text-center text-xs text-slate-450 font-medium font-display">
          Premium Off-Line Point of Sale & Kitchen Workspace
        </p>
        
        <div className="flex justify-center mt-3">
          {isOnline ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              Offline mode
            </span>
          )}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4"
      >
        <div className="bg-white py-8 px-6 border border-slate-100 shadow-xl rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-2xl text-xs leading-relaxed font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@store.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-display transition-all bg-slate-50/30 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200/80 rounded-2xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-display transition-all bg-slate-50/30 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all disabled:opacity-60 flex justify-center items-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-150/60">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-3">
              Quick Fill Demo Accounts
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => prefillDemo('admin')}
                type="button"
                className="py-2.5 px-3 border border-slate-100 bg-slate-50/50 rounded-2xl text-center hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="block text-xs font-bold text-slate-900 font-display">Amina Admin</span>
                <span className="block text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full font-mono mt-1 border border-emerald-100/50">admin123</span>
              </button>
              <button
                onClick={() => prefillDemo('cashier')}
                type="button"
                className="py-2.5 px-3 border border-slate-100 bg-slate-50/50 rounded-2xl text-center hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all cursor-pointer flex flex-col items-center justify-center"
              >
                <span className="block text-xs font-bold text-slate-900 font-display">Kofi Cashier</span>
                <span className="block text-[9px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full font-mono mt-1 border border-emerald-100/50">cashier123</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
