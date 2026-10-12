import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, TrendingUp, TrendingDown, Wallet, Clock, BarChart3, Link as LinkIcon, Power } from 'lucide-react';
import { Card, StatCard, PageHeader, EmptyState } from '@/components/ui/Card';
import { LineChart } from '@/components/ui/LineChart';
import { StatusBadge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { ConnectWalletModal, disconnectWalletConnection, readWalletConnectionStatus } from '@/components/ui/ConnectWalletModal';
import { formatPrice, formatPercent, formatCurrency, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { Transaction } from '@/types';

const quickActions = [
  { to: '/app/deposit', label: 'Deposit', icon: ArrowDownToLine },
  { to: '/app/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  { to: '/app/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/app/trade', label: 'Trade', icon: TrendingUp },
];

interface BalanceRow {
  asset_id: string;
  available: number;
  invested: number;
  pending: number;
}

export default function DashboardPage() {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionActivity, setTransactionActivity] = useState<{ time: string; price: number }[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [assetMap, setAssetMap] = useState<Record<string, { symbol: string; name: string; current_price: number; price_change_24h: number }>>({});
  const [loading, setLoading] = useState(true);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletPayload, setWalletPayload] = useState(readWalletConnectionStatus());

  const refreshWalletState = () => {
    const nextPayload = readWalletConnectionStatus();
    setWalletPayload(nextPayload);
    setWalletConnected(Boolean(nextPayload?.connected));
  };

  useEffect(() => {
    refreshWalletState();
    const onWalletStatus = () => refreshWalletState();
    window.addEventListener('vaultex-wallet-status', onWalletStatus);
    return () => window.removeEventListener('vaultex-wallet-status', onWalletStatus);
  }, []);

  const handleDisconnectWallet = async () => {
    await disconnectWalletConnection();
    refreshWalletState();
    toast('Wallet disconnected.', 'success');
  };

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data: assets } = await supabase.from('assets').select('id, symbol, name, current_price, price_change_24h').order('display_order');
    const map: Record<string, { symbol: string; name: string; current_price: number; price_change_24h: number }> = {};
    (assets || []).forEach(a => { map[a.id] = a; });
    setAssetMap(map);

    const { data: bals } = await supabase.from('balances').select('*').eq('user_id', session.user.id);
    setBalances((bals as BalanceRow[]) || []);

    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setTransactions((txns as Transaction[]) || []);

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 29);
    monthAgo.setHours(0, 0, 0, 0);
    const { data: activityRows } = await supabase.from('transactions')
      .select('created_at, amount, asset_symbol')
      .eq('user_id', session.user.id)
      .gte('created_at', monthAgo.toISOString())
      .order('created_at', { ascending: true });
    const prices = new Map((assets || []).map(asset => [asset.symbol, Number(asset.current_price)]));
    const dailyActivity = new Map<string, number>();
    (activityRows || []).forEach(row => {
      const day = new Date(row.created_at);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      dailyActivity.set(key, (dailyActivity.get(key) || 0) + Number(row.amount) * (prices.get(row.asset_symbol) || 0));
    });
    const activitySeries = [];
    for (let offset = 0; offset < 30; offset += 1) {
      const day = new Date(monthAgo);
      day.setDate(monthAgo.getDate() + offset);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      activitySeries.push({ time: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), price: dailyActivity.get(key) || 0 });
    }
    setTransactionActivity(activitySeries);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadData(); }, [loadData]);

  const holdings = balances
    .map(b => {
      const asset = assetMap[b.asset_id];
      if (!asset) return null;
      return {
        symbol: asset.symbol,
        name: asset.name,
        quantity: Number(b.available) + Number(b.invested),
        price: asset.current_price,
        value: (Number(b.available) + Number(b.invested)) * asset.current_price,
        change24h: asset.price_change_24h,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null)
    .sort((a, b) => b.value - a.value);

  const totalBalance = holdings.reduce((s, h) => s + h.value, 0);
  const available = balances.reduce((sum, balance) => {
    const asset = assetMap[balance.asset_id];
    return sum + (asset ? Number(balance.available) * asset.current_price : 0);
  }, 0);
  const change24h = holdings.length > 0
    ? holdings.reduce((s, h) => s + h.change24h * (h.value / totalBalance), 0)
    : 0;

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <PageHeader
        title={`Welcome, ${profile?.full_name?.split(' ')[0] || 'User'}`}
        subtitle="Here's an overview of your portfolio and recent activity."
        actions={
          walletConnected ? (
            <Dropdown
              trigger={
                <button type="button" className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-white bg-positive border border-positive hover:bg-positive-dark rounded transition-colors">
                  <Wallet className="w-4 h-4" />
                  <span>Wallet Connected</span>
                </button>
              }
              align="right"
              width="w-64"
            >
              <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800">
                <p className="text-xs font-semibold uppercase text-surface-500 dark:text-surface-400">Connected wallet</p>
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">{walletPayload?.wallet_name || 'Wallet'}</p>
                <p className="text-[11px] font-mono text-surface-500 dark:text-surface-400 break-all">{walletPayload?.wallet_address || 'No address stored'}</p>
              </div>
              <DropdownItem icon={<Power className="w-4 h-4" />} variant="danger" onClick={handleDisconnectWallet}>
                Disconnect Wallet
              </DropdownItem>
            </Dropdown>
          ) : (
            <button onClick={() => setWalletOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800 hover:bg-brand-50 dark:hover:bg-brand-950 rounded transition-colors">
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          )
        }
      />

      {/* Balance cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Balance" value={formatCurrency(totalBalance)} change={change24h} icon={<Wallet className="w-5 h-5" />} />
        <StatCard label="Available" value={formatCurrency(available)} subtitle="Available balances at current prices" />
        <StatCard label="Assets Held" value={holdings.length.toString()} subtitle="Across your portfolio" />
        <StatCard label="24h Change" value={formatPercent(change24h)} change={change24h} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Portfolio chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Transaction Activity</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400">Daily transaction value using current asset prices · 30 days</p>
            </div>
          </div>
          <LineChart data={transactionActivity} height={240} />
        </Card>

        {/* Quick actions */}
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(a => {
              const Icon = a.icon;
              return (
                <Link key={a.to} to={a.to} className="flex flex-col items-center justify-center p-4 border border-surface-200 dark:border-surface-800 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 hover:border-brand-300 dark:hover:border-brand-700 transition-colors">
                  <Icon className="w-5 h-5 text-brand-700 dark:text-brand-400 mb-2" />
                  <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{a.label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
            <h4 className="text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide mb-3">Market Overview</h4>
            <div className="space-y-2">
              {Object.values(assetMap).slice(0, 3).map(a => (
                <Link key={a.symbol} to={`/app/assets/${a.symbol}`} className="flex items-center justify-between text-sm hover:bg-surface-50 dark:hover:bg-surface-800 -mx-2 px-2 py-1 rounded">
                  <span className="font-medium text-surface-700 dark:text-surface-300">{a.symbol}</span>
                  <div className="flex items-center gap-3">
                    <span className="num text-surface-900 dark:text-white">{formatPrice(a.current_price)}</span>
                    <span className={classNames('num text-xs font-medium', a.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>
                      {formatPercent(a.price_change_24h)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent transactions + Holdings */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Recent Transactions</h3>
            <Link to="/app/transactions" className="text-xs font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">View all</Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />)}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState title="No transactions yet" description="Your deposit, withdrawal, and trading activity will appear here." action={<Link to="/app/deposit" className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Make your first deposit</Link>} />
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {transactions.map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800">
                  <div className="flex items-center gap-3">
                    <div className={classNames('w-8 h-8 rounded-full flex items-center justify-center', t.type === 'deposit' ? 'bg-positive-light dark:bg-positive/15' : t.type === 'withdrawal' ? 'bg-negative-light dark:bg-negative/15' : 'bg-surface-100 dark:bg-surface-800')}>
                      {t.type === 'deposit' ? <ArrowDownToLine className="w-4 h-4 text-positive" /> : t.type === 'withdrawal' ? <ArrowUpFromLine className="w-4 h-4 text-negative" /> : <Clock className="w-4 h-4 text-surface-500 dark:text-surface-400" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white capitalize">{t.type.replace('_', ' ')}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{t.asset_symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold num text-surface-900 dark:text-white">{Number(t.amount).toFixed(4)} {t.asset_symbol}</p>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Your Holdings</h3>
            <Link to="/app/portfolio" className="text-xs font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">View portfolio</Link>
          </div>
          {holdings.length === 0 ? (
            <EmptyState title="No holdings yet" description="Start trading to build your portfolio." action={<Link to="/app/trade" className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Go to Trade</Link>} />
          ) : (
            <div className="divide-y divide-surface-100 dark:divide-surface-800">
              {holdings.slice(0, 5).map(h => (
                <Link key={h.symbol} to={`/app/assets/${h.symbol}`} className="px-5 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold">{h.symbol.slice(0, 2)}</div>
                    <div>
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{h.symbol}</p>
                      <p className="text-xs text-surface-500 dark:text-surface-400">{h.quantity.toFixed(4)} {h.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold num text-surface-900 dark:text-white">{formatCurrency(h.value)}</p>
                    <p className={classNames('text-xs font-medium num', h.change24h >= 0 ? 'text-positive' : 'text-negative')}>{formatPercent(h.change24h)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConnectWalletModal open={walletOpen} onClose={() => setWalletOpen(false)} />
    </div>
  );
}
