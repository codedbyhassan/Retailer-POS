import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function UserIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogOutIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function AvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfile = () => {
    setOpen(false);
    navigate('/profile');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-semibold text-white shadow-ios transition-all duration-200 ease-ios hover:shadow-ios-md active:scale-90 ${
          open ? 'ring-2 ring-brand-400/40 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark' : ''
        }`}
      >
        {getInitials(user?.name)}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 animate-fade-in" aria-hidden="true" />
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 origin-top-right animate-scale-in">
            <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white/95 p-2 shadow-ios-lg backdrop-blur-ios backdrop-saturate-150 dark:border-white/[0.08] dark:bg-surface-dark/95">
              <div className="border-b border-black/[0.04] px-3.5 py-3 dark:border-white/[0.06]">
                <p className="truncate font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                <span className="mt-2 inline-flex rounded-full bg-brand-500/10 px-2.5 py-0.5 text-[0.6875rem] font-semibold capitalize text-brand-600 dark:text-brand-400">
                  {user?.role}
                </span>
              </div>

              <div className="p-1.5">
                <button type="button" onClick={handleProfile} className="ios-menu-item">
                  <UserIcon className="h-[1.125rem] w-[1.125rem] text-gray-500" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ios-menu-item text-red-600 hover:bg-red-500/[0.08] dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <LogOutIcon className="h-[1.125rem] w-[1.125rem]" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
