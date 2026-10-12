import { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, Info } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { generateReference, classNames } from '@/lib/format';
import { useAccountRestrictions } from '@/hooks/useAccountRestrictions';

interface TransferAsset {
  id: string;
  symbol: string;
  name: string;
}

interface TransferBalance {
  asset_id: string;
  available: number;
}

export default function TransferPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { hasRestriction, loading: restrictionsLoading, error: restrictionsError } = useAccountRestrictions();
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [assets, setAssets] = useState<TransferAsset[]>([]);
  const [balances, setBalances] = useState<TransferBalance[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [balanceLoadError, setBalanceLoadError] = useState(false);

  useEffect(() => {
    const loadTransferData = async () => {
      if (!session?.user?.id) {
        setLoadingBalances(false);
        setBalanceLoadError(true);
        return;
      }

      const [assetResult, balanceResult] = await Promise.all([
        supabase.from('assets').select('id, symbol, name').eq('status', 'active').order('display_order'),
        supabase.from('balances').select('asset_id, available').eq('user_id', session.user.id),
      ]);

      if (assetResult.error || balanceResult.error) {
        setBalanceLoadError(true);
        setLoadingBalances(false);
        return;
      }

      const loadedAssets = (assetResult.data || []) as TransferAsset[];
      setAssets(loadedAssets);
      setBalances((balanceResult.data || []) as TransferBalance[]);
      setSelectedAsset(current => loadedAssets.some(item => item.symbol === current)
        ? current
        : loadedAssets[0]?.symbol || '');
      setLoadingBalances(false);
    };

    loadTransferData();
  }, [session?.user?.id]);

  const asset = assets.find(item => item.symbol === selectedAsset);
  const fee = 0;
  const selectedBalance = balances.find(balance => balance.asset_id === asset?.id);
  const availableBalance = Number(selectedBalance?.available || 0);

  const handleSubmit = () => {
    if (restrictionsLoading || restrictionsError) { toast('Unable to verify account restrictions. Please try again.', 'error'); return; }
    if (hasRestriction('disable_transfers')) { toast('Transfers are disabled for this account.', 'error'); return; }
    if (loadingBalances || balanceLoadError) { toast('Unable to verify your available balance. Please try again.', 'error'); return; }
    if (!asset) { toast('No transfer asset is available.', 'error'); return; }
    if (!recipient) { toast('Please enter a recipient email or ID.', 'error'); return; }
    if (!amount || Number(amount) <= 0) { toast('Please enter a valid amount.', 'error'); return; }
    if (Number(amount) > availableBalance) { toast('Insufficient balance.', 'error'); return; }
    setConfirmOpen(true);
  };

  const confirmTransfer = async () => {
    if (!session?.user?.id || !asset) return;
    const ref = generateReference('TRF');
    const { error } = await supabase.from('transactions').insert({
      user_id: session.user.id, type: 'transfer', asset_id: asset.id, asset_symbol: selectedAsset,
      amount: Number(amount), fee, status: 'pending', reference: ref,
      details: { recipient, note: note || null },
    });
    if (error) { toast('Failed to submit transfer.', 'error'); return; }
    setConfirmOpen(false);
    setSuccessOpen(true);
  };

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Internal Transfer" subtitle="Transfer supported assets between Vaultex accounts." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Transfer Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Asset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {assets.map(a => (
                  <button key={a.symbol} onClick={() => { setSelectedAsset(a.symbol); setAmount(''); }} className={classNames('flex items-center gap-2 p-3 border rounded transition-colors', selectedAsset === a.symbol ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-surface-200 dark:border-surface-800 hover:bg-surface-50 dark:hover:bg-surface-800')}>
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 flex items-center justify-center text-xs font-bold">{a.symbol.slice(0, 2)}</div>
                    <span className="text-sm font-medium text-surface-900 dark:text-white">{a.symbol}</span>
                  </button>
                ))}
              </div>
            </div>
            <Input label="Recipient (Email or User ID)" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="user@example.com" />
            <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} suffix={asset?.symbol || ''} placeholder="0.00" />
            <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded text-sm">
              <span className="text-surface-500 dark:text-surface-400">Available Balance</span>
              <span className="font-medium num text-surface-900 dark:text-white">
                {loadingBalances ? 'Loading...' : balanceLoadError ? 'Unavailable' : `${availableBalance} ${asset?.symbol || ''}`}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded text-sm">
              <span className="text-surface-500 dark:text-surface-400">Transfer Fee</span>
              <span className="font-medium text-positive">Free</span>
            </div>
            <Input label="Note (Optional)" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the recipient" />
            <div className="flex items-start gap-2 p-3 bg-info-light/50 rounded">
              <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-surface-600 dark:text-surface-400">Internal transfers between Vaultex accounts are processed instantly and free of charge. The recipient must have a verified account.</p>
            </div>
            <Button className="w-full" icon={<ArrowLeftRight className="w-4 h-4" />} onClick={handleSubmit}>Continue to Confirmation</Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmTransfer}
        title="Confirm Transfer"
        message={`Send ${amount} ${asset?.symbol || selectedAsset} to ${recipient}? This action cannot be reversed.`}
        confirmLabel="Confirm Transfer"
      />

      <Modal open={successOpen} onClose={() => { setSuccessOpen(false); setAmount(''); setRecipient(''); setNote(''); }} title="Transfer Submitted">
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-positive-light rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-6 h-6 text-positive" /></div>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">Your transfer of {amount} {asset?.symbol || selectedAsset} to {recipient} has been submitted and is being processed.</p>
          <Button onClick={() => { setSuccessOpen(false); setAmount(''); setRecipient(''); setNote(''); }}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
