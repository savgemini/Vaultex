import { Link } from 'react-router-dom';
import { useState } from 'react';
import { TrendingUp, Shield, Zap, Globe, ArrowRight, CheckCircle, BarChart3, Lock, Headphones, Wallet } from 'lucide-react';
import { LineChart, Sparkline } from '@/components/ui/LineChart';
import { DEMO_ASSETS, generatePriceHistory } from '@/lib/marketData';
import { formatPrice, formatPercent, formatCompact, classNames } from '@/lib/format';
import { ConnectWalletModal } from '@/components/ui/ConnectWalletModal';

export default function HomePage() {
  const featured = DEMO_ASSETS.slice(0, 4);
  const chartData = generatePriceHistory(67284.50, 30);
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-surface-950">
      {/* Hero */}
      <section className="bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded-full mb-6">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-brand-700 dark:text-brand-400">Live trading platform</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-surface-900 dark:text-white tracking-tight leading-tight">
                Trade and invest in digital assets with confidence
              </h1>
              <p className="mt-4 text-lg text-surface-600 dark:text-surface-400 leading-relaxed max-w-lg">
                A professional platform for cryptocurrency trading, investing, and portfolio management. Built with institutional-grade security and transparent fee structure.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-brand-700 text-white font-medium rounded hover:bg-brand-800 transition-colors">
                  Create an Account <ArrowRight className="w-4 h-4" />
                </Link>
                <button onClick={() => setWalletOpen(true)} className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-medium rounded border border-surface-300 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
                  <Wallet className="w-4 h-4" /> Connect Wallet
                </button>
              </div>
              <p className="mt-4 text-xs text-surface-400 dark:text-surface-500">
                Digital asset investments are subject to market risk. Past performance does not guarantee future results.
              </p>
            </div>
            <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wide">BTC / USD</p>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white num">{formatPrice(67284.50)}</p>
                  <p className="text-sm text-positive num">+{formatPercent(2.34)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-surface-500 dark:text-surface-400">24h Volume</p>
                  <p className="text-sm font-semibold text-surface-700 dark:text-surface-300 num">{formatCompact(28500000000)}</p>
                </div>
              </div>
              <LineChart data={chartData} height={200} />
              <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Market Cap</p>
                  <p className="text-sm font-semibold num text-surface-900 dark:text-surface-200">{formatCompact(1325000000000)}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">24h High</p>
                  <p className="text-sm font-semibold num text-surface-900 dark:text-surface-200">{formatPrice(67800)}</p>
                </div>
                <div>
                  <p className="text-xs text-surface-500 dark:text-surface-400">24h Low</p>
                  <p className="text-sm font-semibold num text-surface-900 dark:text-surface-200">{formatPrice(65400)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-surface-900 dark:text-white">Market Overview</h2>
            <Link to="/markets" className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 flex items-center gap-1">
              View all markets <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map(asset => {
              const sparkData = generatePriceHistory(asset.current_price, 7).map(d => d.price);
              return (
                <Link key={asset.symbol} to={`/app/assets/${asset.symbol}`} className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg p-4 hover:shadow-card-hover transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{asset.symbol}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{asset.name}</p>
                    </div>
                    <span className={classNames('text-xs font-medium num', asset.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>
                      {formatPercent(asset.price_change_24h)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-surface-900 dark:text-white num mb-2">{formatPrice(asset.current_price)}</p>
                  <Sparkline data={sparkData} height={32} color={asset.price_change_24h >= 0 ? '#16A34A' : '#DC2626'} />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: 'Supported Assets', value: '7+' },
              { label: 'Trading Pairs', value: '12+' },
              { label: 'Investment Products', value: '4' },
              { label: 'Avg. Processing Time', value: '< 30 min' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-surface-900 dark:text-white num">{stat.value}</p>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white text-center mb-2">A complete platform for digital assets</h2>
          <p className="text-surface-500 dark:text-surface-400 text-center mb-12 max-w-2xl mx-auto">
            From spot trading to fixed-term investments, Vaultex provides the tools you need to manage your digital asset portfolio.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Spot Trading', desc: 'Market, limit, and stop orders with real-time order book depth and transparent fee structure.' },
              { icon: TrendingUp, title: 'Investment Products', desc: 'Flexible savings, fixed-term products, and staking with clear terms and risk disclosures.' },
              { icon: Wallet, title: 'Deposits & Withdrawals', desc: 'Multiple deposit and withdrawal methods with configurable limits and processing times.' },
              { icon: Shield, title: 'Security First', desc: 'Two-factor authentication, session management, and comprehensive audit logging.' },
              { icon: Globe, title: 'Asset Management', desc: 'Track holdings, monitor performance, and manage your portfolio across supported assets.' },
              { icon: Headphones, title: 'Customer Support', desc: 'Integrated support center with ticket tracking and direct communication with our team.' },
            ].map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-6">
                  <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-700 dark:text-brand-400" />
                  </div>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white dark:bg-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white text-center mb-12">How the platform works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Create an account', desc: 'Sign up with your email and complete identity verification.' },
              { step: '02', title: 'Deposit funds', desc: 'Choose from supported deposit methods including crypto and bank transfer.' },
              { step: '03', title: 'Trade or invest', desc: 'Place orders on the markets or invest in available products.' },
              { step: '04', title: 'Manage your portfolio', desc: 'Track performance, withdraw funds, and manage your account.' },
            ].map(s => (
              <div key={s.step} className="relative">
                <p className="text-3xl font-bold text-brand-200 dark:text-brand-900 num mb-2">{s.step}</p>
                <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-1">{s.title}</h3>
                <p className="text-sm text-surface-600 dark:text-surface-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-brand-700 dark:text-brand-400" />
              </div>
              <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-4">Security built into the platform</h2>
              <div className="space-y-3">
                {[
                  'Two-factor authentication support',
                  'Session and device management',
                  'Withdrawal confirmation requirements',
                  'Comprehensive audit logging for admin actions',
                  'Account restriction and verification system',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-4 h-4 text-positive shrink-0" />
                    <p className="text-sm text-surface-600 dark:text-surface-400">{item}</p>
                  </div>
                ))}
              </div>
              <Link to="/security" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">
                Learn about our security <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Supported Assets</h3>
              <div className="grid grid-cols-2 gap-3">
                {DEMO_ASSETS.map(a => (
                  <div key={a.symbol} className="flex items-center justify-between p-3 border border-surface-200 dark:border-surface-800 rounded">
                    <div>
                      <p className="text-sm font-semibold text-surface-900 dark:text-white">{a.symbol}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{a.name}</p>
                    </div>
                    <p className="text-sm font-medium num text-surface-700 dark:text-surface-300">{formatPrice(a.current_price)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white dark:bg-surface-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl font-semibold text-surface-900 dark:text-white mb-3">Start managing your digital assets today</h2>
          <p className="text-surface-600 dark:text-surface-400 mb-8 max-w-xl mx-auto">
            Create an account to access trading, investment products, and portfolio management tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signup" className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-brand-700 text-white font-medium rounded hover:bg-brand-800 transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <button onClick={() => setWalletOpen(true)} className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-medium rounded border border-surface-300 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          </div>
          <p className="mt-6 text-xs text-surface-400 dark:text-surface-500 max-w-lg mx-auto">
            Digital asset investments carry risk of loss. Please invest responsibly.
          </p>
        </div>
      </section>

      <ConnectWalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}
