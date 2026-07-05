import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-black/[0.04] py-4 last:border-0 dark:border-white/[0.06]">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAdmin } = useAuth();
  const backTo = isAdmin ? '/admin' : '/pos';

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to={backTo}
        className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-500 dark:text-brand-400"
      >
        ← Back
      </Link>
      <h2 className="mb-1">Profile</h2>
      <p className="mb-8 text-sm text-gray-500 dark:text-gray-400">Your account information</p>

      <div className="ios-card overflow-hidden p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-xl font-bold text-white shadow-ios">
            {user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="!text-lg">{user?.name}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <InfoRow label="Role" value={user?.role} />
        <InfoRow label="Access Level" value={isAdmin ? 'Full access' : 'POS only'} />
        <InfoRow label="Account Type" value={user?.role === ROLES.ADMIN ? 'Administrator' : 'Cashier'} />
      </div>
    </div>
  );
}
