import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Tabs } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';

const WALLET_SETTINGS_KEY = 'vaultex_wallet_connect_settings';
const DEFAULT_WALLET_SETTINGS = {
  wallet_connect_title: 'Connect Your Wallet',
  wallet_connect_description: 'Select your preferred wallet and enter your wallet address to connect.',
  wallet_connect_label: 'Your Wallet Address',
  wallet_connect_placeholder: '0x... or your wallet address',
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'trading', label: 'Trading' },
    { key: 'limits', label: 'Limits' },
    { key: 'fees', label: 'Fees' },
    { key: 'security', label: 'Security' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'appearance', label: 'Appearance' },
    { key: 'wallet', label: 'Wallet Connect' },
    { key: 'seo', label: 'SEO' },
    { key: 'deposit_addresses', label: 'Deposit Addresses' },
  ];

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase.from('site_settings').select('*').maybeSingle();

    const walletOverride = (() => {
      try {
        const raw = localStorage.getItem(WALLET_SETTINGS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })();

    if (data) {
      setSettings({
        ...DEFAULT_WALLET_SETTINGS,
        ...(data as Record<string, unknown>),
      });
      return;
    }

    if (error) {
      setSettings({
        ...DEFAULT_WALLET_SETTINGS,
        ...walletOverride,
      });
      return;
    }

    setSettings({
      ...DEFAULT_WALLET_SETTINGS,
      ...walletOverride,
    });
  }, [toast]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const saveSettings = async (keys: string[]) => {
    setSaving(true);
    const updates: Record<string, unknown> = {};
    keys.forEach(k => {
      const el = document.getElementById(k) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (el instanceof HTMLInputElement && el.type === 'checkbox') updates[k] = el.checked;
      else if (el) updates[k] = el.value;
    });

    const wantsWalletOverride = keys.some(k => [
      'wallet_connect_title',
      'wallet_connect_description',
      'wallet_connect_label',
      'wallet_connect_placeholder',
    ].includes(k));

    if (wantsWalletOverride) {
      const walletSettings = {
        wallet_connect_title: updates.wallet_connect_title || DEFAULT_WALLET_SETTINGS.wallet_connect_title,
        wallet_connect_description: updates.wallet_connect_description || DEFAULT_WALLET_SETTINGS.wallet_connect_description,
        wallet_connect_label: updates.wallet_connect_label || DEFAULT_WALLET_SETTINGS.wallet_connect_label,
        wallet_connect_placeholder: updates.wallet_connect_placeholder || DEFAULT_WALLET_SETTINGS.wallet_connect_placeholder,
      };

      localStorage.setItem(WALLET_SETTINGS_KEY, JSON.stringify(walletSettings));
      setSettings(prev => ({ ...prev, ...walletSettings }));
    }

    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    let error = null;

    if (settings.id) {
      const result = await supabase
        .from('site_settings')
        .update(payload)
        .eq('id', settings.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('site_settings')
        .insert(payload);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast('Saved locally for the wallet modal, but the database rejected the remote write: ' + error.message, 'warning');
      return;
    }

    toast('Settings saved successfully.', 'success');
    loadSettings();
  };

  const val = (key: string, fallback: string) => String(settings[key] ?? fallback);
  const boolVal = (key: string, fallback = false) => settings[key] === true || settings[key] === 'true' || (settings[key] === undefined && fallback);

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <PageHeader title="Platform Settings" subtitle="Configure platform-wide settings and policies" />
      <div className="mb-6"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      <div key={String(settings.updated_at || 'settings-loading')}>
      {tab === 'general' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">General Settings</h3>
          <div className="space-y-4 max-w-2xl">
            <Input label="Platform Name" defaultValue={val('site_name', 'Vaultex')} id="site_name" />
            <Input label="Contact Email" defaultValue={val('contact_email', 'support@vaultex.com')} id="contact_email" />
            <Input label="Support Email" defaultValue={val('support_email', 'support@vaultex.com')} id="support_email" />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Default Timezone</label>
              <select id="timezone" defaultValue={val('timezone', 'UTC')} className="w-full h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option>UTC</option><option>EST (UTC-5)</option><option>PST (UTC-8)</option><option>CET (UTC+1)</option><option>JST (UTC+9)</option>
              </select>
            </div>
            <Input label="Default Currency" defaultValue={val('default_currency', 'USD')} id="default_currency" />
            <Button loading={saving} onClick={() => saveSettings(['site_name', 'contact_email', 'support_email', 'timezone', 'default_currency'])}>Save Changes</Button>
          </div>
        </Card>
      )}

      {tab === 'trading' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Trading Settings</h3>
          <p className="text-sm text-surface-600 dark:text-surface-400">Trading availability is configured per asset in Asset Management. Margin, order-type, and auto-cancel settings are not stored in the current schema.</p>
        </Card>
      )}

      {tab === 'limits' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Account Limits</h3>
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Minimum Deposit (USD)</label><Input type="number" id="min_deposit" defaultValue={val('min_deposit', '10')} /></div>
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Minimum Withdrawal (USD)</label><Input type="number" id="min_withdrawal" defaultValue={val('min_withdrawal', '10')} /></div>
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Maximum Withdrawal Daily (USD)</label><Input type="number" id="max_withdrawal_daily" defaultValue={val('max_withdrawal_daily', '50000')} /></div>
            </div>
            <Button loading={saving} onClick={() => saveSettings(['min_deposit', 'min_withdrawal', 'max_withdrawal_daily'])}>Save Limits</Button>
          </div>
        </Card>
      )}

      {tab === 'fees' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Fee Configuration</h3>
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Trading Fee (%)</label><Input type="number" step="0.01" id="trading_fee_pct" defaultValue={val('trading_fee_pct', '0.10')} /></div>
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Withdrawal Fee (%)</label><Input type="number" step="0.01" id="withdrawal_fee_pct" defaultValue={val('withdrawal_fee_pct', '0')} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Fee Tiers</label>
              <p className="text-sm text-surface-500 dark:text-surface-400">Tiered maker/taker fees are not configured in the current database. The flat rates above are the persisted platform fee settings.</p>
            </div>
            <Button loading={saving} onClick={() => saveSettings(['trading_fee_pct', 'withdrawal_fee_pct'])}>Save Fees</Button>
          </div>
        </Card>
      )}

      {tab === 'security' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Security Settings</h3>
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <div><p className="text-sm font-medium text-surface-900 dark:text-white">Require 2FA</p><p className="text-xs text-surface-500 dark:text-surface-400">Platform-wide 2FA requirement</p></div>
              <input id="require_2fa" type="checkbox" defaultChecked={boolVal('require_2fa')} className="w-4 h-4 rounded border-surface-300 text-brand-700" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800">
              <div><p className="text-sm font-medium text-surface-900 dark:text-white">Withdrawal Confirmation</p><p className="text-xs text-surface-500 dark:text-surface-400">Require confirmation for withdrawal requests</p></div>
              <input id="withdrawal_confirmation_required" type="checkbox" defaultChecked={boolVal('withdrawal_confirmation_required')} className="w-4 h-4 rounded border-surface-300 text-brand-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Session Duration (hours)</label><Input type="number" id="session_duration_hours" defaultValue={val('session_duration_hours', '24')} /></div>
              <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Admin Session Duration (hours)</label><Input type="number" id="admin_session_duration_hours" defaultValue={val('admin_session_duration_hours', '8')} /></div>
            </div>
            <Button loading={saving} onClick={() => saveSettings(['require_2fa', 'withdrawal_confirmation_required', 'session_duration_hours', 'admin_session_duration_hours'])}>Save Security Settings</Button>
          </div>
        </Card>
      )}

      {tab === 'compliance' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Compliance Settings</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">KYC rules, AML monitoring, and sanctions screening are not configurable through the current database schema. Verification records are managed in Verification Management.</p>
        </Card>
      )}

      {tab === 'notifications' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Notification Settings</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">Admin notification preferences are not stored in the current database schema. User notification records are available in Notifications.</p>
        </Card>
      )}

      {tab === 'appearance' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Appearance Settings</h3>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Primary Accent Color</label>
              <Input id="primary_accent" defaultValue={val('primary_accent', '#0F766E')} />
            </div>
            <Button loading={saving} onClick={() => saveSettings(['primary_accent'])}>Save Appearance</Button>
          </div>
        </Card>
      )}

      {tab === 'wallet' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Wallet Connection Settings</h3>
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-surface-500 dark:text-surface-400">Customize the text shown in the Connect Wallet modal that users see on the homepage, navigation bar, and dashboard.</p>
            <Input label="Modal Title" defaultValue={val('wallet_connect_title', 'Connect Your Wallet')} id="wallet_connect_title" />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Modal Description</label>
              <textarea defaultValue={val('wallet_connect_description', 'Select your preferred wallet and enter your wallet address to connect.')} id="wallet_connect_description" rows={3} className="w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <Input label="Address Input Label" defaultValue={val('wallet_connect_label', 'Your Wallet Address')} id="wallet_connect_label" />
            <Input label="Address Input Placeholder" defaultValue={val('wallet_connect_placeholder', '0x... or your wallet address')} id="wallet_connect_placeholder" />
            <Button loading={saving} onClick={() => saveSettings(['wallet_connect_title', 'wallet_connect_description', 'wallet_connect_label', 'wallet_connect_placeholder'])}>Save Wallet Settings</Button>
          </div>
        </Card>
      )}

      {tab === 'seo' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">SEO Settings</h3>
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-surface-500 dark:text-surface-400">Configure how your site appears in search engine results and social media shares. Changes take effect on the frontend immediately after saving.</p>
            <Input label="SEO Title" defaultValue={val('seo_title', 'Vaultex — Digital Asset Trading & Investment Platform')} id="seo_title" />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">SEO Description</label>
              <textarea defaultValue={val('seo_description', 'Trade and invest in digital assets with confidence. Professional platform for cryptocurrency trading, investing, and portfolio management.')} id="seo_description" rows={3} className="w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <Input label="SEO Keywords" defaultValue={val('seo_keywords', 'crypto, cryptocurrency, bitcoin, ethereum, trading, investment, digital assets')} id="seo_keywords" />
            <Input label="Open Graph Title" defaultValue={val('seo_og_title', 'Vaultex — Trade & Invest in Digital Assets')} id="seo_og_title" />
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Open Graph Description</label>
              <textarea defaultValue={val('seo_og_description', 'A professional platform for cryptocurrency trading, investing, and portfolio management.')} id="seo_og_description" rows={2} className="w-full px-3 py-2 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
            <Button loading={saving} onClick={() => saveSettings(['seo_title', 'seo_description', 'seo_keywords', 'seo_og_title', 'seo_og_description'])}>Save SEO Settings</Button>
          </div>
        </Card>
      )}

      {tab === 'deposit_addresses' && (
        <Card className="dark:bg-surface-900 dark:border-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Deposit Wallet Addresses</h3>
          <div className="space-y-4 max-w-2xl">
            <p className="text-sm text-surface-500 dark:text-surface-400">Set the wallet addresses where users should send their deposits. These addresses are shown on the deposit instructions page.</p>
            <Input label="BTC Deposit Address" defaultValue={val('deposit_btc_address', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')} id="deposit_btc_address" />
            <Input label="ETH Deposit Address" defaultValue={val('deposit_eth_address', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')} id="deposit_eth_address" />
            <Input label="USDT Deposit Address" defaultValue={val('deposit_usdt_address', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')} id="deposit_usdt_address" />
            <Input label="USDC Deposit Address" defaultValue={val('deposit_usdc_address', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')} id="deposit_usdc_address" />
            <Button loading={saving} onClick={() => saveSettings(['deposit_btc_address', 'deposit_eth_address', 'deposit_usdt_address', 'deposit_usdc_address'])}>Save Deposit Addresses</Button>
          </div>
        </Card>
      )}
      </div>
    </div>
  );
}
