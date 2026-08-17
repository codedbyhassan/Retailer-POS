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
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const session = await login(form.email, form.password);
      navigate(session.role === ROLES.ADMIN ? '/admin' : '/pos');
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-gray-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black">R</div>
                <span className="text-lg font-bold tracking-tight">Retailer<span className="text-brand-400">POS</span></span>
              </div>
              <div className="mt-20 max-w-md">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Retail operations</p>
                <h1 className="mt-4 text-4xl font-bold leading-tight xl:text-5xl">Run your store with confidence.</h1>
                <p className="mt-5 max-w-sm text-sm leading-6 text-gray-400">Sales, inventory and business activity in one fast workspace — with offline capability when connectivity is unreliable.</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Secure business workspace</p>
          </section>

          <section className="p-7 sm:p-10 lg:p-12">
            <div className="mb-9 lg:hidden">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">R</div>
                <span className="text-lg font-bold tracking-tight text-gray-950">Retailer<span className="text-brand-600">POS</span></span>
              </div>
            </div>
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600">Welcome back</p>
              <h2 className="mt-2 !text-3xl">Sign in</h2>
              <p className="mt-2 text-sm text-gray-500">Access your retail workspace.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} placeholder="you@business.com" />
              <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} placeholder="Enter your password" />
              {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
            </form>
            <p className="mt-7 text-center text-xs leading-5 text-gray-400">Your session is protected. If you are offline, access depends on the account configuration for this device.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
