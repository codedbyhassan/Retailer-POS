import { useEffect, useState } from 'react';
import { getBusinessSettings, saveBusinessSettings } from '../../services/indexeddb/settingsStore';
import { appStore } from '../../store/appStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { CURRENCY_OPTIONS } from '../../utils/formatCurrency';
import { getSyncConflicts, resolveSyncConflict } from '../../services/sync/syncQueue';
import { runSync } from '../../services/sync/syncEngine';

const PRESETS = [
  { id: 'classic-blue', name: 'Classic Blue', description: 'Clean, familiar, and operational.', swatches: ['bg-blue-600', 'bg-blue-400', 'bg-slate-900'] },
  { id: 'emerald-market', name: 'Emerald Market', description: 'Fresh, stock-focused retail energy.', swatches: ['bg-emerald-600', 'bg-emerald-400', 'bg-gray-900'] },
  { id: 'ruby-retail', name: 'Ruby Retail', description: 'Bold, high-contrast storefront feel.', swatches: ['bg-rose-600', 'bg-rose-400', 'bg-gray-950'] },
  { id: 'gold-ledger', name: 'Gold Ledger', description: 'Warm finance and inventory tone.', swatches: ['bg-amber-600', 'bg-amber-400', 'bg-stone-900'] },
  { id: 'violet-studio', name: 'Violet Studio', description: 'Premium boutique and service style.', swatches: ['bg-violet-600', 'bg-violet-400', 'bg-zinc-900'] },
];

export default function BusinessSettings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  const loadConflicts = async () => setConflicts(await getSyncConflicts());

  useEffect(() => {
    getBusinessSettings().then(setForm);
    loadConflicts();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveBusinessSettings(form);
      appStore.setBusinessSettings(form);
      toast.success('Settings saved');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2>Business Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Tune the shop identity, money rules, receipts, and visual preset.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="ios-card p-6">
          <div className="mb-5">
            <h3>Business Profile</h3>
            <p className="mt-1 text-sm text-gray-500">These values appear across POS, reports, and receipts.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input label="Business Name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-sm font-medium dark:border-white/[0.08] dark:bg-white/[0.04]"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>{option.label}</option>
                ))}
              </select>
            </div>
            <Input label="Tax Rate (%)" type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
            <Input label="Low Stock Threshold" type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
          </div>
        </section>

        <section className="ios-card p-6">
          <div className="mb-5">
            <h3>Visual Preset</h3>
            <p className="mt-1 text-sm text-gray-500">Choose a brand tone for buttons, highlights, charts, and active states.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {PRESETS.map((preset) => {
              const active = (form.preset || 'classic-blue') === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const next = { ...form, preset: preset.id };
                    setForm(next);
                    appStore.setBusinessSettings(next);
                  }}
                  className={`rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                    active
                      ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20'
                      : 'border-black/[0.06] bg-black/[0.02] hover:bg-black/[0.04] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="mb-3 flex gap-1.5">
                    {preset.swatches.map((swatch) => (
                      <span key={swatch} className={`h-5 w-5 rounded-full ${swatch}`} />
                    ))}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{preset.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-500">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="ios-card p-6">
          <div className="mb-5">
            <h3>Receipt</h3>
            <p className="mt-1 text-sm text-gray-500">Customize the message printed under every customer receipt.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Receipt Footer</label>
            <textarea
              value={form.receipt_footer}
              onChange={(e) => setForm({ ...form, receipt_footer: e.target.value })}
              rows={4}
              className="w-full rounded-2xl border border-black/[0.06] bg-black/[0.02] px-4 py-3 text-sm font-medium dark:border-white/[0.08] dark:bg-white/[0.04]"
            />
          </div>
        </section>

        <section className="ios-card p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3>Data Sync</h3>
              <p className="mt-1 text-sm text-gray-500">Monitor cloud synchronization and resolve operations that could not be applied.</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={syncing || !navigator.onLine}
              onClick={async () => {
                setSyncing(true);
                try {
                  await runSync();
                  await loadConflicts();
                  toast.success('Sync completed');
                } catch (err) {
                  toast.error(err.message);
                } finally {
                  setSyncing(false);
                }
              }}
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>
          {conflicts.length === 0 ? (
            <div className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              No unresolved sync conflicts.
            </div>
          ) : (
            <div className="space-y-3">
              {conflicts.map((item) => (
                <div key={item.id} className="rounded-2xl border border-red-200/70 bg-red-50/70 p-4 dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-red-900 dark:text-red-200">{item.action.replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">{item.error || 'Cloud rejected this operation.'}</p>
                      <p className="mt-1 text-xs text-red-700/60 dark:text-red-400/60">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={async () => { await resolveSyncConflict(item.id, 'retry'); await loadConflicts(); }}>
                        Retry
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={async () => { await resolveSyncConflict(item.id, 'discard_local'); await loadConflicts(); }}>
                        Discard
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Settings'}</Button>
        </div>
      </form>
    </div>
  );
}
