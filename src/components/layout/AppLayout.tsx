import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutGrid, Wallet, BarChart3, CandlestickChart, TrendingUp, Coins,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Receipt, Gift,
  LifeBuoy, Settings, Bell, Search as SearchIcon, Menu, X, LogOut,
  User, ShieldCheck, ChevronDown, TrendingUp as Logo,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ConnectWalletModal } from '@/components/ui/ConnectWalletModal';
import { classNames } from '@/lib/format';

const navItems = [
  { to: '/app', label: 'Overview', icon: LayoutGrid },
  { to: '/app/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/app/markets', label: 'Markets', icon: BarChart3 },
  { to: '/app/trade', label: 'Trade', icon: CandlestickChart },
  { to: '/app/invest', label: 'Invest', icon: TrendingUp },
  { to: '/app/assets', label: 'Assets', icon: Coins },
  { to: '/app/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { to: '/app/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { to: '/app/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/app/transactions', label: 'Transactions', icon: Receipt },
  { to: '/app/rewards', label: 'Rewards', icon: Gift },
  { to: '/app/support', label: 'Support', icon: LifeBuoy },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  const isActive = (path: string) => path === '/app' ? location.pathname === '/app' : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex-col fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center px-5 border-b border-surface-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-700 rounded flex items-center justify-center">
              <Logo className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-surface-900 dark:text-white tracking-tight">Vaultex</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={classNames(
                  'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors mb-0.5',
                  isActive(item.to)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-surface-200 dark:border-surface-800">
          {profile?.is_admin && (
            <Link to="/admin" className="flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-700 dark:hover:text-surface-200">
              <ShieldCheck className="w-4 h-4" />
              Admin Console
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-surface-950/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-64 bg-white flex flex-col animate-slide-in-right">
            <div className="h-16 flex items-center justify-between px-5 border-b border-surface-200">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-700 rounded flex items-center justify-center">
                  <Logo className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-surface-900">Vaultex</span>
              </Link>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-surface-500" /></button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-2">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={classNames(
                      'flex items-center gap-3 px-3 py-2 rounded text-sm font-medium mb-0.5',
                      isActive(item.to) ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1">
            <button className="lg:hidden p-2 -ml-2" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative max-w-md w-full hidden sm:block">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search assets, orders..."
                className="w-full h-9 pl-10 pr-3 rounded border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:bg-white dark:focus:bg-surface-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWalletOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950 rounded transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Connect Wallet</span>
            </button>
            <ThemeToggle />
            <Link to="/app/notifications" className="relative p-2 rounded hover:bg-surface-100 dark:hover:bg-surface-800">
              <Bell className="w-5 h-5 text-surface-600 dark:text-surface-300" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-negative rounded-full" />
            </Link>
            <Link to="/app/support" className="p-2 rounded hover:bg-surface-100 dark:hover:bg-surface-800 hidden sm:block">
              <LifeBuoy className="w-5 h-5 text-surface-600 dark:text-surface-300" />
            </Link>
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1 pr-2 rounded hover:bg-surface-100 dark:hover:bg-surface-800">
                  <Avatar name={profile?.full_name || 'User'} size="sm" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-200 hidden sm:block">{profile?.full_name?.split(' ')[0] || 'User'}</span>
                  <ChevronDown className="w-4 h-4 text-surface-400 hidden sm:block" />
                </button>
              }
            >
              <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{profile?.full_name}</p>
                <p className="text-xs text-surface-500 dark:text-surface-400">{profile?.email}</p>
              </div>
              <DropdownItem icon={<User className="w-4 h-4" />} onClick={() => navigate('/app/settings')}>
                Profile & Settings
              </DropdownItem>
              <DropdownItem icon={<ShieldCheck className="w-4 h-4" />} onClick={() => navigate('/app/verification')}>
                Verification Center
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<LogOut className="w-4 h-4" />} variant="danger" onClick={handleSignOut}>
                Sign Out
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 bg-surface-50 dark:bg-surface-950">
          <Outlet />
        </main>
      </div>

      <ConnectWalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}
