import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { validateLogin } from '../../utils/validators';
import { ROLES } from '../../constants/roles';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLogin(form);
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    setError('');
    try {
      const session = await login(form.email, form.password);
      navigate(session.role === ROLES.ADMIN ? '/admin' : '/pos');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-secondary p-4 dark:bg-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-600/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="ios-card p-8 sm:p-10">
          <div className="mb-10 text-center">
            <div className="mb-2 flex items-baseline justify-center gap-1.5">
              <span className="font-brand text-5xl font-bold text-brand-600 dark:text-brand-400">Retailer</span>
              <span className="font-sans text-xs font-semibold uppercase tracking-[0.15em] text-gray-400">POS</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Offline-first POS & Inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              placeholder="admin@retailer.com"
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={errors.password}
              placeholder="••••••••"
            />
            {error && (
              <p className="rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-8 rounded-2xl bg-black/[0.03] p-4 text-xs text-gray-500 dark:bg-white/[0.04] dark:text-gray-400">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Demo accounts</p>
            <p className="mt-2">Admin: admin@retailer.com / admin123</p>
            <p>Cashier: cashier@retailer.com / cashier123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
