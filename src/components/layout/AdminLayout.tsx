import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, ShieldCheck, ArrowDownToLine, ArrowUpFromLine,
  Receipt, Coins, BarChart3, CandlestickChart, TrendingUp, CreditCard,
  Banknote, LifeBuoy, Bell, Gift, FileBarChart, Settings, Lock,
  UserCog, ScrollText, Menu, X, LogOut, ChevronDown, TrendingUp as Logo,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { classNames } from '@/lib/format';

const adminNav = [
  { section: 'Operations', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  ]},
  { section: 'Finance', items: [
    { to: '/admin/deposits', label: 'Deposits', icon: ArrowDownToLine },
    { to: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
    { to: '/admin/transactions', label: 'Transactions', icon: Receipt },
  ]},
  { section: 'Markets', items: [
    { to: '/admin/assets', label: 'Assets', icon: Coins },
    { to: '/admin/markets', label: 'Markets', icon: BarChart3 },
    { to: '/admin/trading', label: 'Trading', icon: CandlestickChart },
    { to: '/admin/investments', label: 'Investments', icon: TrendingUp },
  ]},
  { section: 'Methods', items: [
    { to: '/admin/deposit-methods', label: 'Deposit Methods', icon: CreditCard },
    { to: '/admin/withdrawal-methods', label: 'Withdrawal Methods', icon: Banknote },
  ]},
  { section: 'Support & Ops', items: [
    { to: '/admin/support', label: 'Support', icon: LifeBuoy },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/referrals', label: 'Referrals', icon: Gift },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ]},
  { section: 'System', items: [
    { to: '/admin/settings', label: 'Site Settings', icon: Settings },
    { to: '/admin/security', label: 'Security', icon: Lock },
    { to: '/admin/admin-users', label: 'Admin Users', icon: UserCog },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  ]},
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      <aside className="hidden lg:flex w-60 bg-surface-900 dark:bg-black flex-col fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center px-5 border-b border-surface-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Vaultex</span>
            <span className="text-2xs font-medium text-surface-400 ml-1">ADMIN</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          {adminNav.map(group => (
            <div key={group.section} className="mb-3">
              <p className="px-3 py-1 text-2xs font-semibold text-surface-500 uppercase tracking-wider">{group.section}</p>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={classNames(
                      'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors mb-0.5',
                      isActive(item.to)
                        ? 'bg-brand-600 text-white'
                        : 'text-surface-300 hover:bg-surface-800 hover:text-white',
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-700">
          <Link to="/app" className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-surface-400 hover:bg-surface-800 hover:text-white">
            <LayoutDashboard className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-surface-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-surface-900 flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-surface-700">
              <span className="text-lg font-bold text-white">Admin Console</span>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-surface-400" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2">
              {adminNav.map(group => (
                <div key={group.section} className="mb-3">
                  <p className="px-3 py-1 text-2xs font-semibold text-surface-500 uppercase">{group.section}</p>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}
                        className={classNames('flex items-center gap-3 px-3 py-2 rounded text-sm font-medium mb-0.5',
                          isActive(item.to) ? 'bg-brand-600 text-white' : 'text-surface-300 hover:bg-surface-800')}>
                        <Icon className="w-4 h-4" />{item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-surface-500 dark:text-surface-400">Admin Console</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1 pr-2 rounded hover:bg-surface-100 dark:hover:bg-surface-800">
                  <Avatar name="Admin User" size="sm" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-200 hidden sm:block">Admin</span>
                  <ChevronDown className="w-4 h-4 text-surface-400 hidden sm:block" />
                </button>
              }
            >
              <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">Admin User</p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Super Admin</p>
              </div>
              <DropdownItem icon={<LayoutDashboard className="w-4 h-4" />} onClick={() => navigate('/app')}>
                Back to App
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<LogOut className="w-4 h-4" />} variant="danger" onClick={() => navigate('/')}>
                Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 bg-surface-50 dark:bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
