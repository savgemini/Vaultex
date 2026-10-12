import { useEffect, useState } from 'react';
import { Card, PageHeader, StatCard, Tabs } from '@/components/ui/Card';
import { LineChart } from '@/components/ui/LineChart';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatCompact } from '@/lib/format';
import { EmptyState } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';

interface DatedReportRow {
  created_at: string;
  type?: string;
  status?: string;
  asset_symbol?: string;
  amount?: number | string;
  fee?: number | string;
  total?: number | string;
  principal?: number | string;
}

interface ReportPoint { time: string; price: number; }

function buildDailySeries(rows: DatedReportRow[], valueOf: (row: DatedReportRow) => number): ReportPoint[] {
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  const values = new Map<string, number>();
  rows.forEach(row => {
    const date = new Date(row.created_at);
    if (date < start) return;
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    values.set(key, (values.get(key) || 0) + valueOf(row));
  });
  return Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return { time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), price: values.get(key) || 0 };
  });
}

export default function AdminReportsPage() {
  const [report, setReport] = useState('overview');
  const [profiles, setProfiles] = useState<Array<{ id: string; created_at: string }>>([]);
  const [transactions, setTransactions] = useState<DatedReportRow[]>([]);
  const [orders, setOrders] = useState<DatedReportRow[]>([]);
  const [investments, setInvestments] = useState<DatedReportRow[]>([]);
  const [supportTickets, setSupportTickets] = useState<Array<{ created_at: string }>>([]);
  const [assetPrices, setAssetPrices] = useState<Record<string, number>>({});
  const [series, setSeries] = useState<ReportPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const reports = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'User Registrations' },
    { key: 'deposits', label: 'Deposits' },
    { key: 'withdrawals', label: 'Withdrawals' },
    { key: 'trading', label: 'Trading Volume' },
    { key: 'investments', label: 'Investment Activity' },
    { key: 'fees', label: 'Fees & Revenue' },
    { key: 'support', label: 'Support Activity' },
  ];

  useEffect(() => {
    const loadReportData = async () => {
      const [profileResult, transactionResult, orderResult, investmentResult, ticketResult, assetResult] = await Promise.all([
        supabase.from('profiles').select('id, created_at'),
        supabase.from('transactions').select('created_at, type, asset_symbol, amount, fee'),
        supabase.from('orders').select('created_at, asset_symbol, total, fee, status'),
        supabase.from('investments').select('created_at, asset_symbol, principal'),
        supabase.from('support_tickets').select('created_at'),
        supabase.from('assets').select('symbol, current_price'),
      ]);
      setProfiles(profileResult.data || []);
      setTransactions((transactionResult.data || []) as DatedReportRow[]);
      setOrders((orderResult.data || []) as DatedReportRow[]);
      setInvestments((investmentResult.data || []) as DatedReportRow[]);
      setSupportTickets(ticketResult.data || []);
      setAssetPrices(Object.fromEntries((assetResult.data || []).map(asset => [asset.symbol, Number(asset.current_price)])));
      setLoading(false);
    };

    loadReportData();
  }, []);

  useEffect(() => {
    const transactionsOfType = (type: string) => transactions.filter(row => row.type === type);
    const seriesRows: Record<string, { rows: DatedReportRow[]; value: (row: DatedReportRow) => number }> = {
      overview: { rows: orders.filter(row => row.status === 'filled'), value: row => Number(row.total || 0) },
      users: { rows: profiles, value: () => 1 },
      deposits: { rows: transactionsOfType('deposit'), value: row => Number(row.amount || 0) * (assetPrices[row.asset_symbol || ''] || 0) },
      withdrawals: { rows: transactionsOfType('withdrawal'), value: row => Number(row.amount || 0) * (assetPrices[row.asset_symbol || ''] || 0) },
      trading: { rows: orders.filter(row => row.status === 'filled'), value: row => Number(row.total || 0) },
      investments: { rows: investments, value: row => Number(row.principal || 0) * (assetPrices[row.asset_symbol || ''] || 0) },
      fees: { rows: [...orders, ...transactions], value: row => Number(row.fee || 0) * (row.type === 'withdrawal' ? (assetPrices[row.asset_symbol || ''] || 0) : 1) },
      support: { rows: supportTickets, value: () => 1 },
    };
    const selected = seriesRows[report];
    setSeries(buildDailySeries(selected.rows, selected.value));
  }, [report, profiles, transactions, orders, investments, supportTickets, assetPrices]);

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentUsers = profiles.filter(profile => new Date(profile.created_at).getTime() >= thirtyDaysAgo).length;
  const depositRows = transactions.filter(row => row.type === 'deposit');
  const withdrawalRows = transactions.filter(row => row.type === 'withdrawal');
  const filledOrders = orders.filter(row => row.status === 'filled');
  const tradingFees = filledOrders.reduce((sum, row) => sum + Number(row.fee || 0), 0);
  const withdrawalFees = withdrawalRows.reduce((sum, row) => sum + Number(row.fee || 0) * (assetPrices[row.asset_symbol || ''] || 0), 0);
  const totalTradingVolume = filledOrders.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const investmentVolume = investments.reduce((sum, row) => sum + Number(row.principal || 0) * (assetPrices[row.asset_symbol || ''] || 0), 0);
  const topAssets = Array.from(filledOrders.reduce((totals, row) => totals.set(row.asset_symbol || 'Unknown', (totals.get(row.asset_symbol || 'Unknown') || 0) + Number(row.total || 0)), new Map<string, number>()).entries())
    .map(([symbol, volume]) => ({ symbol, volume }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5);

  const exportCsv = () => {
    const csv = ['date,value', ...series.map(point => `${point.time},${point.price}`)].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `vaultex-${report}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const seriesLabels: Record<string, string> = {
    overview: 'Filled Trading Volume', users: 'User Registrations', deposits: 'Deposit Amounts',
    withdrawals: 'Withdrawal Amounts', trading: 'Trading Volume', investments: 'Investment Principal',
    fees: 'Recorded Fees', support: 'Support Tickets',
  };

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Recorded activity; token values use current catalog prices for USD equivalents" actions={<Button variant="outline" size="sm" onClick={exportCsv} disabled={loading}>Export CSV</Button>} />

      <div className="mb-4"><Tabs tabs={reports} active={report} onChange={setReport} /></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={profiles.length.toLocaleString()} />
        <StatCard label="Trading Fees" value={formatCurrency(tradingFees)} />
        <StatCard label="Withdrawal Fees" value={formatCurrency(withdrawalFees)} />
        <StatCard label="Investment Fees" value="Not recorded" />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-surface-900">{seriesLabels[report]} — Last 30 Days</h3>
        </div>
        {loading ? <div className="h-64 animate-pulse bg-surface-100 rounded" /> : <LineChart data={series} height={280} color="#2563EB" axisFormatter={value => report === 'users' || report === 'support' ? Math.round(value).toLocaleString() : formatCurrency(value)} />}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Summary Statistics</h3>
          <div className="space-y-3">
            {[
              ['Total Users', profiles.length.toLocaleString()], ['New Users (30d)', recentUsers.toLocaleString()],
              ['Deposits (USD equivalent)', formatCompact(depositRows.reduce((sum, row) => sum + Number(row.amount || 0) * (assetPrices[row.asset_symbol || ''] || 0), 0))],
              ['Withdrawals (USD equivalent)', formatCompact(withdrawalRows.reduce((sum, row) => sum + Number(row.amount || 0) * (assetPrices[row.asset_symbol || ''] || 0), 0))],
              ['Trading Volume', formatCompact(totalTradingVolume)], ['Investment Principal', formatCompact(investmentVolume)],
            ].map(([k, v]) => <div key={k} className="flex justify-between py-2 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{k}</span><span className="text-sm font-medium num text-surface-900">{v}</span></div>)}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Top Assets by Volume</h3>
          <div className="space-y-3">
            {topAssets.map(a => (
              <div key={a.symbol}>
                <div className="flex justify-between mb-1"><span className="text-sm font-medium text-surface-700">{a.symbol}</span><span className="text-sm num text-surface-500">{formatCompact(a.volume)} ({totalTradingVolume ? ((a.volume / totalTradingVolume) * 100).toFixed(1) : '0'}%)</span></div>
                <div className="h-2 bg-surface-100 rounded-full overflow-hidden"><div className="h-full bg-brand-600 rounded-full" style={{ width: `${totalTradingVolume ? (a.volume / totalTradingVolume) * 100 : 0}%` }} /></div>
              </div>
            ))}
            {topAssets.length === 0 && <EmptyState title="No trading data" description="Filled orders are not available yet." />}
          </div>
        </Card>
      </div>
    </div>
  );
}
