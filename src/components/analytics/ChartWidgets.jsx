export function BarChart({ items, valueKey = 'value', labelKey = 'label', formatValue, className = '' }) {
  if (!items?.length) {
    return <p className="text-sm text-gray-500">No data yet</p>;
  }

  const max = Math.max(...items.map((i) => i[valueKey] || 0), 1);

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const pct = ((item[valueKey] || 0) / max) * 100;
        return (
          <div key={item[labelKey] || item.label}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium capitalize text-gray-700 dark:text-gray-300">{item[labelKey] || item.label}</span>
              <span className="shrink-0 font-semibold text-gray-900 dark:text-white">
                {formatValue ? formatValue(item[valueKey]) : item[valueKey]}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-700 ease-ios"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MiniStat({ label, value, sub, accent = 'brand' }) {
  const accents = {
    brand: 'from-brand-500/15 to-brand-400/5 text-brand-700 dark:text-brand-300',
    green: 'from-emerald-500/15 to-emerald-400/5 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-500/15 to-amber-400/5 text-amber-700 dark:text-amber-300',
    violet: 'from-violet-500/15 to-violet-400/5 text-violet-700 dark:text-violet-300',
  };

  return (
    <div className={`ios-card bg-gradient-to-br p-5 ${accents[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs font-medium opacity-60">{sub}</p>}
    </div>
  );
}

export function TrendChart({ data, formatValue }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-xl bg-gradient-to-t from-brand-600 to-brand-400 transition-all duration-500"
              style={{ height: `${Math.max((d.revenue / max) * 100, 4)}%` }}
              title={formatValue ? formatValue(d.revenue) : d.revenue}
            />
          </div>
          <span className="text-[0.625rem] font-semibold uppercase text-gray-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HourlyChart({ data, formatValue }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const peak = data.reduce((best, d) => (d.revenue > best.revenue ? d : best), data[0]);

  return (
    <div>
      <div className="mb-3 flex h-28 items-end gap-0.5">
        {data.map((d) => (
          <div
            key={d.hour}
            className="flex-1 rounded-t-sm bg-brand-500/80 transition-all hover:bg-brand-500 dark:bg-brand-400/70"
            style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue ? 6 : 2)}%` }}
            title={`${d.hour}:00 — ${formatValue ? formatValue(d.revenue) : d.revenue}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Peak hour: {peak?.hour}:00 ({formatValue ? formatValue(peak?.revenue) : peak?.revenue})
      </p>
    </div>
  );
}
