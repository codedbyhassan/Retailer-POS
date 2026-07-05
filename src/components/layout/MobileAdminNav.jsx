import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin', label: 'Home', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Stock' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/pos', label: 'POS' },
];

export default function MobileAdminNav() {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-black/[0.04] bg-white/80 px-3 py-2 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/80 md:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ease-ios ${
              isActive
                ? 'bg-brand-500/10 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                : 'text-gray-500 hover:bg-black/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06]'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
