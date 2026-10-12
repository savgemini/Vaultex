import { Outlet } from 'react-router-dom';
import { PublicNav, PublicFooter } from '@/components/layout/PublicNav';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
