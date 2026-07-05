import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import MobileAdminNav from '../components/layout/MobileAdminNav';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true, icon: DashboardIcon },
  { to: '/admin/products', label: 'Products', icon: BoxIcon },
  { to: '/admin/inventory', label: 'Inventory', icon: LayersIcon },
  { to: '/admin/sales', label: 'Sales', icon: ReceiptIcon },
  { to: '/admin/reports', label: 'Reports', icon: ChartIcon },
  { to: '/admin/settings/business', label: 'Settings', icon: SettingsIcon },
  { to: '/admin/settings/users', label: 'Users', icon: UsersIcon },
];

function DashboardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="7" height="9" rx="2" />
      <rect x="14" y="3" width="7" height="5" rx="2" />
      <rect x="14" y="12" width="7" height="9" rx="2" />
      <rect x="3" y="16" width="7" height="5" rx="2" />
    </svg>
  );
}

function BoxIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function LayersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function ReceiptIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2Z" />
      <path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PosIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M6 8h.01M10 8h8M6 12h.01M10 12h8M6 16h.01M10 16h4" />
    </svg>
  );
}

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <MobileAdminNav />

      <div className="flex flex-1">
        <aside className="sticky top-[3.75rem] hidden h-[calc(100vh-3.75rem)] w-[15.5rem] shrink-0 flex-col self-start border-r border-black/[0.04] bg-white/60 backdrop-blur-ios dark:border-white/[0.06] dark:bg-surface-dark/60 md:flex">
          <nav className="flex-1 space-y-1 p-3 pt-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ease-ios active:scale-[0.98] ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-700 shadow-ios-inset dark:bg-brand-500/15 dark:text-brand-300'
                      : 'text-gray-600 hover:bg-black/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.06]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-[1.125rem] w-[1.125rem] transition-colors ${
                        isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      }`}
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}

            <div className="my-3 h-px bg-black/[0.04] dark:bg-white/[0.06]" />

            <NavLink
              to="/pos"
              className="group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 ease-ios hover:bg-black/[0.04] active:scale-[0.98] dark:text-gray-400 dark:hover:bg-white/[0.06]"
            >
              <PosIcon className="h-[1.125rem] w-[1.125rem] text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
              Open POS
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-5 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
