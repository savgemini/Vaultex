import { useState, useEffect } from 'react';
import { CheckCircle2, Wallet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { classNames } from '@/lib/format';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const WALLETS: WalletOption[] = [
  { id: 'metamask', name: 'MetaMask', icon: '🦊', color: '#F6851B' },
  { id: 'trust', name: 'Trust Wallet', icon: '🛡', color: '#3375BB' },
  { id: 'phantom', name: 'Phantom', icon: '👻', color: '#AB9FF2' },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: '🔵', color: '#0052FF' },
  { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', color: '#3B99FC' },
  { id: 'exodus', name: 'Exodus', icon: ' Exodus', color: '#1B1B1B' },
  { id: 'ledger', name: 'Ledger', icon: '🔒', color: '#000000' },
  { id: 'trezor', name: 'Trezor', icon: '🔑', color: '#000000' },
];

interface ConnectWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export interface WalletConnectionPayload {
  connected: boolean;
  wallet_type?: string;
  wallet_name?: string;
  wallet_address?: string;
  connected_at?: string;
}

const WALLET_SETTINGS_KEY = 'vaultex_wallet_connect_settings';
const DEFAULT_SETTINGS = {
  wallet_connect_title: 'Connect Your Wallet',
  wallet_connect_description: 'Select your preferred wallet and enter your wallet address to connect.',
  wallet_connect_label: 'Your Wallet Address',
  wallet_connect_placeholder: '0x... or your wallet address',
};
export const WALLET_CONNECTED_KEY = 'vaultex_wallet_connected';

export function readWalletConnectionStatus(): WalletConnectionPayload | null {
  try {
    const raw = localStorage.getItem(WALLET_CONNECTED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WalletConnectionPayload;
  } catch {
    return null;
  }
}

export async function disconnectWalletConnection() {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) {
      await supabase.from('wallet_connections').delete().eq('user_id', sessionData.session.user.id);
    }
  } catch {
    // The local disconnect fallback should still work even if the server row cannot be deleted.
  }

  localStorage.removeItem(WALLET_CONNECTED_KEY);
  window.dispatchEvent(new Event('vaultex-wallet-status'));
}

export function ConnectWalletModal({ open, onClose }: ConnectWalletModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'select' | 'address' | 'connected'>('select');
  const [selectedWallet, setSelectedWallet] = useState<WalletOption | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (open) {
      setStep('select');
      setSelectedWallet(null);
      setWalletAddress('');

      const loadSettings = async () => {
        const { data } = await supabase
          .from('site_settings')
          .select('wallet_connect_title, wallet_connect_description, wallet_connect_label, wallet_connect_placeholder')
          .maybeSingle();

        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
          localStorage.setItem(WALLET_SETTINGS_KEY, JSON.stringify(data));
          return;
        }

        try {
          const cached = localStorage.getItem(WALLET_SETTINGS_KEY);
          setSettings(cached ? { ...DEFAULT_SETTINGS, ...JSON.parse(cached) } : DEFAULT_SETTINGS);
        } catch {
          setSettings(DEFAULT_SETTINGS);
        }
      };

      loadSettings();
    }
  }, [open]);

  const handleConnect = async () => {
    if (!selectedWallet) return;
    if (!walletAddress.trim()) {
      toast('Please enter your wallet address.', 'error');
      return;
    }

    setConnecting(true);
    const cleanAddress = walletAddress.trim();
    const { data: session } = await supabase.auth.getSession();

    if (session.session?.user) {
      const { error } = await supabase
        .from('wallet_connections')
        .upsert(
          {
            user_id: session.session.user.id,
            wallet_type: selectedWallet.id,
            wallet_address: cleanAddress,
          },
          { onConflict: 'user_id, wallet_type' }
        );

      if (error) {
        toast('Failed to connect wallet: ' + error.message, 'error');
        setConnecting(false);
        return;
      }

      const connectedPayload = {
        connected: true,
        wallet_type: selectedWallet.id,
        wallet_name: selectedWallet.name,
        wallet_address: cleanAddress,
        connected_at: new Date().toISOString(),
      };

      localStorage.setItem(WALLET_CONNECTED_KEY, JSON.stringify(connectedPayload));
      window.dispatchEvent(new Event('vaultex-wallet-status'));

      toast(`${selectedWallet.name} wallet connected successfully!`, 'success');
      setStep('connected');
    } else {
      const connectedPayload = {
        connected: true,
        wallet_type: selectedWallet.id,
        wallet_name: selectedWallet.name,
        wallet_address: cleanAddress,
        connected_at: new Date().toISOString(),
      };

      localStorage.setItem(WALLET_CONNECTED_KEY, JSON.stringify(connectedPayload));
      window.dispatchEvent(new Event('vaultex-wallet-status'));

      toast('Wallet selected! Sign in to save your wallet connection.', 'info');
      setStep('connected');
    }

    setConnecting(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={settings.wallet_connect_title}
      size="md"
      footer={
        step === 'address' ? (
          <>
            <Button variant="outline" onClick={() => setStep('select')}>Back</Button>
            <Button loading={connecting} onClick={handleConnect} variant="success" icon={<Wallet className="w-4 h-4" />}>Connect Wallet</Button>
          </>
        ) : step === 'connected' ? (
          <>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="success" icon={<CheckCircle2 className="w-4 h-4" />}>Wallet Connected</Button>
          </>
        ) : undefined
      }
    >
      {step === 'select' ? (
        <div>
          <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{settings.wallet_connect_description}</p>
          <div className="grid grid-cols-2 gap-3">
            {WALLETS.map(w => (
              <button
                key={w.id}
                onClick={() => { setSelectedWallet(w); setStep('address'); }}
                className={classNames(
                  'flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                  'border-surface-200 dark:border-surface-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-surface-800',
                )}
              >
                <span className="text-2xl">{w.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{w.name}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">Popular</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : step === 'address' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
            <span className="text-2xl">{selectedWallet?.icon}</span>
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">{selectedWallet?.name}</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Enter your wallet address below</p>
            </div>
          </div>
          <Input
            label={settings.wallet_connect_label}
            value={walletAddress}
            onChange={e => setWalletAddress(e.target.value)}
            placeholder={settings.wallet_connect_placeholder}
          />
          <div className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 p-3">
            <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">Wallet Address Preview</p>
            <p className="text-xs font-mono text-surface-900 dark:text-surface-100 break-all">{walletAddress.trim() || '0x...'}</p>
          </div>
          <p className="text-xs text-surface-400 dark:text-surface-500">
            Make sure you are connecting the correct wallet address. Double-check the address before confirming.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-positive-light dark:bg-positive/15 rounded-lg border border-positive/30">
            <CheckCircle2 className="w-7 h-7 text-positive" />
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-surface-100">Wallet Connected</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">{selectedWallet?.name}</p>
            </div>
          </div>
          <div className="rounded-lg border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-3">
            <p className="text-xs uppercase tracking-wide text-surface-500 dark:text-surface-400 mb-1">Connected Address</p>
            <p className="text-xs font-mono text-surface-900 dark:text-surface-100 break-all">{walletAddress.trim()}</p>
          </div>
          <Button variant="success" icon={<CheckCircle2 className="w-4 h-4" />} className="w-full justify-center" onClick={onClose}>Wallet Connected</Button>
        </div>
      )}
    </Modal>
  );
}
