import { useState, useEffect, useCallback } from 'react';
import { Card, Tabs } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice, formatPercent, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAccountRestrictions } from '@/hooks/useAccountRestrictions';

interface OrderRow {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  order_type: string;
  price: number;
  amount: number;
  filled_amount: number;
  total: number;
  fee: number;
  status: string;
  asset_symbol: string;
  reference: string;
  created_at: string;
}

interface TradeAsset {
  id: string; symbol: string; name: string; current_price: number; price_change_24h: number;
  high_24h: number; low_24h: number; volume_24h: number; trading_enabled: boolean;
}

interface TradeTransaction {
  id: string; type: 'buy' | 'sell'; asset_symbol: string; amount: number; fee: number; status: string; reference: string; created_at: string;
}

export default function TradePage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { hasRestriction, loading: restrictionsLoading, error: restrictionsError } = useAccountRestrictions();
  const [selectedAsset, setSelectedAsset] = useState('BTC');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('limit');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [assetBalance, setAssetBalance] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderRow[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeTransaction[]>([]);
  const [historyTab, setHistoryTab] = useState('open');
  const [assetIdMap, setAssetIdMap] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<TradeAsset[]>([]);
  const [tradingFeePct, setTradingFeePct] = useState(0.1);

  const asset = assets.find(item => item.symbol === selectedAsset);

  const computedTotal = !asset ? '0.00' : orderType === 'market'
    ? (Number(amount) * asset.current_price).toFixed(2)
    : (Number(price) * Number(amount)).toFixed(2);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: settings }] = await Promise.all([
        supabase.from('assets').select('id, name, symbol, current_price, price_change_24h, high_24h, low_24h, volume_24h, trading_enabled').eq('status', 'active').eq('trading_enabled', true).order('display_order'),
        supabase.from('site_settings').select('trading_fee_pct').maybeSingle(),
      ]);
      const map: Record<string, string> = {};
      (data || []).forEach(a => { map[a.symbol] = a.id; });
      const rows = (data || []) as TradeAsset[];
      setAssets(rows);
      setSelectedAsset(current => rows.some(row => row.symbol === current) ? current : rows[0]?.symbol || '');
      setAssetIdMap(map);
      if (settings) setTradingFeePct(Number(settings.trading_fee_pct));
    })();
  }, []);

  const loadBalances = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase.from('balances').select('asset_id, available').eq('user_id', session.user.id);
    if (!data) return;
    const usdtId = assetIdMap['USDT'];
    const assetId = assetIdMap[selectedAsset];
    const usdt = data.find(b => b.asset_id === usdtId);
    const ast = data.find(b => b.asset_id === assetId);
    setUsdtBalance(usdt ? Number(usdt.available) : 0);
    setAssetBalance(ast ? Number(ast.available) : 0);
  }, [session?.user?.id, selectedAsset, assetIdMap]);

  const loadOrders = useCallback(async () => {
    if (!session?.user?.id) return;
    const { data: open } = await supabase.from('orders').select('*').eq('user_id', session.user.id).in('status', ['open', 'pending', 'partially_filled']).order('created_at', { ascending: false }).limit(20);
    setOrders((open as OrderRow[]) || []);
    const { data: hist } = await supabase.from('orders').select('*').eq('user_id', session.user.id).in('status', ['filled', 'cancelled', 'rejected', 'expired']).order('created_at', { ascending: false }).limit(20);
    setOrderHistory((hist as OrderRow[]) || []);
    const { data: trd } = await supabase.from('transactions').select('id, type, asset_symbol, amount, fee, status, reference, created_at').eq('user_id', session.user.id).in('type', ['buy', 'sell']).order('created_at', { ascending: false }).limit(20);
    setTradeHistory((trd || []) as TradeTransaction[]);
  }, [session?.user?.id]);

  useEffect(() => {
    if (Object.keys(assetIdMap).length > 0) {
      loadBalances();
      loadOrders();
    }
  }, [loadBalances, loadOrders, assetIdMap]);

  const handleTrade = async () => {
    if (!session?.user?.id) { toast('Please sign in to trade.', 'error'); return; }
    if (restrictionsLoading || restrictionsError) { toast('Unable to verify account restrictions. Please try again.', 'error'); return; }
    if (hasRestriction('disable_trading')) { toast('Trading is disabled for this account.', 'error'); return; }
    if (!asset) { toast('No active trading asset is configured.', 'error'); return; }
    const tradeAmount = Number(amount);
    if (!tradeAmount || tradeAmount <= 0) { toast('Enter a valid amount.', 'error'); return; }
    const tradePrice = orderType === 'market' ? asset.current_price : Number(price);
    if (orderType !== 'market' && (!tradePrice || tradePrice <= 0)) { toast('Enter a valid price.', 'error'); return; }
    const tradeTotal = tradeAmount * tradePrice;
    const fee = tradeTotal * (tradingFeePct / 100);

    if (side === 'buy' && tradeTotal + fee > usdtBalance) { toast('Insufficient USDT balance.', 'error'); return; }
    if (side === 'sell' && tradeAmount > assetBalance) { toast(`Insufficient ${asset.symbol} balance.`, 'error'); return; }

    setSubmitting(true);
    const ref = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const usdtId = assetIdMap['USDT'];
    const targetAssetId = assetIdMap[selectedAsset];
    if (!targetAssetId || !usdtId) { toast('Asset lookup failed. Please refresh.', 'error'); setSubmitting(false); return; }

    const orderStatus = orderType === 'market' ? 'filled' : 'open';

    const { error: orderError } = await supabase.from('orders').insert({
      user_id: session.user.id, pair: `${selectedAsset}/USDT`, side, order_type: orderType,
      price: tradePrice, amount: tradeAmount, filled_amount: orderType === 'market' ? tradeAmount : 0,
      total: tradeTotal, fee, status: orderStatus, asset_symbol: selectedAsset, reference: ref,
    });
    if (orderError) { toast('Failed to place order: ' + orderError.message, 'error'); setSubmitting(false); return; }

    if (orderType === 'market') {
      await supabase.from('transactions').insert({
        user_id: session.user.id, type: side, asset_id: targetAssetId, asset_symbol: selectedAsset,
        amount: tradeAmount, fee, status: 'completed', reference: ref,
      });

      if (side === 'buy') {
        await supabase.from('balances').update({ available: usdtBalance - tradeTotal - fee }).eq('user_id', session.user.id).eq('asset_id', usdtId);
        const { data: existing } = await supabase.from('balances').select('*').eq('user_id', session.user.id).eq('asset_id', targetAssetId).maybeSingle();
        if (existing) {
          await supabase.from('balances').update({ available: Number(existing.available) + tradeAmount }).eq('user_id', session.user.id).eq('asset_id', targetAssetId);
        } else {
          await supabase.from('balances').insert({ user_id: session.user.id, asset_id: targetAssetId, available: tradeAmount });
        }
      } else {
        await supabase.from('balances').update({ available: assetBalance - tradeAmount }).eq('user_id', session.user.id).eq('asset_id', targetAssetId);
        const { data: existing } = await supabase.from('balances').select('*').eq('user_id', session.user.id).eq('asset_id', usdtId).maybeSingle();
        if (existing) {
          await supabase.from('balances').update({ available: Number(existing.available) + tradeTotal - fee }).eq('user_id', session.user.id).eq('asset_id', usdtId);
        } else {
          await supabase.from('balances').insert({ user_id: session.user.id, asset_id: usdtId, available: tradeTotal - fee });
        }
      }
      toast(`${side === 'buy' ? 'Bought' : 'Sold'} ${tradeAmount} ${selectedAsset} successfully!`, 'success');
    } else {
      toast(`${side === 'buy' ? 'Buy' : 'Sell'} order placed for ${tradeAmount} ${selectedAsset} at ${tradePrice} USDT.`, 'success');
    }

    setAmount(''); setPrice(''); setSubmitting(false);
    loadBalances(); loadOrders();
  };

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) { toast('Failed to cancel order.', 'error'); } else { toast('Order cancelled.', 'success'); loadOrders(); }
  };

  if (!asset) {
    return <div className="p-6 text-sm text-surface-500">No active trading assets are configured.</div>;
  }

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-surface-900 dark:text-white">Trade</h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Prices and trading settings are loaded from platform data.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Card padding={false} className="overflow-hidden dark:bg-surface-900 dark:border-surface-800">
            <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <select value={selectedAsset} onChange={e => { setSelectedAsset(e.target.value); setPrice(''); setAmount(''); }} className="h-9 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                  {assets.map(a => <option key={a.symbol} value={a.symbol}>{a.symbol}/USDT</option>)}
                </select>
                <div>
                  <p className="text-lg font-bold num text-surface-900 dark:text-white">{formatPrice(asset.current_price)}</p>
                  <p className={classNames('text-xs num font-medium', asset.price_change_24h >= 0 ? 'text-positive' : 'text-negative')}>{formatPercent(asset.price_change_24h)}</p>
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div><p className="text-surface-500 dark:text-surface-400">24h High</p><p className="font-semibold num text-surface-700 dark:text-surface-300">{formatPrice(asset.high_24h)}</p></div>
                <div><p className="text-surface-500 dark:text-surface-400">24h Low</p><p className="font-semibold num text-surface-700 dark:text-surface-300">{formatPrice(asset.low_24h)}</p></div>
                <div className="hidden sm:block"><p className="text-surface-500 dark:text-surface-400">24h Vol</p><p className="font-semibold num text-surface-700 dark:text-surface-300">{(asset.volume_24h / 1e6).toFixed(1)}M</p></div>
              </div>
            </div>
            <div className="h-80 flex items-center justify-center p-6 text-center text-sm text-surface-500 dark:text-surface-400">Historical candle data is not stored in the configured database.</div>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card padding={false} className="overflow-hidden dark:bg-surface-900 dark:border-surface-800">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800"><h3 className="text-sm font-semibold text-surface-900 dark:text-white">Order Book</h3></div>
              <p className="p-6 text-center text-sm text-surface-500 dark:text-surface-400">A live order-book feed is not configured.</p>
            </Card>

            <Card padding={false} className="overflow-hidden dark:bg-surface-900 dark:border-surface-800">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800"><h3 className="text-sm font-semibold text-surface-900 dark:text-white">Your Recent Trades</h3></div>
              <div className="px-3 py-2">
                <div className="grid grid-cols-3 text-xs text-surface-500 dark:text-surface-400 font-medium px-1 pb-1">
                  <span>Side / Asset</span><span className="text-right">Amount</span><span className="text-right">Time</span>
                </div>
                <div className="space-y-0.5 max-h-80 overflow-y-auto scrollbar-thin">
                  {tradeHistory.slice(0, 12).map(trade => (
                    <div key={trade.id} className="grid grid-cols-3 text-xs num px-1 py-0.5">
                      <span className={trade.type === 'buy' ? 'text-positive' : 'text-negative'}>{trade.type.toUpperCase()} {trade.asset_symbol}</span>
                      <span className="text-right text-surface-700 dark:text-surface-300">{Number(trade.amount).toFixed(4)}</span>
                      <span className="text-right text-surface-400 dark:text-surface-500">{new Date(trade.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  {tradeHistory.length === 0 && <p className="py-6 text-center text-sm text-surface-500">No recorded trades.</p>}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div>
          <Card className="dark:bg-surface-900 dark:border-surface-800">
            <div className="flex gap-1 mb-4 p-1 bg-surface-100 dark:bg-surface-800 rounded">
              <button onClick={() => setSide('buy')} className={classNames('flex-1 h-9 rounded text-sm font-medium transition-colors', side === 'buy' ? 'bg-positive text-white' : 'text-surface-600 dark:text-surface-400')}>Buy</button>
              <button onClick={() => setSide('sell')} className={classNames('flex-1 h-9 rounded text-sm font-medium transition-colors', side === 'sell' ? 'bg-negative text-white' : 'text-surface-600 dark:text-surface-400')}>Sell</button>
            </div>
            <div className="flex gap-1 mb-4">
              {(['market', 'limit', 'stop'] as const).map(t => (
                <button key={t} onClick={() => setOrderType(t)} className={classNames('flex-1 h-8 rounded text-xs font-medium capitalize transition-colors', orderType === t ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400 border border-brand-200 dark:border-brand-800' : 'text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700')}>{t}</button>
              ))}
            </div>
            <div className="space-y-3">
              {orderType !== 'market' && <Input label="Price (USDT)" type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder={asset.current_price.toFixed(2)} suffix="USDT" />}
              <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" suffix={asset.symbol} />
              <div className="flex gap-1">
                {['25%', '50%', '75%', '100%'].map(p => (
                  <button key={p} onClick={() => {
                    const maxAmount = side === 'buy' ? usdtBalance / Number(price || asset.current_price) : assetBalance;
                    setAmount((maxAmount * (parseInt(p) / 100)).toFixed(4));
                  }} className="flex-1 h-7 text-xs text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 rounded border border-surface-200 dark:border-surface-700">{p}</button>
                ))}
              </div>
              <div className="px-3 py-2.5 bg-surface-50 dark:bg-surface-800 rounded flex items-center justify-between">
                <span className="text-sm text-surface-500 dark:text-surface-400">Total</span>
                <span className="text-sm font-semibold num text-surface-900 dark:text-white">{computedTotal} USDT</span>
              </div>
              <div className="px-3 py-2 bg-surface-50 dark:bg-surface-800 rounded text-xs text-surface-500 dark:text-surface-400 flex justify-between">
                <span>Available: <span className="font-medium text-surface-700 dark:text-surface-300 num">{side === 'buy' ? usdtBalance.toFixed(2) : assetBalance.toFixed(4)} {side === 'buy' ? 'USDT' : asset.symbol}</span></span>
                <span>Fee: <span className="font-medium text-surface-700 dark:text-surface-300 num">{tradingFeePct}%</span></span>
              </div>
              <Button variant={side === 'buy' ? 'success' : 'danger'} className="w-full" disabled={!amount || submitting} loading={submitting} onClick={handleTrade}>
                {side === 'buy' ? 'Buy' : 'Sell'} {asset.symbol}
              </Button>
            </div>
          </Card>

          <Card className="mt-4 dark:bg-surface-900 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Open Orders</h3>
            {orders.length === 0 ? (
              <div className="text-center py-6"><p className="text-sm text-surface-500 dark:text-surface-400">No open orders.</p></div>
            ) : (
              <div className="space-y-2">
                {orders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-2 bg-surface-50 dark:bg-surface-800 rounded text-xs">
                    <div>
                      <span className={classNames('font-medium', o.side === 'buy' ? 'text-positive' : 'text-negative')}>{o.side.toUpperCase()}</span>
                      <span className="text-surface-700 dark:text-surface-300 ml-1">{o.amount} {o.asset_symbol}</span>
                      <span className="text-surface-500 dark:text-surface-400 ml-2">@ {o.price} USDT</span>
                    </div>
                    <button onClick={() => cancelOrder(o.id)} className="text-negative hover:underline">Cancel</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Tabs tabs={[{ key: 'open', label: 'Open Orders' }, { key: 'history', label: 'Order History' }, { key: 'trades', label: 'Trade History' }]} active={historyTab} onChange={setHistoryTab} />
        <Card className="mt-3 dark:bg-surface-900 dark:border-surface-800">
          {historyTab === 'open' && (orders.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-surface-500 dark:text-surface-400">No orders to display.</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <th className="text-left py-2 px-3">Pair</th><th className="text-left py-2 px-3">Type</th><th className="text-left py-2 px-3">Side</th><th className="text-right py-2 px-3">Price</th><th className="text-right py-2 px-3">Amount</th><th className="text-right py-2 px-3">Filled</th><th className="text-right py-2 px-3">Status</th><th className="text-right py-2 px-3">Action</th>
            </tr></thead><tbody>
              {orders.map(o => (<tr key={o.id} className="border-b border-surface-100 dark:border-surface-800">
                <td className="py-2 px-3 text-surface-900 dark:text-surface-200">{o.pair}</td>
                <td className="py-2 px-3 capitalize text-surface-700 dark:text-surface-300">{o.order_type}</td>
                <td className={classNames('py-2 px-3 font-medium', o.side === 'buy' ? 'text-positive' : 'text-negative')}>{o.side}</td>
                <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{o.price}</td>
                <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{o.amount}</td>
                <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{o.filled_amount}</td>
                <td className="py-2 px-3 text-right text-surface-500 dark:text-surface-400 capitalize">{o.status}</td>
                <td className="py-2 px-3 text-right"><button onClick={() => cancelOrder(o.id)} className="text-negative hover:underline text-xs">Cancel</button></td>
              </tr>))}
            </tbody></table></div>
          ))}
          {historyTab === 'history' && (orderHistory.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-surface-500 dark:text-surface-400">No order history.</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <th className="text-left py-2 px-3">Pair</th><th className="text-left py-2 px-3">Type</th><th className="text-left py-2 px-3">Side</th><th className="text-right py-2 px-3">Price</th><th className="text-right py-2 px-3">Amount</th><th className="text-right py-2 px-3">Total</th><th className="text-right py-2 px-3">Status</th><th className="text-right py-2 px-3">Date</th>
            </tr></thead><tbody>
              {orderHistory.map(o => (<tr key={o.id} className="border-b border-surface-100 dark:border-surface-800">
                <td className="py-2 px-3 text-surface-900 dark:text-surface-200">{o.pair}</td>
                <td className="py-2 px-3 capitalize text-surface-700 dark:text-surface-300">{o.order_type}</td>
                <td className={classNames('py-2 px-3 font-medium', o.side === 'buy' ? 'text-positive' : 'text-negative')}>{o.side}</td>
                <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{o.price}</td>
                <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{o.amount}</td>
                <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{o.total.toFixed(2)}</td>
                <td className="py-2 px-3 text-right text-surface-500 dark:text-surface-400 capitalize">{o.status}</td>
                <td className="py-2 px-3 text-right text-surface-400 dark:text-surface-500 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>))}
            </tbody></table></div>
          ))}
          {historyTab === 'trades' && (tradeHistory.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-surface-500 dark:text-surface-400">No trade history yet.</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs text-surface-500 dark:text-surface-400 border-b border-surface-200 dark:border-surface-800">
              <th className="text-left py-2 px-3">Date</th><th className="text-left py-2 px-3">Type</th><th className="text-left py-2 px-3">Asset</th><th className="text-right py-2 px-3">Amount</th><th className="text-right py-2 px-3">Fee</th><th className="text-right py-2 px-3">Status</th><th className="text-right py-2 px-3">Reference</th>
            </tr></thead><tbody>
              {tradeHistory.map(trade => {
                return (<tr key={trade.id} className="border-b border-surface-100 dark:border-surface-800">
                  <td className="py-2 px-3 text-surface-400 dark:text-surface-500 text-xs">{new Date(trade.created_at).toLocaleDateString()}</td>
                  <td className={classNames('py-2 px-3 font-medium capitalize', trade.type === 'buy' ? 'text-positive' : 'text-negative')}>{trade.type}</td>
                  <td className="py-2 px-3 text-surface-700 dark:text-surface-300">{trade.asset_symbol}</td>
                  <td className="py-2 px-3 text-right num text-surface-700 dark:text-surface-300">{trade.amount}</td>
                  <td className="py-2 px-3 text-right num text-surface-500 dark:text-surface-400">{trade.fee}</td>
                  <td className="py-2 px-3 text-right text-surface-500 dark:text-surface-400 capitalize">{trade.status}</td>
                  <td className="py-2 px-3 text-right text-xs font-mono text-surface-400 dark:text-surface-500">{trade.reference}</td>
                </tr>);
              })}
            </tbody></table></div>
          ))}
        </Card>
      </div>
    </div>
  );
}
