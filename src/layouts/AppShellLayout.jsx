import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

export default function AppShellLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto p-5 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
