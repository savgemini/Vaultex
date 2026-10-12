import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowDownToLine, Check, Copy, Info } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { generateReference, classNames } from '@/lib/format';
import type { Transaction } from '@/types';
import { useAccountRestrictions } from '@/hooks/useAccountRestrictions';

interface DepositAsset {
  id: string; name: string; symbol: string; network: string; min_deposit: number; deposit_enabled: boolean;
}

export default function DepositPage() {
  const [params] = useSearchParams();
  const { session } = useAuth();
  const { toast } = useToast();
  const { hasRestriction, loading: restrictionsLoading, error: restrictionsError } = useAccountRestrictions();
  const [selectedAsset, setSelectedAsset] = useState(params.get('asset') || 'BTC');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'select' | 'instructions' | 'submitted'>('select');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAddress, setDepositAddress] = useState('');
  const [assetId, setAssetId] = useState<string | null>(null);
  const [assets, setAssets] = useState<DepositAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

  const asset = assets.find(a => a.symbol === selectedAsset);

  useEffect(() => {
    supabase.from('assets').select('id, name, symbol, network, min_deposit, deposit_enabled').eq('status', 'active').eq('deposit_enabled', true).order('display_order')
      .then(({ data }) => {
        const rows = (data || []) as DepositAsset[];
        setAssets(rows);
        setSelectedAsset(current => rows.some(row => row.symbol === current) ? current : rows[0]?.symbol || '');
        setAssetsLoading(false);
      });
  }, []);

  useEffect(() => {
    (async () => {
      const { data: settings } = await supabase.from('site_settings').select('deposit_btc_address, deposit_eth_address, deposit_usdt_address, deposit_usdc_address').maybeSingle();
      const assetRow = assets.find(item => item.symbol === selectedAsset);
      setAssetId(assetRow?.id || null);

      if (settings) {
        const key = `deposit_${selectedAsset.toLowerCase()}_address` as keyof typeof settings;
        setDepositAddress(settings[key] || '');
      }
    })();
  }, [selectedAsset, assets]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).eq('type', 'deposit').order('created_at', { ascending: false }).limit(5);
      setHistory((data as Transaction[]) || []);
      setLoading(false);
    })();
  }, [session]);

  const handleSubmit = async () => {
    if (!session?.user?.id) return;
    if (restrictionsLoading || restrictionsError) { toast('Unable to verify account restrictions. Please try again.', 'error'); return; }
    if (hasRestriction('disable_deposits')) { toast('Deposits are disabled for this account.', 'error'); return; }
    if (!asset || !assetId || Number(amount) < Number(asset.min_deposit)) { toast('Select an available asset and enter its minimum deposit amount.', 'error'); return; }
    const ref = generateReference('DEP');
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id,
      type: 'deposit',
      asset_id: assetId,
      asset_symbol: selectedAsset,
      amount: Number(amount) || 0,
      fee: 0,
      status: 'pending',
      reference: ref,
      details: { method: 'crypto', address: depositAddress },
    });
    if (error) { toast('Failed to submit deposit request.', 'error'); return; }
    setStep('submitted');
    toast('Deposit request submitted. Awaiting network confirmation.', 'success');
  };

  const copyAddress = () => { navigator.clipboard.writeText(depositAddress); toast('Address copied to clipboard.', 'success'); };

  if (assetsLoading || !asset) {
    return (
      <div className="dark:bg-surface-950">
        <PageHeader title="Deposit" subtitle="Add funds to your account." />
        <Card><p className="text-sm text-surface-500">{assetsLoading ? 'Loading configured deposit assets...' : 'No active deposit assets are configured.'}</p></Card>
      </div>
    );
  }

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Deposit" subtitle="Add funds to your account." />

      {step === 'select' && (
        <div className="max-w-2xl space-y-6">
          <Card className="dark:bg-surface-900 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Select Asset</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {assets.map(a => (
                <button key={a.symbol} onClick={() => setSelectedAsset(a.symbol)} className={classNames('flex items-center gap-2 p-3 border rounded transition-colors', selectedAsset === a.symbol ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800')}>
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold">{a.symbol.slice(0, 2)}</div>
                  <div className="text-left"><p className="text-sm font-medium text-surface-900 dark:text-white">{a.symbol}</p><p className="text-xs text-surface-500 dark:text-surface-400">{a.name}</p></div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="dark:bg-surface-900 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Deposit Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <span className="text-sm text-surface-500 dark:text-surface-400">Asset</span>
                <span className="text-sm font-medium text-surface-900 dark:text-white">{asset.name} ({asset.symbol})</span>
              </div>
              <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <span className="text-sm text-surface-500 dark:text-surface-400">Network</span>
                <span className="text-sm font-medium text-surface-900 dark:text-white">{asset.network}</span>
              </div>
              <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <span className="text-sm text-surface-500 dark:text-surface-400">Minimum Deposit</span>
                <span className="text-sm font-medium num text-surface-900 dark:text-white">{asset.min_deposit} {asset.symbol}</span>
              </div>
              <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded">
                <span className="text-sm text-surface-500 dark:text-surface-400">Deposit Fee</span>
                <span className="text-sm font-medium text-positive">Free</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Amount ({asset.symbol})</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`Min ${asset.min_deposit}`} className="w-full h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
              </div>
              <Button className="w-full" icon={<ArrowDownToLine className="w-4 h-4" />} onClick={() => {
                if (restrictionsLoading || restrictionsError) { toast('Unable to verify account restrictions. Please try again.', 'error'); return; }
                if (hasRestriction('disable_deposits')) { toast('Deposits are disabled for this account.', 'error'); return; }
                setStep('instructions');
              }} disabled={!amount || Number(amount) < asset.min_deposit || restrictionsLoading || restrictionsError || hasRestriction('disable_deposits')}>Continue</Button>
            </div>
          </Card>
        </div>
      )}

      {step === 'instructions' && (
        <div className="max-w-2xl space-y-6">
          <Card className="dark:bg-surface-900 dark:border-surface-800">
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Deposit Instructions</h3>
            <div className="space-y-4">
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Deposit Address ({asset.network})</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-surface-900 dark:text-white break-all flex-1">{depositAddress}</code>
                  <button onClick={copyAddress} className="shrink-0 p-2 text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded"><Copy className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <p className="text-xs text-surface-500 dark:text-surface-400 mb-1">Amount</p>
                <p className="text-lg font-bold num text-surface-900 dark:text-white">{amount} {asset.symbol}</p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-warning-light/50 dark:bg-warning/10 rounded">
                <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div className="text-xs text-surface-600 dark:text-surface-400 space-y-1">
                  <p>Send only {asset.symbol} ({asset.network}) to this address. Sending other assets may result in permanent loss.</p>
                  <p>Funds will be credited after 3 network confirmations (approximately 10-30 minutes).</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('select')}>Back</Button>
                <Button className="flex-1" onClick={handleSubmit}>I've Made the Transfer</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 'submitted' && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 bg-positive-light dark:bg-positive/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-positive" />
          </div>
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Deposit Submitted</h2>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">Your deposit of {amount} {asset.symbol} is pending confirmation. You'll receive a notification once it's credited to your account.</p>
          <div className="flex gap-2 justify-center">
            <Link to="/app"><Button variant="outline">Back to Dashboard</Button></Link>
            <Button onClick={() => { setStep('select'); setAmount(''); }}>New Deposit</Button>
          </div>
        </div>
      )}

      {step === 'select' && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Recent Deposits</h3>
          <Card padding={false} className="overflow-hidden dark:bg-surface-900 dark:border-surface-800">
            {loading ? (
              <div className="p-5 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />)}</div>
            ) : history.length === 0 ? (
              <div className="px-5 py-8 text-center"><p className="text-sm text-surface-500 dark:text-surface-400">No deposit history yet.</p></div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full">
                  <thead><tr className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-800">
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Date</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Asset</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Amount</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                    {history.map(t => (
                      <tr key={t.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                        <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                        <td className="px-4 py-3 text-sm font-medium text-surface-900 dark:text-white">{t.asset_symbol}</td>
                        <td className="px-4 py-3 text-right text-sm num text-surface-900 dark:text-white">{Number(t.amount).toFixed(4)}</td>
                        <td className="px-4 py-3 text-right"><StatusBadge status={t.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
