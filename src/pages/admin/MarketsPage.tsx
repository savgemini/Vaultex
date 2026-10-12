import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { formatPrice, formatPercent, formatCompact, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface AssetRow {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  status: string;
  category: string;
}

export default function AdminMarketsPage() {
  const [assets, setAssets] = useState<AssetRow[]>([]);

  const loadMarkets = useCallback(async () => {
    const { data, error } = await supabase.from('assets').select('*').order('display_order', { ascending: true });
    if (error) return;
    setAssets((data as AssetRow[]) || []);
  }, []);

  useEffect(() => { loadMarkets(); }, [loadMarkets]);

  return (
    <div>
      <PageHeader title="Markets" subtitle="Platform market overview and asset prices" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Market Cap', value: formatCompact(assets.reduce((s, a) => s + Number(a.market_cap || 0), 0)) },
          { label: '24h Volume', value: formatCompact(assets.reduce((s, a) => s + Number(a.volume_24h || 0), 0)) },
          { label: 'Active Assets', value: assets.length.toString() },
          { label: 'Trading Pairs', value: '12' },
        ].map(s => (
          <Card key={s.label}><p className="text-xs text-surface-500 uppercase tracking-wide">{s.label}</p><p className="text-2xl font-bold num text-surface-900 mt-1">{s.value}</p></Card>
        ))}
      </div>

      <Table
        columns={[
          { key: 'symbol', header: 'Asset', render: (a) => <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{a.symbol.slice(0, 2)}</div><div><p className="text-sm font-semibold text-surface-900">{a.symbol}</p><p className="text-xs text-surface-500">{a.name}</p></div></div> },
          { key: 'price', header: 'Price', align: 'right', render: (a) => <span className="text-sm num text-surface-900">{formatPrice(a.current_price)}</span> },
          { key: 'change', header: '24h Change', align: 'right', render: (a) => <span className={classNames('text-sm num font-medium', a.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>{formatPercent(a.price_change_24h)}</span> },
          { key: 'marketCap', header: 'Market Cap', align: 'right', render: (a) => <span className="text-sm num text-surface-700 hidden md:table-cell">{formatCompact(a.market_cap)}</span> },
          { key: 'volume', header: '24h Volume', align: 'right', render: (a) => <span className="text-sm num text-surface-700 hidden lg:table-cell">{formatCompact(a.volume_24h)}</span> },
          { key: 'category', header: 'Category', align: 'center', render: (a) => <span className="text-xs text-surface-600 capitalize">{a.category}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (a) => <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.status === 'active' ? 'bg-positive-light text-positive-dark' : 'bg-surface-100 text-surface-600'}`}>{a.status}</span> },
        ]}
        data={assets}
        rowKey={(a) => a.id}
        emptyState={<EmptyState title="No assets" description="No assets configured." />}
      />
    </div>
  );
}
