import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin', label: 'Home', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Inventory' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/settings/business', label: 'Settings' },
  { to: '/admin/settings/users', label: 'Users' },
  { to: '/pos', label: 'POS' },
];

export default function MobileAdminNav() {
  return (
    <nav aria-label="Admin navigation" className="scrollbar-thin flex gap-1.5 overflow-x-auto overscroll-x-contain border-b border-black/[0.06] bg-white/90 px-2 py-2 backdrop-blur-ios dark:border-white/[0.08] dark:bg-surface-dark/90 lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-10 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition-colors duration-150 sm:px-4 ${isActive
              ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
              : 'text-gray-600 hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.06]'}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
