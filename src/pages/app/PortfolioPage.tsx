import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpDown } from 'lucide-react';
import { Card, PageHeader, EmptyState, StatCard } from '@/components/ui/Card';
import { Search as SearchInput } from '@/components/ui/Dropdown';
import { formatPrice, formatPercent, formatCurrency, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  value: number;
  change24h: number;
}

export default function PortfolioPage() {
  const { session } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'change'>('value');
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHoldings = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data: assets } = await supabase.from('assets').select('id, symbol, name, current_price, price_change_24h');
    const { data: bals } = await supabase.from('balances').select('*').eq('user_id', session.user.id);

    const assetMap: Record<string, { symbol: string; name: string; current_price: number; price_change_24h: number }> = {};
    (assets || []).forEach(a => { assetMap[a.id] = a; });

    const result: Holding[] = (bals || [])
      .map(b => {
        const asset = assetMap[b.asset_id];
        if (!asset) return null;
        const qty = Number(b.available) + Number(b.invested);
        if (qty <= 0) return null;
        return {
          symbol: asset.symbol,
          name: asset.name,
          quantity: qty,
          currentPrice: asset.current_price,
          value: qty * asset.current_price,
          change24h: asset.price_change_24h,
        };
      })
      .filter((h): h is Holding => h !== null)
      .sort((a, b) => b.value - a.value);

    setHoldings(result);
    setLoading(false);
  }, [session]);

  useEffect(() => { loadHoldings(); }, [loadHoldings]);

  const filtered = useMemo(() => {
    let result = holdings.filter(h => !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.symbol.toLowerCase().includes(search.toLowerCase()));
    if (sortBy === 'value') result = [...result].sort((a, b) => b.value - a.value);
    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'change') result = [...result].sort((a, b) => b.change24h - a.change24h);
    return result;
  }, [holdings, search, sortBy]);

  const totalValue = holdings.reduce((s, h) => s + h.value, 0);
  const bestPerformer = holdings.length > 0 ? holdings.reduce((best, h) => h.change24h > best.change24h ? h : best, holdings[0]) : null;
  const allocationData = holdings.map(h => ({ name: h.symbol, value: h.value }));
  const portfolioChange24h = totalValue > 0 ? holdings.reduce((sum, holding) => sum + holding.change24h * (holding.value / totalValue), 0) : 0;

  const sortLabels: Record<string, string> = { value: 'Value', name: 'Name', change: '24h Change' };

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <PageHeader title="Portfolio" subtitle="Track your holdings, allocation, and performance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Value" value={formatCurrency(totalValue)} change={portfolioChange24h} />
        <StatCard label="Assets Held" value={holdings.length.toString()} />
        <StatCard label="Best Performer" value={bestPerformer?.symbol || '—'} subtitle={bestPerformer ? formatPercent(bestPerformer.change24h) : ''} />
        <StatCard label="Total Cost Basis" value="Unavailable" subtitle="Purchase cost is not stored in the current database" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Portfolio Value History</h3>
          <div className="h-56 flex items-center justify-center text-sm text-surface-500 dark:text-surface-400 text-center">Historical balance snapshots are not stored in the current database.</div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Asset Allocation</h3>
          {allocationData.length === 0 ? (
            <p className="text-sm text-surface-500 dark:text-surface-400 text-center py-8">No holdings to allocate.</p>
          ) : (
            <div className="space-y-3">
              {allocationData.map((a, i) => {
                const pct = (a.value / totalValue) * 100;
                const colors = ['#0F766E', '#14B8A6', '#5EEAD4', '#99F6E4', '#2563EB', '#3B82F6', '#93C5FD'];
                return (
                  <div key={a.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{a.name}</span>
                      <span className="text-sm num text-surface-500 dark:text-surface-400">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Your Holdings</h3>
          <div className="flex items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search assets..." className="w-48" />
            <button onClick={() => setSortBy(sortBy === 'value' ? 'name' : sortBy === 'name' ? 'change' : 'value')} className="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 px-3 py-2 rounded border border-surface-200 dark:border-surface-700">
              <ArrowUpDown className="w-3.5 h-3.5" /> {sortLabels[sortBy]}
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Wallet className="w-8 h-8" />} title="No holdings found" description="You don't hold any assets matching your search." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
                  <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Asset</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Quantity</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Current Price</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Value</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">24h</th>
                  <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {filtered.map(h => (
                  <tr key={h.symbol} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                    <td className="px-5 py-3">
                      <Link to={`/app/assets/${h.symbol}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-bold">{h.symbol.slice(0, 2)}</div>
                        <div>
                          <p className="text-sm font-semibold text-surface-900 dark:text-white">{h.symbol}</p>
                          <p className="text-xs text-surface-500 dark:text-surface-400">{h.name}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right text-sm num text-surface-700 dark:text-surface-300">{h.quantity.toFixed(4)}</td>
                    <td className="px-5 py-3 text-right text-sm num text-surface-900 dark:text-white">{formatPrice(h.currentPrice)}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold num text-surface-900 dark:text-white">{formatCurrency(h.value)}</td>
                    <td className={classNames('px-5 py-3 text-right text-sm num font-medium', h.change24h >= 0 ? 'text-positive' : 'text-negative')}>{formatPercent(h.change24h)}</td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/app/trade?pair=${h.symbol}USDT`} className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Trade</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
