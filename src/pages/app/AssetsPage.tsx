import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Search as SearchInput } from '@/components/ui/Dropdown';
import { formatPrice, formatPercent, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface AssetRow {
  id: string; name: string; symbol: string; status: string; deposit_enabled: boolean; trading_enabled: boolean;
  current_price: number; price_change_24h: number; market_cap: number; volume_24h: number;
}

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [allAssets, setAllAssets] = useState<AssetRow[]>([]);

  useEffect(() => {
    supabase.from('assets').select('id, name, symbol, status, deposit_enabled, trading_enabled, current_price, price_change_24h, market_cap, volume_24h').order('display_order')
      .then(({ data }) => setAllAssets((data || []) as AssetRow[]));
  }, []);

  const assets = allAssets.filter(asset => !search || asset.name.toLowerCase().includes(search.toLowerCase()) || asset.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Assets" subtitle="Browse all supported digital assets on the platform." />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search assets..." className="max-w-xs" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(a => {
          return (
            <Link key={a.symbol} to={`/app/assets/${a.symbol}`}>
              <Card className="hover:shadow-card-hover transition-shadow cursor-pointer h-full">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 flex items-center justify-center text-sm font-bold">{a.symbol.slice(0, 2)}</div>
                    <div><p className="text-sm font-semibold text-surface-900 dark:text-white">{a.symbol}</p><p className="text-xs text-surface-500 dark:text-surface-400">{a.name}</p></div>
                  </div>
                  <span className={classNames('text-sm font-medium num', a.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>{formatPercent(a.price_change_24h)}</span>
                </div>
                <p className="text-2xl font-bold num text-surface-900 dark:text-white mb-2">{formatPrice(a.current_price)}</p>
                <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-surface-400 dark:text-surface-500">Status</p><p className="font-medium text-surface-700 dark:text-surface-300 capitalize">{a.status}</p></div>
                  <div><p className="text-surface-400 dark:text-surface-500">Deposit</p><p className={classNames('font-medium', a.deposit_enabled ? 'text-positive' : 'text-surface-400 dark:text-surface-500')}>{a.deposit_enabled ? 'Enabled' : 'Disabled'}</p></div>
                  <div><p className="text-surface-400 dark:text-surface-500">Trading</p><p className={classNames('font-medium', a.trading_enabled ? 'text-positive' : 'text-surface-400 dark:text-surface-500')}>{a.trading_enabled ? 'Enabled' : 'Disabled'}</p></div>
                </div>
                <p className="mt-2 text-xs text-surface-500 dark:text-surface-400">Market cap {a.market_cap ? formatPrice(a.market_cap) : '—'} · 24h volume {a.volume_24h ? formatPrice(a.volume_24h) : '—'}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {assets.length === 0 && <Card><EmptyState icon={<Coins className="w-8 h-8" />} title="No assets found" description="Try adjusting your search." /></Card>}
    </div>
  );
}
