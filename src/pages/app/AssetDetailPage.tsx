import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from 'lucide-react';
import { Card, PageHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatPrice, formatPercent, formatCompact } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface AssetRow {
  id: string; name: string; symbol: string; network: string; min_deposit: number; min_withdrawal: number; withdrawal_fee: number;
  current_price: number; price_change_24h: number; high_24h: number; low_24h: number; volume_24h: number; market_cap: number; category: string;
}

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { session } = useAuth();
  const [asset, setAsset] = useState<AssetRow | null>(null);
  const [available, setAvailable] = useState(0);
  const [invested, setInvested] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAsset = async () => {
      if (!symbol) return;
      setLoading(true);
      const { data } = await supabase.from('assets').select('id, name, symbol, network, min_deposit, min_withdrawal, withdrawal_fee, current_price, price_change_24h, high_24h, low_24h, volume_24h, market_cap, category').eq('symbol', symbol).maybeSingle();
      setAsset(data as AssetRow | null);

      if (data && session?.user?.id) {
        const { data: balance } = await supabase.from('balances').select('available, invested').eq('user_id', session.user.id).eq('asset_id', data.id).maybeSingle();
        setAvailable(Number(balance?.available || 0));
        setInvested(Number(balance?.invested || 0));
      } else {
        setAvailable(0);
        setInvested(0);
      }
      setLoading(false);
    };

    loadAsset();
  }, [symbol, session?.user?.id]);

  if (!asset) {
    if (loading) return <div className="py-20 text-center text-sm text-surface-500">Loading asset...</div>;
    return (
      <div className="text-center py-20">
        <p className="text-surface-500 dark:text-surface-400">Asset not found.</p>
        <Link to="/app/assets" className="text-brand-700 dark:text-brand-400 hover:text-brand-800 text-sm mt-2 inline-block">Back to Assets</Link>
      </div>
    );
  }

  const userHolding = available + invested;
  const holdingValue = userHolding * asset.current_price;

  return (
    <div className="dark:bg-surface-950">
      <PageHeader
        title={`${asset.name} (${asset.symbol})`}
        subtitle={formatPrice(asset.current_price)}
        actions={
          <div className="flex gap-2">
            <Link to={`/app/deposit?asset=${asset.symbol}`}><Button variant="outline" size="sm" icon={<ArrowDownToLine className="w-4 h-4" />}>Deposit</Button></Link>
            <Link to={`/app/withdraw?asset=${asset.symbol}`}><Button variant="outline" size="sm" icon={<ArrowUpFromLine className="w-4 h-4" />}>Withdraw</Button></Link>
            <Link to={`/app/trade?pair=${asset.symbol}USDT`}><Button size="sm" icon={<TrendingUp className="w-4 h-4" />}>Trade</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="24h Change" value={formatPercent(asset.price_change_24h)} change={asset.price_change_24h} />
        <StatCard label="24h High" value={formatPrice(asset.high_24h)} />
        <StatCard label="24h Low" value={formatPrice(asset.low_24h)} />
        <StatCard label="24h Volume" value={formatCompact(asset.volume_24h)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-h-56 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">Price History</h3>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Historical price records are not available in the configured database.</p>
        </Card>

        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Market Data</h3>
            <div className="space-y-2.5">
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Market Cap</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{formatCompact(asset.market_cap)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">24h Volume</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{formatCompact(asset.volume_24h)}</span></div>
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Category</span><span className="text-sm font-medium text-surface-900 dark:text-white capitalize">{asset.category}</span></div>
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Network</span><span className="text-sm font-medium text-surface-900 dark:text-white">{asset.network}</span></div>
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Min Deposit</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{asset.min_deposit} {asset.symbol}</span></div>
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Min Withdrawal</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{asset.min_withdrawal} {asset.symbol}</span></div>
              <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Withdrawal Fee</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{asset.withdrawal_fee} {asset.symbol}</span></div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Your Holdings</h3>
            {userHolding > 0 ? (
              <div className="space-y-2.5">
                <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Available</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{available.toFixed(8)} {asset.symbol}</span></div>
                <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Invested</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{invested.toFixed(8)} {asset.symbol}</span></div>
                <div className="flex justify-between"><span className="text-sm text-surface-500 dark:text-surface-400">Value (USD)</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{formatPrice(holdingValue)}</span></div>
                <div className="flex gap-2 pt-2">
                  <Link to={`/app/trade?pair=${asset.symbol}USDT`} className="flex-1"><Button size="sm" variant="success" className="w-full">Buy</Button></Link>
                  <Link to={`/app/trade?pair=${asset.symbol}USDT`} className="flex-1"><Button size="sm" variant="danger" className="w-full">Sell</Button></Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-surface-500 dark:text-surface-400">You don't hold any {asset.symbol}.</p>
                <Link to={`/app/deposit?asset=${asset.symbol}`} className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800 mt-2 inline-block">Deposit {asset.symbol}</Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
