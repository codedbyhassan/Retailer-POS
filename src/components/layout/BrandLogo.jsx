import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

export default function BrandLogo({ className = '' }) {
  const { user } = useAuth();
  const home = user?.role === ROLES.ADMIN ? '/admin' : '/pos';

  return (
    <Link
      to={home}
      className={`group flex items-baseline gap-1.5 select-none ${className}`}
    >
      <span className="font-brand text-[2rem] font-bold leading-none tracking-tight text-brand-600 transition-colors duration-200 group-hover:text-brand-500 dark:text-brand-400 dark:group-hover:text-brand-300">
        Retailer
      </span>
      <span className="font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
        POS
      </span>
    </Link>
  );
}
