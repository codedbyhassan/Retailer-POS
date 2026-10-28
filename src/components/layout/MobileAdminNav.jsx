import { NavLink } from 'react-router-dom';

const items = [
  { to: '/admin', label: 'Home', end: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/inventory', label: 'Stock' },
  { to: '/admin/sales', label: 'Sales' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/settings/business', label: 'Settings' },
  { to: '/admin/settings/users', label: 'Users' },
  { to: '/pos', label: 'POS' },
];

export default function MobileAdminNav() {
  return (
    <nav
      aria-label="Admin navigation"
      className="grid grid-cols-4 gap-1 border-b border-black/[0.04] bg-white/85 px-2 py-2 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/85 max-[360px]:grid-cols-3 md:hidden"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex min-h-10 items-center justify-center rounded-xl px-2 py-2 text-center text-[0.7rem] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
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
