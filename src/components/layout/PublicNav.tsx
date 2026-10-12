import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, TrendingUp, Wallet } from 'lucide-react';
import { classNames } from '@/lib/format';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ConnectWalletModal } from '@/components/ui/ConnectWalletModal';

const navLinks = [
  { to: '/markets', label: 'Markets' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/security', label: 'Security' },
  { to: '/help', label: 'Help Center' },
  { to: '/contact', label: 'Contact' },
];

export function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      <header className="bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-700 rounded flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-surface-900 dark:text-white tracking-tight">Vaultex</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={classNames(
                      'px-3 py-2 text-sm font-medium rounded transition-colors',
                      location.pathname === link.to
                        ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950'
                        : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-800',
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setWalletOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950 rounded transition-colors"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="px-4 py-2 text-sm font-medium text-white bg-brand-700 hover:bg-brand-800 rounded transition-colors">
                Get Started
              </Link>
            </div>
            <div className="flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <button className="p-2" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-sm font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 rounded"
                >
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setWalletOpen(true); setMobileOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded mt-2"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </button>
              <div className="pt-2 border-t border-surface-100 dark:border-surface-800 flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-center text-surface-700 dark:text-surface-300 border border-surface-300 dark:border-surface-700 rounded">
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex-1 px-4 py-2 text-sm font-medium text-center text-white bg-brand-700 rounded">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
      <ConnectWalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-white dark:bg-surface-950 border-t border-surface-200 dark:border-surface-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-brand-700 rounded flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-surface-900 dark:text-white">Vaultex</span>
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              A digital asset platform for trading and investing in cryptocurrencies.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-surface-900 dark:text-white uppercase tracking-wide mb-3">Products</h4>
            <ul className="space-y-2">
              <li><Link to="/markets" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Markets</Link></li>
              <li><Link to="/pricing" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Pricing & Fees</Link></li>
              <li><Link to="/app/invest" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Investment Products</Link></li>
              <li><Link to="/app/trade" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Trading</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-surface-900 dark:text-white uppercase tracking-wide mb-3">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">About</Link></li>
              <li><Link to="/security" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Security</Link></li>
              <li><Link to="/contact" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Contact</Link></li>
              <li><Link to="/help" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Help Center</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-surface-900 dark:text-white uppercase tracking-wide mb-3">Legal</h4>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/risk-disclosure" className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white">Risk Disclosure</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-surface-100 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surface-400 dark:text-surface-500">
            &copy; {new Date().getFullYear()} Vaultex. All rights reserved. Digital asset investments are subject to market risk.
          </p>
        </div>
      </div>
    </footer>
  );
}
