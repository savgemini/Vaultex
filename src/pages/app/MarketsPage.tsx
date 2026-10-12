import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowUpRight } from 'lucide-react';
import { Card, Tabs, EmptyState } from '@/components/ui/Card';
import { Search } from '@/components/ui/Dropdown';
import { formatPrice, formatPercent, formatCompact, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface MarketAsset {
  id: string; name: string; symbol: string; category: string; current_price: number; price_change_24h: number; market_cap: number; volume_24h: number;
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'major', label: 'Major' },
  { key: 'stablecoin', label: 'Stablecoins' },
  { key: 'layer1', label: 'Layer 1' },
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
];

export default function MarketsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [allAssets, setAllAssets] = useState<MarketAsset[]>([]);

  useEffect(() => {
    supabase.from('assets').select('id, name, symbol, category, current_price, price_change_24h, market_cap, volume_24h').eq('status', 'active').eq('trading_enabled', true).order('display_order')
      .then(({ data }) => setAllAssets((data || []) as MarketAsset[]));
  }, []);

  let assets = allAssets;
  if (search) assets = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase()));
  if (category === 'gainers') assets = [...assets].sort((a, b) => b.price_change_24h - a.price_change_24h);
  else if (category === 'losers') assets = [...assets].sort((a, b) => a.price_change_24h - b.price_change_24h);
  else if (category !== 'all') assets = assets.filter(a => a.category === category);

  return (
    <div className="dark:bg-surface-950">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-surface-900 dark:text-white">Markets</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Browse and trade supported digital assets.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Search value={search} onChange={setSearch} placeholder="Search assets..." className="w-full sm:max-w-xs" />
      </div>

      <div className="mb-6">
        <Tabs tabs={categories} active={category} onChange={setCategory} />
      </div>

      <Card padding={false} className="overflow-hidden">
        {assets.length === 0 ? (
          <EmptyState title="No assets found" description="Try adjusting your search or filter criteria." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left w-10"></th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Asset</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Price</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">24h</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left hidden md:table-cell">Category</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right hidden lg:table-cell">Market Cap</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {assets.map(a => {
                  return (
                    <tr key={a.symbol} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                      <td className="px-4 py-3">
                        <button onClick={() => setFavorites(prev => { const n = new Set(prev); n.has(a.symbol) ? n.delete(a.symbol) : n.add(a.symbol); return n; })} className="text-surface-300 dark:text-surface-600 hover:text-pending">
                          <Star className={classNames('w-4 h-4', favorites.has(a.symbol) && 'fill-pending text-pending')} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/app/assets/${a.symbol}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold">{a.symbol.slice(0, 2)}</div>
                          <div><p className="text-sm font-semibold text-surface-900 dark:text-white">{a.symbol}</p><p className="text-xs text-surface-500 dark:text-surface-400">{a.name}</p></div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold num text-surface-900 dark:text-white">{formatPrice(a.current_price)}</td>
                      <td className={classNames('px-4 py-3 text-right text-sm num font-medium', a.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>{formatPercent(a.price_change_24h)}</td>
                      <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400 capitalize hidden md:table-cell">{a.category}</td>
                      <td className="px-4 py-3 text-right text-sm num text-surface-700 dark:text-surface-300 hidden lg:table-cell">{formatCompact(a.market_cap)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/app/trade?pair=${a.symbol}USDT`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Trade <ArrowUpRight className="w-3.5 h-3.5" /></Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
