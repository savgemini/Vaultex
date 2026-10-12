import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowUpRight } from 'lucide-react';
import { DEMO_ASSETS, generatePriceHistory } from '@/lib/marketData';
import { Sparkline } from '@/components/ui/LineChart';
import { Search } from '@/components/ui/Dropdown';
import { Card, Tabs, EmptyState } from '@/components/ui/Card';
import { formatPrice, formatPercent, formatCompact, classNames } from '@/lib/format';
import type { AssetCategory } from '@/types';

const categories: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'major', label: 'Major' },
  { key: 'stablecoin', label: 'Stablecoins' },
  { key: 'layer1', label: 'Layer 1' },
  { key: 'trending', label: 'Trending' },
  { key: 'gainers', label: 'Gainers' },
  { key: 'losers', label: 'Losers' },
];

export default function MarketsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['BTC', 'ETH']));

  const toggleFav = (sym: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym); else next.add(sym);
      return next;
    });
  };

  let assets = DEMO_ASSETS;
  if (search) assets = assets.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase()));
  if (category === 'gainers') assets = [...assets].sort((a, b) => b.price_change_24h - a.price_change_24h);
  else if (category === 'losers') assets = [...assets].sort((a, b) => a.price_change_24h - b.price_change_24h);
  else if (category === 'trending') assets = [...assets].sort((a, b) => b.volume_24h - a.volume_24h);
  else if (category !== 'all') assets = assets.filter(a => a.category === (category as AssetCategory));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">Markets</h1>
        <p className="text-sm text-surface-500 mt-1">Real-time prices and market data for supported digital assets.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
                <tr className="bg-surface-50 border-b border-surface-200">
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-left w-10"></th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-left">Asset</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-right">Price</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-right">24h</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-right hidden md:table-cell">7d Chart</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-right hidden lg:table-cell">Market Cap</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-right hidden lg:table-cell">24h Volume</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {assets.map(asset => {
                  const sparkData = generatePriceHistory(asset.current_price, 7).map(d => d.price);
                  return (
                    <tr key={asset.symbol} className="hover:bg-surface-50">
                      <td className="px-4 py-3">
                        <button onClick={() => toggleFav(asset.symbol)} className="text-surface-300 hover:text-pending">
                          <Star className={classNames('w-4 h-4', favorites.has(asset.symbol) && 'fill-pending text-pending')} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/app/assets/${asset.symbol}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                            {asset.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-surface-900">{asset.symbol}</p>
                            <p className="text-xs text-surface-500">{asset.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-surface-900 num">{formatPrice(asset.current_price)}</td>
                      <td className={classNames('px-4 py-3 text-right text-sm font-medium num', asset.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>
                        {formatPercent(asset.price_change_24h)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="w-24 ml-auto"><Sparkline data={sparkData} height={32} color={asset.price_change_24h >= 0 ? '#16A34A' : '#DC2626'} /></div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-surface-700 num hidden lg:table-cell">{formatCompact(asset.market_cap)}</td>
                      <td className="px-4 py-3 text-right text-sm text-surface-700 num hidden lg:table-cell">{formatCompact(asset.volume_24h)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/app/assets/${asset.symbol}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
                          Trade <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-6 text-xs text-surface-400">
        Market data shown is for demonstration purposes only and does not reflect real-time market prices.
      </p>
    </div>
  );
}
