import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Ban, Check, Shield, FileText, Wallet, Receipt, TrendingUp, LifeBuoy, Lock, Edit, AlertTriangle } from 'lucide-react';
import { Card, PageHeader, Tabs, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge, VerificationBadge, StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface WalletConnectionRow {
  id: string;
  wallet_type: string;
  wallet_address: string;
  created_at: string;
}

interface UserBalanceRow {
  asset_symbol: string;
  available: number;
  invested: number;
  pending: number;
  usd_value: number;
}

interface UserRecord {
  id: string;
  created_at?: string;
  [key: string]: unknown;
}

interface AdminProfileUser {
  id: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  verification: string;
  status: 'active' | 'pending_verification' | 'restricted' | 'suspended' | 'closed';
  twoFactorEnabled: boolean;
  created: string;
  profileUpdated: string;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tab, setTab] = useState('profile');
  const [restrictOpen, setRestrictOpen] = useState(false);
  const [restrictReason, setRestrictReason] = useState('');
  const [restrictType, setRestrictType] = useState('disable_withdrawals');
  const [walletConnections, setWalletConnections] = useState<WalletConnectionRow[]>([]);
  const [balances, setBalances] = useState<UserBalanceRow[]>([]);
  const [transactions, setTransactions] = useState<UserRecord[]>([]);
  const [orders, setOrders] = useState<UserRecord[]>([]);
  const [restrictions, setRestrictions] = useState<UserRecord[]>([]);
  const [verificationRecords, setVerificationRecords] = useState<UserRecord[]>([]);
  const [supportTickets, setSupportTickets] = useState<UserRecord[]>([]);
  const [securityEvents, setSecurityEvents] = useState<UserRecord[]>([]);
  const [user, setUser] = useState<AdminProfileUser>({
    id: id || '',
    name: 'Loading user...',
    email: '',
    country: 'Unknown',
    phone: '',
    verification: 'unverified',
    status: 'active',
    twoFactorEnabled: false,
    created: '',
    profileUpdated: '',
  });

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, country, phone, verification_level, account_status, two_factor_enabled, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        setUser({
          id: data.id,
          name: data.full_name || data.email || 'Unknown User',
          email: data.email || '',
          country: data.country || 'Unknown',
          phone: data.phone || '',
          verification: data.verification_level || 'unverified',
          status: data.account_status || 'active',
          twoFactorEnabled: data.two_factor_enabled,
          created: data.created_at ? String(data.created_at).slice(0, 10) : '',
          profileUpdated: data.updated_at || '',
        });
      }
    };

    const loadWalletConnections = async () => {
      const { data, error } = await supabase
        .from('wallet_connections')
        .select('id, wallet_type, wallet_address, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (!error) {
        setWalletConnections((data || []) as WalletConnectionRow[]);
      }
    };

    const loadUserRecords = async () => {
      const [balanceResult, assetResult, transactionResult, orderResult, restrictionResult, verificationResult, ticketResult, securityResult] = await Promise.all([
        supabase.from('balances').select('asset_id, available, invested, pending').eq('user_id', id),
        supabase.from('assets').select('id, symbol, current_price'),
        supabase.from('transactions').select('id, type, asset_symbol, amount, fee, status, reference, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('orders').select('id, pair, side, order_type, price, amount, total, status, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('account_restrictions').select('id, restriction_type, reason, is_active, expires_at, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('verification_records').select('id, stage, status, submitted_at, reviewed_at, rejection_reason').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('support_tickets').select('id, ticket_number, subject, category, priority, status, created_at').eq('user_id', id).order('created_at', { ascending: false }),
        supabase.from('security_events').select('id, event_type, ip_address, created_at').eq('user_id', id).order('created_at', { ascending: false }),
      ]);

      const priceMap = new Map((assetResult.data || []).map(asset => [asset.id, { symbol: asset.symbol, price: Number(asset.current_price) }]));
      const userBalances = (balanceResult.data || []).map(balance => {
        const asset = priceMap.get(balance.asset_id);
        const available = Number(balance.available);
        const invested = Number(balance.invested);
        const pending = Number(balance.pending);
        return {
          asset_symbol: asset?.symbol || 'Unknown',
          available,
          invested,
          pending,
          usd_value: (available + invested + pending) * (asset?.price || 0),
        };
      });

      setBalances(userBalances);
      setTransactions((transactionResult.data || []) as UserRecord[]);
      setOrders((orderResult.data || []) as UserRecord[]);
      setRestrictions((restrictionResult.data || []) as UserRecord[]);
      setVerificationRecords((verificationResult.data || []) as UserRecord[]);
      setSupportTickets((ticketResult.data || []) as UserRecord[]);
      setSecurityEvents((securityResult.data || []) as UserRecord[]);
    };

    loadUser();
    loadWalletConnections();
    loadUserRecords();
  }, [id]);

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'verification', label: 'Verification' },
    { key: 'balances', label: 'Balances' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'deposits', label: 'Deposits' },
    { key: 'withdrawals', label: 'Withdrawals' },
    { key: 'trades', label: 'Trades' },
    { key: 'support', label: 'Support' },
    { key: 'security', label: 'Security' },
    { key: 'restrictions', label: 'Restrictions' },
    { key: 'notes', label: 'Admin Notes' },
  ];

  const handleRestrict = async () => {
    if (!restrictReason) { toast('Please provide a reason for the restriction.', 'error'); return; }
    const { data: authData } = await supabase.auth.getUser();
    if (!id || !authData.user) { toast('Could not identify the admin or target user.', 'error'); return; }
    const { error } = await supabase.from('account_restrictions').insert({
      user_id: id,
      restriction_type: restrictType,
      reason: restrictReason,
      created_by: authData.user.id,
    });
    if (error) { toast(`Failed to apply restriction: ${error.message}`, 'error'); return; }

    if (restrictType === 'full_suspension' || restrictType === 'suspend_login') {
      const { error: profileError } = await supabase.from('profiles').update({ account_status: 'suspended' }).eq('id', id);
      if (profileError) { toast(`Restriction saved, but profile status update failed: ${profileError.message}`, 'error'); }
      else setUser(current => ({ ...current, status: 'suspended' }));
    } else {
      toast('Account restriction saved.', 'success');
    }
    const { data: restrictionRows } = await supabase.from('account_restrictions').select('id, restriction_type, reason, is_active, expires_at, created_at').eq('user_id', id).order('created_at', { ascending: false });
    setRestrictions((restrictionRows || []) as UserRecord[]);
    setRestrictOpen(false);
    setRestrictReason('');
  };

  const verifyUser = async () => {
    if (!id) return;
    const { error } = await supabase.from('profiles').update({ verification_level: 'verified' }).eq('id', id);
    if (error) { toast(`Failed to update verification status: ${error.message}`, 'error'); return; }
    setUser(current => ({ ...current, verification: 'verified' }));
    toast('User verification status updated.', 'success');
  };

  const renderRecordList = (rows: UserRecord[], fields: Array<{ key: string; label: string }>) => (
    <Card>
      {rows.length === 0 ? (
        <EmptyState title="No records found" description="There are no database records for this user in this section." />
      ) : (
        <div className="divide-y divide-surface-100">
          {rows.map(row => (
            <div key={row.id} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0">
              {fields.map(field => (
                <div key={field.key} className="min-w-0">
                  <p className="text-xs text-surface-500">{field.label}</p>
                  <p className="text-sm text-surface-800 break-all">{row[field.key] == null ? '—' : String(row[field.key])}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <Link to="/admin/users" className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-4"><ArrowLeft className="w-4 h-4" /> Back to Users</Link>

      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-surface-900">{user.name}</h1>
            <p className="text-sm text-surface-500">{user.email} · <span className="font-mono text-xs">{user.id}</span></p>
            <div className="flex items-center gap-2 mt-2">
              <AccountStatusBadge status={user.status} />
              <VerificationBadge level={user.verification as 'unverified' | 'basic' | 'verified' | 'rejected'} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />}>Edit</Button>
          <Button variant="outline" size="sm" icon={<Check className="w-4 h-4" />} onClick={verifyUser}>Verify</Button>
          <Button variant="danger" size="sm" icon={<Ban className="w-4 h-4" />} onClick={() => setRestrictOpen(true)}>Restrict</Button>
        </div>
      </div>

      <div className="mb-6"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      {tab === 'profile' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card><h3 className="text-sm font-semibold text-surface-900 mb-4">Personal Information</h3>
            <div className="space-y-3">
              {[['Full Name', user.name], ['Email', user.email], ['Country', user.country], ['Phone', user.phone], ['User ID', user.id], ['Account Created', formatDate(user.created)], ['Profile Updated', formatDateTime(user.profileUpdated)]].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{k}</span><span className="text-sm font-medium text-surface-900">{v}</span></div>
              ))}
              <div className="border-t border-surface-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-surface-700">Connected Wallets</span>
                  <span className="text-xs text-surface-500">{walletConnections.length}</span>
                </div>
                {walletConnections.length === 0 ? (
                  <p className="text-xs text-surface-500 mt-2">No wallet address connected.</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {walletConnections.map(w => (
                      <div key={w.id} className="rounded border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold uppercase text-brand-700 dark:text-brand-400">{w.wallet_type}</span>
                          <span className="text-[11px] text-surface-500">{formatDateTime(w.created_at)}</span>
                        </div>
                        <p className="mt-1 text-xs font-mono text-surface-900 dark:text-surface-100 break-all">{w.wallet_address}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
          <Card><h3 className="text-sm font-semibold text-surface-900 mb-4">Account Summary</h3>
            <div className="space-y-3">
              {[['Total Balance', formatCurrency(balances.reduce((sum, balance) => sum + balance.usd_value, 0))], ['Account Status', user.status], ['Verification Level', user.verification], ['2FA Enabled', user.twoFactorEnabled ? 'Yes' : 'No'], ['Session Details', 'Not stored in the database']].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{k}</span><span className="text-sm font-medium text-surface-900">{v}</span></div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'balances' && (
        <Card padding={false} className="overflow-hidden">
          <table className="w-full"><thead><tr className="bg-surface-50 border-b border-surface-200">
            <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 uppercase text-left">Asset</th>
            <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">Available</th>
            <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">Invested</th>
            <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">Pending</th>
            <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">USD Value</th>
          </tr></thead><tbody className="divide-y divide-surface-100">
            {balances.map(balance => (
              <tr key={balance.asset_symbol} className="hover:bg-surface-50">
                <td className="px-5 py-3 text-sm font-medium text-surface-900">{balance.asset_symbol}</td>
                <td className="px-5 py-3 text-right text-sm num text-surface-700">{balance.available.toFixed(8)}</td>
                <td className="px-5 py-3 text-right text-sm num text-surface-700">{balance.invested.toFixed(8)}</td>
                <td className="px-5 py-3 text-right text-sm num text-surface-700">{balance.pending.toFixed(8)}</td>
                <td className="px-5 py-3 text-right text-sm num font-medium text-surface-900">{formatCurrency(balance.usd_value)}</td>
              </tr>
            ))}
            {balances.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-surface-500">No balance records found.</td></tr>}
          </tbody></table>
        </Card>
      )}

      {tab === 'transactions' && (
        renderRecordList(transactions, [{ key: 'type', label: 'Type' }, { key: 'asset_symbol', label: 'Asset' }, { key: 'amount', label: 'Amount' }, { key: 'fee', label: 'Fee' }, { key: 'status', label: 'Status' }, { key: 'reference', label: 'Reference' }, { key: 'created_at', label: 'Created' }])
      )}

      {tab === 'restrictions' && (
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-restricted shrink-0 mt-0.5" />
            <div><h3 className="text-sm font-semibold text-surface-900">Account Restrictions</h3><p className="text-xs text-surface-500">{restrictions.filter(row => row.is_active === true).length} active restriction(s).</p></div>
          </div>
          {restrictions.map(row => (
            <div key={row.id} className="py-2 border-t border-surface-100">
              <p className="text-sm font-medium text-surface-800">{String(row.restriction_type)} · {row.is_active ? 'Active' : 'Inactive'}</p>
              <p className="text-xs text-surface-500">{String(row.reason || 'No reason supplied')} · {formatDateTime(String(row.created_at))}</p>
            </div>
          ))}
          <Button variant="danger" size="sm" icon={<Ban className="w-4 h-4" />} onClick={() => setRestrictOpen(true)}>Add Restriction</Button>
        </Card>
      )}

      {tab === 'notes' && (
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Internal Admin Notes</h3>
          <p className="text-sm text-surface-500">Admin notes are not stored by the current database schema.</p>
        </Card>
      )}

      {tab === 'verification' && renderRecordList(verificationRecords, [{ key: 'stage', label: 'Stage' }, { key: 'status', label: 'Status' }, { key: 'submitted_at', label: 'Submitted' }, { key: 'reviewed_at', label: 'Reviewed' }, { key: 'rejection_reason', label: 'Rejection Reason' }])}
      {tab === 'deposits' && renderRecordList(transactions.filter(row => row.type === 'deposit'), [{ key: 'asset_symbol', label: 'Asset' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }, { key: 'reference', label: 'Reference' }, { key: 'created_at', label: 'Created' }])}
      {tab === 'withdrawals' && renderRecordList(transactions.filter(row => row.type === 'withdrawal'), [{ key: 'asset_symbol', label: 'Asset' }, { key: 'amount', label: 'Amount' }, { key: 'fee', label: 'Fee' }, { key: 'status', label: 'Status' }, { key: 'reference', label: 'Reference' }, { key: 'created_at', label: 'Created' }])}
      {tab === 'trades' && renderRecordList(orders, [{ key: 'pair', label: 'Pair' }, { key: 'side', label: 'Side' }, { key: 'order_type', label: 'Order Type' }, { key: 'price', label: 'Price' }, { key: 'amount', label: 'Amount' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Created' }])}
      {tab === 'support' && renderRecordList(supportTickets, [{ key: 'ticket_number', label: 'Ticket' }, { key: 'subject', label: 'Subject' }, { key: 'category', label: 'Category' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status' }, { key: 'created_at', label: 'Created' }])}
      {tab === 'security' && renderRecordList(securityEvents, [{ key: 'event_type', label: 'Event' }, { key: 'ip_address', label: 'IP Address' }, { key: 'created_at', label: 'Created' }])}

      <Modal open={restrictOpen} onClose={() => setRestrictOpen(false)} title="Apply Account Restriction"
        footer={<><Button variant="outline" onClick={() => setRestrictOpen(false)}>Cancel</Button><Button variant="danger" onClick={handleRestrict}>Apply Restriction</Button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Restriction Type</label>
            <select value={restrictType} onChange={e => setRestrictType(e.target.value)} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
              <option value="disable_deposits">Disable Deposits</option>
              <option value="disable_withdrawals">Disable Withdrawals</option>
              <option value="disable_trading">Disable Trading</option>
              <option value="disable_investments">Disable Investments</option>
              <option value="disable_transfers">Disable Transfers</option>
              <option value="require_verification">Require Verification</option>
              <option value="require_manual_review">Require Manual Review</option>
              <option value="suspend_login">Suspend Login</option>
              <option value="full_suspension">Full Account Suspension</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Reason</label>
            <textarea value={restrictReason} onChange={e => setRestrictReason(e.target.value)} rows={3} placeholder="Provide a reason for this restriction..." className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          </div>
          <div className="flex items-start gap-2 p-3 bg-warning-light/50 rounded">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-surface-600">The restriction and reason will be saved to the account. This project does not currently send restriction notifications or write audit-log entries.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
