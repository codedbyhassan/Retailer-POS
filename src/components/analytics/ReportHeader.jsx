import { Link, NavLink } from 'react-router-dom';

const tabs = [
  { to: '/admin/reports', label: 'Overview', end: true },
  { to: '/admin/reports/daily', label: 'Daily' },
  { to: '/admin/reports/products', label: 'Products' },
  { to: '/admin/reports/inventory', label: 'Inventory' },
];

export default function ReportHeader({ title, description, backTo = '/admin/reports', showBack = true }) {
  return (
    <div className="mb-6 space-y-4">
      <div>
        {showBack && (
          <Link to={backTo} className="text-sm font-semibold text-brand-600 hover:text-brand-500">
            Back to reports
          </Link>
        )}
        <h2 className="mt-2">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-black/[0.05] bg-white p-1 dark:border-white/[0.08] dark:bg-surface-dark">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-ios'
                  : 'text-gray-600 hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.06]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
