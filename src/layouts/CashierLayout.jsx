import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function CashierLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-secondary dark:bg-black">
      <Navbar compact />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
