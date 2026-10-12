import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowUpFromLine, Check, Shield, Info } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { generateReference, classNames } from '@/lib/format';
import type { Transaction } from '@/types';
import { useAccountRestrictions } from '@/hooks/useAccountRestrictions';

interface WithdrawalAsset {
  id: string; name: string; symbol: string; network: string; min_withdrawal: number; withdrawal_fee: number; withdrawal_enabled: boolean;
}

export default function WithdrawPage() {
  const [params] = useSearchParams();
  const { session, profile } = useAuth();
  const { toast } = useToast();
  const { hasRestriction, loading: restrictionsLoading, error: restrictionsError } = useAccountRestrictions();
  const [selectedAsset, setSelectedAsset] = useState(params.get('asset') || 'BTC');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<WithdrawalAsset[]>([]);
  const [balances, setBalances] = useState<Array<{ asset_id: string; available: number }>>([]);
  const [assetsLoading, setAssetsLoading] = useState(true);

  const asset = assets.find(a => a.symbol === selectedAsset);
  const fee = Number(asset?.withdrawal_fee || 0);
  const receiveAmount = Number(amount) - fee;
  const availableBalance = Number(balances.find(balance => balance.asset_id === asset?.id)?.available || 0);

  useEffect(() => {
    const loadAssetsAndBalances = async () => {
      const assetQuery = supabase.from('assets').select('id, name, symbol, network, min_withdrawal, withdrawal_fee, withdrawal_enabled').eq('status', 'active').eq('withdrawal_enabled', true).order('display_order');
      const balanceQuery = session?.user?.id
        ? supabase.from('balances').select('asset_id, available').eq('user_id', session.user.id)
        : Promise.resolve({ data: [], error: null });
      const [assetResult, balanceResult] = await Promise.all([assetQuery, balanceQuery]);
      const rows = (assetResult.data || []) as WithdrawalAsset[];
      setAssets(rows);
      setBalances((balanceResult.data || []) as Array<{ asset_id: string; available: number }>);
      setSelectedAsset(current => rows.some(row => row.symbol === current) ? current : rows[0]?.symbol || '');
      setAssetsLoading(false);
    };

    loadAssetsAndBalances();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).eq('type', 'withdrawal').order('created_at', { ascending: false }).limit(5);
      setHistory((data as Transaction[]) || []);
      setLoading(false);
    })();
  }, [session]);

  const handleSubmit = async () => {
    if (!session) return;
    if (restrictionsLoading || restrictionsError) { toast('Unable to verify account restrictions. Please try again.', 'error'); return; }
    if (hasRestriction('disable_withdrawals')) { toast('Withdrawals are disabled for this account.', 'error'); return; }
    if (!asset) { toast('No active withdrawal asset is configured.', 'error'); return; }
    if (!address) { toast('Please enter a destination address.', 'error'); return; }
    if (!amount || Number(amount) <= 0) { toast('Please enter a valid amount.', 'error'); return; }
    if (Number(amount) < asset.min_withdrawal) { toast(`Minimum withdrawal is ${asset.min_withdrawal} ${asset.symbol}.`, 'error'); return; }
    if (Number(amount) > availableBalance) { toast('Insufficient balance.', 'error'); return; }
    if (profile?.account_status === 'restricted' || profile?.account_status === 'suspended') { toast('Account restricted. Withdrawals are currently disabled.', 'error'); return; }
    setConfirmOpen(true);
  };

  const confirmWithdrawal = async () => {
    if (!session || !asset) return;
    const ref = generateReference('WDR');
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id, type: 'withdrawal', asset_id: asset.id, asset_symbol: selectedAsset,
      amount: Number(amount), fee, status: 'pending', reference: ref,
      details: { address, memo: memo || null, network: asset.network },
    });
    if (error) { toast('Failed to submit withdrawal request.', 'error'); return; }
    setConfirmOpen(false);
    setSuccessOpen(true);
  };

  if (assetsLoading || !asset) {
    return (
      <div className="dark:bg-surface-950">
        <PageHeader title="Withdraw" subtitle="Withdraw funds to an external wallet or account." />
        <Card><p className="text-sm text-surface-500">{assetsLoading ? 'Loading configured withdrawal assets...' : 'No active withdrawal assets are configured.'}</p></Card>
      </div>
    );
  }

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Withdraw" subtitle="Withdraw funds to an external wallet or account." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Withdrawal Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Asset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {assets.map(a => (
                  <button key={a.symbol} onClick={() => { setSelectedAsset(a.symbol); setAmount(''); }} className={classNames('flex items-center gap-2 p-3 border rounded transition-colors', selectedAsset === a.symbol ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800')}>
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold">{a.symbol.slice(0, 2)}</div>
                    <div className="text-left"><p className="text-sm font-medium text-surface-900 dark:text-white">{a.symbol}</p></div>
                  </button>
                ))}
              </div>
            </div>
            <Input label="Destination Address" value={address} onChange={e => setAddress(e.target.value)} placeholder={`Enter ${asset.symbol} address (${asset.network})`} />
            <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} suffix={asset.symbol} placeholder={`Min ${asset.min_withdrawal}`} />
            <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded text-sm">
              <span className="text-surface-500 dark:text-surface-400">Available Balance</span>
              <span className="font-medium num text-surface-900 dark:text-white">{availableBalance} {asset.symbol}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded text-sm">
              <span className="text-surface-500 dark:text-surface-400">Withdrawal Fee</span>
              <span className="font-medium num text-surface-900 dark:text-white">{fee} {asset.symbol}</span>
            </div>
            <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded text-sm">
              <span className="text-surface-500 dark:text-surface-400">You'll Receive</span>
              <span className="font-semibold num text-surface-900 dark:text-white">{receiveAmount > 0 ? receiveAmount.toFixed(8) : '0'} {asset.symbol}</span>
            </div>
            <Input label="Memo / Tag (Optional)" value={memo} onChange={e => setMemo(e.target.value)} placeholder="Required for certain assets" />
            <div className="flex items-start gap-2 p-3 bg-info-light/50 rounded">
              <Shield className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-surface-600 dark:text-surface-400">Withdrawals undergo a security review. Processing time: 5-30 minutes for crypto, 1-3 business days for bank transfers.</p>
            </div>
            <Button className="w-full" icon={<ArrowUpFromLine className="w-4 h-4" />} onClick={handleSubmit}>Continue to Confirmation</Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmWithdrawal}
        title="Confirm Withdrawal"
        message={`Withdraw ${amount} ${asset.symbol} to ${address.slice(0, 12)}...? Fee: ${fee} ${asset.symbol}. You'll receive ${receiveAmount.toFixed(8)} ${asset.symbol}.`}
        confirmLabel="Confirm Withdrawal"
        variant="danger"
      />

      <Modal open={successOpen} onClose={() => { setSuccessOpen(false); setAmount(''); setAddress(''); setMemo(''); }} title="Withdrawal Submitted">
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-positive-light rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-positive" /></div>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Your withdrawal request has been submitted and is pending security review. You'll receive a notification when processing is complete.</p>
          <Button onClick={() => { setSuccessOpen(false); setAmount(''); setAddress(''); setMemo(''); }}>Done</Button>
        </div>
      </Modal>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Recent Withdrawals</h3>
        <Card padding={false} className="overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-10 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />)}</div>
          ) : history.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-sm text-surface-500 dark:text-surface-400">No withdrawal history yet.</p></div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead><tr className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-800">
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Date</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Asset</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Amount</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Fee</th>
                  <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {history.map(t => (
                    <tr key={t.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                      <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400">{new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                      <td className="px-4 py-3 text-sm font-medium text-surface-900 dark:text-white">{t.asset_symbol}</td>
                      <td className="px-4 py-3 text-right text-sm num text-surface-900 dark:text-white">{Number(t.amount).toFixed(4)}</td>
                      <td className="px-4 py-3 text-right text-sm num text-surface-500 dark:text-surface-400">{Number(t.fee).toFixed(4)}</td>
                      <td className="px-4 py-3 text-right"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
