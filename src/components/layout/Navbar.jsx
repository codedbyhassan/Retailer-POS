import BrandLogo from './BrandLogo';
import StatusPills from './StatusPills';
import ThemeToggle from './ThemeToggle';
import AvatarMenu from './AvatarMenu';

export default function Navbar({ compact = false }) {
  return (
    <header className="glass-nav sticky top-0 z-30">
      <div className="flex h-[3.75rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <BrandLogo />

        <div className="flex items-center gap-2 sm:gap-3">
          <StatusPills compact={compact} />
          <div className="mx-1 hidden h-6 w-px bg-black/[0.06] sm:block dark:bg-white/[0.08]" />
          <ThemeToggle />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}
