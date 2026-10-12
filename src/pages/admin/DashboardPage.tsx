import { useState, useEffect } from 'react';
import { Users, UserCheck, UserPlus, Clock, ArrowDownToLine, ArrowUpFromLine, TrendingUp, DollarSign, LifeBuoy, Ban } from 'lucide-react';
import { Card, StatCard, PageHeader, Tabs } from '@/components/ui/Card';
import { LineChart } from '@/components/ui/LineChart';
import { formatCurrency, formatCompact, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  pendingVerification: number;
  pendingDeposits: number;
  pendingDepositsValue: number;
  pendingWithdrawals: number;
  pendingWithdrawalsValue: number;
  tradingVolume: number;
  platformFees: number;
  investmentVolume: number;
  supportTickets: number;
  restrictedAccounts: number;
  verifiedUsers: number;
}

interface Activity {
  type: string;
  detail: string;
  time: string;
  status: string;
}

interface DashboardPoint {
  time: string;
  price: number;
}

interface DatedValue {
  created_at: string;
  amount?: number | string;
  total?: number | string;
  asset_symbol?: string;
}

type DashboardRange = 'today' | '7d' | '30d' | '90d' | '12m';

function rangeStart(range: DashboardRange) {
  const start = new Date();
  if (range === 'today') start.setHours(0, 0, 0, 0);
  else if (range === '12m') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - 11);
  } else {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
  }
  return start;
}

function buildSeries(rows: DatedValue[], range: DashboardRange, valueOf: (row: DatedValue) => number): DashboardPoint[] {
  const start = rangeStart(range);
  const now = new Date();
  const buckets = new Map<string, DashboardPoint>();

  if (range === '12m') {
    for (let offset = 0; offset < 12; offset += 1) {
      const month = new Date(start.getFullYear(), start.getMonth() + offset, 1);
      const key = `${month.getFullYear()}-${month.getMonth()}`;
      buckets.set(key, { time: month.toLocaleDateString('en-US', { month: 'short' }), price: 0 });
    }
  } else {
    const dayCount = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    for (let offset = 0; offset < dayCount; offset += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + offset);
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
      buckets.set(key, { time: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), price: 0 });
    }
  }

  rows.forEach(row => {
    const date = new Date(row.created_at);
    if (date < start || date > now) return;
    const key = range === '12m'
      ? `${date.getFullYear()}-${date.getMonth()}`
      : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const point = buckets.get(key);
    if (point) point.price += valueOf(row);
  });

  return Array.from(buckets.values());
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>('7d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [charts, setCharts] = useState<{ users: DashboardPoint[]; trading: DashboardPoint[]; deposits: DashboardPoint[]; withdrawals: DashboardPoint[] }>({ users: [], trading: [], deposits: [], withdrawals: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = rangeStart(range).toISOString();
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: activeUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'active');
      const { count: verifiedUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('verification_level', 'verified');
      const { count: pendingVerification } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('account_status', 'pending_verification');
      const { count: restrictedAccounts } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).in('account_status', ['restricted', 'suspended']);

      const { data: pendingDeposits } = await supabase.from('transactions').select('amount, asset_symbol').eq('type', 'deposit').in('status', ['pending', 'under_review']);
      const { data: pendingWithdrawals } = await supabase.from('transactions').select('amount, asset_symbol').eq('type', 'withdrawal').in('status', ['pending', 'under_review']);
      const { data: completedTrades } = await supabase.from('orders').select('total, fee, created_at').eq('status', 'filled').gte('created_at', from);
      const { data: investments } = await supabase.from('investments').select('principal, asset_symbol').in('status', ['active', 'completed']);
      const { count: supportTickets } = await supabase.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'waiting_support']);

      const { data: newUserRows } = await supabase.from('profiles').select('created_at').gte('created_at', from);
      const { data: assetRows } = await supabase.from('assets').select('symbol, current_price');
      const { data: periodDeposits } = await supabase.from('transactions').select('created_at, amount, asset_symbol').eq('type', 'deposit').gte('created_at', from);
      const { data: periodWithdrawals } = await supabase.from('transactions').select('created_at, amount, asset_symbol').eq('type', 'withdrawal').gte('created_at', from);
      const { data: periodTrades } = await supabase.from('orders').select('created_at, total').eq('status', 'filled').gte('created_at', from);

      const priceMap = new Map((assetRows || []).map(asset => [asset.symbol, Number(asset.current_price)]));
      const usdValue = (row: { amount: number | string; asset_symbol?: string }) => Number(row.amount) * (priceMap.get(row.asset_symbol || '') || 0);
      const tradingVolume = (completedTrades || []).reduce((s, t) => s + Number(t.total), 0);
      const platformFees = (completedTrades || []).reduce((s, t) => s + Number(t.fee), 0);
      const investmentVolume = (investments || []).reduce((s, investment) => s + Number(investment.principal) * (priceMap.get(investment.asset_symbol) || 0), 0);
      const pendingDepositsValue = (pendingDeposits || []).reduce((s, t) => s + usdValue(t), 0);
      const pendingWithdrawalsValue = (pendingWithdrawals || []).reduce((s, t) => s + usdValue(t), 0);

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        newUsers: (newUserRows || []).length,
        pendingVerification: pendingVerification || 0,
        pendingDeposits: (pendingDeposits || []).length,
        pendingDepositsValue,
        pendingWithdrawals: (pendingWithdrawals || []).length,
        pendingWithdrawalsValue,
        tradingVolume,
        platformFees,
        investmentVolume,
        supportTickets: supportTickets || 0,
        restrictedAccounts: restrictedAccounts || 0,
        verifiedUsers: verifiedUsers || 0,
      });

      setCharts({
        users: buildSeries((newUserRows || []) as DatedValue[], range, () => 1),
        trading: buildSeries((periodTrades || []) as DatedValue[], range, row => Number(row.total || 0)),
        deposits: buildSeries((periodDeposits || []) as DatedValue[], range, row => usdValue(row as { amount: number | string; asset_symbol?: string })),
        withdrawals: buildSeries((periodWithdrawals || []) as DatedValue[], range, row => usdValue(row as { amount: number | string; asset_symbol?: string })),
      });

      const { data: recentTxns } = await supabase.from('transactions').select('type, asset_symbol, amount, status, created_at, reference').order('created_at', { ascending: false }).limit(5);
      const { data: recentUsers } = await supabase.from('profiles').select('full_name, email, created_at').order('created_at', { ascending: false }).limit(3);
      const { data: recentTickets } = await supabase.from('support_tickets').select('subject, created_at, status').order('created_at', { ascending: false }).limit(2);

      const acts: Activity[] = [];
      (recentUsers || []).forEach(u => acts.push({ type: 'User Registration', detail: u.email || '', time: timeAgo(u.created_at), status: 'new' }));
      (recentTxns || []).forEach(t => acts.push({
        type: t.type === 'deposit' ? 'Deposit Request' : t.type === 'withdrawal' ? 'Withdrawal Request' : `${t.type} Order`,
        detail: `${t.asset_symbol} ${t.amount} (${t.reference || ''})`,
        time: timeAgo(t.created_at),
        status: t.status,
      }));
      (recentTickets || []).forEach(t => acts.push({ type: 'Support Ticket', detail: t.subject || '', time: timeAgo(t.created_at), status: t.status }));
      acts.sort((a, b) => a.time.localeCompare(b.time));
      setActivity(acts.slice(0, 8));
      setLoading(false);
    })();
  }, [range]);

  const ranges: { key: DashboardRange; label: string }[] = [{ key: 'today', label: 'Today' }, { key: '7d', label: '7 Days' }, { key: '30d', label: '30 Days' }, { key: '90d', label: '90 Days' }, { key: '12m', label: '12 Months' }];

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <PageHeader title="Dashboard" subtitle="Platform overview and key metrics." actions={
        <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded">
          {ranges.map(r => <button key={r.key} onClick={() => setRange(r.key)} className={classNames('px-3 py-1.5 text-xs font-medium rounded transition-colors', range === r.key ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200')}>{r.label}</button>)}
        </div>
      } />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={(stats?.totalUsers || 0).toLocaleString()} icon={<Users className="w-5 h-5" />} />
            <StatCard label="Active Users" value={(stats?.activeUsers || 0).toLocaleString()} subtitle={`${stats?.totalUsers ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total`} />
            <StatCard label="New Users" value={(stats?.newUsers || 0).toString()} subtitle={`Selected period: ${ranges.find(item => item.key === range)?.label}`} icon={<UserPlus className="w-5 h-5" />} />
            <StatCard label="Pending Verification" value={(stats?.pendingVerification || 0).toString()} icon={<Clock className="w-5 h-5" />} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Pending Deposits" value={(stats?.pendingDeposits || 0).toString()} subtitle={formatCurrency(stats?.pendingDepositsValue || 0)} icon={<ArrowDownToLine className="w-5 h-5" />} />
            <StatCard label="Pending Withdrawals" value={(stats?.pendingWithdrawals || 0).toString()} subtitle={formatCurrency(stats?.pendingWithdrawalsValue || 0)} icon={<ArrowUpFromLine className="w-5 h-5" />} />
            <StatCard label="Trading Volume" value={formatCompact(stats?.tradingVolume || 0)} subtitle={`Filled orders · ${ranges.find(item => item.key === range)?.label}`} icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard label="Platform Fees" value={formatCurrency(stats?.platformFees || 0)} subtitle={`Filled orders · ${ranges.find(item => item.key === range)?.label}`} icon={<DollarSign className="w-5 h-5" />} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Investment Volume" value={formatCompact(stats?.investmentVolume || 0)} />
            <StatCard label="Support Tickets" value={(stats?.supportTickets || 0).toString()} subtitle="Open" icon={<LifeBuoy className="w-5 h-5" />} />
            <StatCard label="Restricted Accounts" value={(stats?.restrictedAccounts || 0).toString()} icon={<Ban className="w-5 h-5" />} />
            <StatCard label="Verified Users" value={(stats?.verifiedUsers || 0).toLocaleString()} subtitle={`${stats?.totalUsers ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1) : 0}% of total`} icon={<UserCheck className="w-5 h-5" />} />
          </div>
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">User Registrations</h3>
          <LineChart data={charts.users} height={200} axisFormatter={value => Math.round(value).toLocaleString()} />
        </Card>
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Trading Volume</h3>
          <LineChart data={charts.trading} height={200} color="#2563EB" />
        </Card>
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Deposit Volume</h3>
          <LineChart data={charts.deposits} height={200} color="#16A34A" />
        </Card>
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Withdrawal Volume</h3>
          <LineChart data={charts.withdrawals} height={200} color="#DC2626" />
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden dark:bg-surface-900 dark:border-surface-800">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800"><h3 className="text-sm font-semibold text-surface-900 dark:text-white">Recent Platform Activity</h3></div>
        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {activity.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-surface-500 dark:text-surface-400">No recent activity.</p></div>
          ) : activity.map((a, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-surface-800">
              <div><p className="text-sm font-medium text-surface-900 dark:text-white">{a.type}</p><p className="text-xs text-surface-500 dark:text-surface-400">{a.detail}</p></div>
              <div className="flex items-center gap-3">
                <span className={classNames('text-xs px-2 py-0.5 rounded font-medium', a.status === 'pending' ? 'bg-pending-light dark:bg-pending/15 text-pending-dark dark:text-pending' : a.status === 'review' || a.status === 'open' || a.status === 'waiting_support' ? 'bg-info-light dark:bg-info/15 text-info-dark dark:text-info' : a.status === 'completed' || a.status === 'filled' ? 'bg-positive-light dark:bg-positive/15 text-positive-dark dark:text-positive' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400')}>{a.status}</span>
                <span className="text-xs text-surface-400 dark:text-surface-500">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}
