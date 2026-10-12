import { useState, useEffect } from 'react';
import { PageHeader, Tabs, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface Deposit extends Record<string, unknown> {
  id: string;
  user: string;
  asset: string;
  amount: number;
  method: string;
  reference: string;
  date: string;
  status: string;
}

interface TransactionRow {
  id: string;
  user_id: string;
  asset_symbol: string;
  amount: number;
  reference: string;
  status: string;
  created_at: string;
  details?: {
    method?: string;
    address?: string;
    network?: string;
  } | null;
}

export default function AdminDepositsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Deposit | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDeposits = async () => {
    setLoading(true);

    const { data: transactionRows, error } = await supabase
      .from('transactions')
      .select('id, user_id, asset_symbol, amount, reference, status, created_at, details')
      .eq('type', 'deposit')
      .order('created_at', { ascending: false });

    if (error) {
      toast('Failed to load deposit records from Supabase.', 'error');
      setLoading(false);
      return;
    }

    const userIds = Array.from(new Set((transactionRows || []).map((r: TransactionRow) => r.user_id).filter(Boolean)));
    const profileMap = new Map<string, string>();

    if (userIds.length) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profileError) {
        toast('Deposit records loaded, but user names could not be joined.', 'error');
      }

      (profiles || []).forEach((profile: { id: string; full_name: string }) => {
        profileMap.set(profile.id, profile.full_name || 'Unknown user');
      });
    }

    const rows: Deposit[] = (transactionRows || []).map((row: TransactionRow) => ({
      id: row.id,
      user: profileMap.get(row.user_id) || 'Unknown user',
      asset: row.asset_symbol || 'N/A',
      amount: Number(row.amount) || 0,
      method: typeof row.details?.method === 'string' ? row.details.method : 'Crypto Transfer',
      reference: row.reference || row.id,
      date: row.created_at,
      status: row.status || 'pending',
    }));

    setDeposits(rows);
    setLoading(false);
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { data: deposit, error: depositError } = await supabase
      .from('transactions')
      .select('id, user_id, asset_id, asset_symbol, amount, status')
      .eq('id', id)
      .eq('type', 'deposit')
      .maybeSingle();

    if (depositError || !deposit) {
      toast('Failed to load the deposit transaction before review.', 'error');
      return;
    }

    const { error } = await supabase
      .from('transactions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('type', 'deposit');

    if (error) {
      toast(`Failed to update deposit status: ${error.message}`, 'error');
      return;
    }

    if (['completed', 'confirmed', 'approved'].includes(status)) {
      let assetId = deposit.asset_id;

      if (!assetId) {
        const { data: assetRow, error: assetError } = await supabase
          .from('assets')
          .select('id')
          .eq('symbol', deposit.asset_symbol)
          .maybeSingle();

        if (!assetError && assetRow) {
          assetId = assetRow.id;
        }
      }

      if (assetId) {
        const { data: existingBalance, error: balanceReadError } = await supabase
          .from('balances')
          .select('*')
          .eq('user_id', deposit.user_id)
          .eq('asset_id', assetId)
          .maybeSingle();

        if (!balanceReadError && existingBalance) {
          await supabase
            .from('balances')
            .update({
              available: Number(existingBalance.available) + Number(deposit.amount),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingBalance.id);
        } else {
          await supabase.from('balances').insert({
            user_id: deposit.user_id,
            asset_id: assetId,
            available: Number(deposit.amount),
            invested: 0,
            pending: 0,
            avg_acquisition_price: 0,
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    toast(`Deposit status set to ${status}.`, 'success');
    await loadDeposits();
  };

  const filtered = tab === 'all' ? deposits : deposits.filter(d => d.status === tab);

  return (
    <div>
      <PageHeader title="Deposit Management" subtitle={`${deposits.length} total deposits`} />

      <div className="mb-4"><Tabs tabs={[
        { key: 'all', label: 'All', count: deposits.length },
        { key: 'pending', label: 'Pending', count: deposits.filter(d => d.status === 'pending').length },
        { key: 'under_review', label: 'Under Review', count: deposits.filter(d => d.status === 'under_review').length },
        { key: 'confirmed', label: 'Confirmed', count: deposits.filter(d => d.status === 'confirmed').length },
        { key: 'completed', label: 'Completed', count: deposits.filter(d => d.status === 'completed').length },
        { key: 'rejected', label: 'Rejected', count: deposits.filter(d => d.status === 'rejected').length },
      ]} active={tab} onChange={(k) => { setTab(k); setPage(1); }} /></div>

      <Table<Deposit>
        columns={[
          { key: 'user', header: 'User', render: (d) => <span className="text-sm font-medium text-surface-900">{d.user}</span> },
          { key: 'asset', header: 'Asset', render: (d) => <span className="text-sm text-surface-700">{d.asset}</span> },
          { key: 'amount', header: 'Amount', align: 'right', render: (d) => <span className="text-sm num font-medium text-surface-900">{d.amount} {d.asset}</span> },
          { key: 'method', header: 'Method', render: (d) => <span className="text-sm text-surface-600 hidden md:table-cell">{d.method}</span> },
          { key: 'reference', header: 'Reference', render: (d) => <span className="text-xs font-mono text-surface-500">{d.reference}</span> },
          { key: 'date', header: 'Date', render: (d) => <span className="text-xs text-surface-500">{formatDateTime(d.date)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (d) => <StatusBadge status={d.status} /> },
          { key: 'actions', header: '', align: 'right', render: (d) => (
            <Dropdown trigger={<button className="p-1.5 hover:bg-surface-100 rounded text-sm">Review</button>}>
              <DropdownItem onClick={() => setSelected(d)}>View Details</DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={() => updateStatus(d.id, 'completed')}>Approve</DropdownItem>
              <DropdownItem onClick={() => updateStatus(d.id, 'under_review')}>Mark Under Review</DropdownItem>
              <DropdownSeparator />
              <DropdownItem variant="danger" onClick={() => updateStatus(d.id, 'rejected')}>Reject</DropdownItem>
            </Dropdown>
          ) },
        ]}
        data={filtered}
        loading={loading}
        rowKey={(d) => d.id}
        emptyState={<EmptyState title="No deposits found" description="No deposits match your current filter." />}
      />

      <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} onPageChange={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Deposit Details" size="md">
        {selected && (
          <div className="space-y-3">
            {[['User', selected.user], ['Asset', selected.asset], ['Amount', `${selected.amount} ${selected.asset}`], ['Method', selected.method], ['Reference', selected.reference], ['Date', formatDateTime(selected.date)]].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">{k}</span><span className="text-sm font-medium text-surface-900">{v}</span></div>
            ))}
            <div className="flex justify-between py-2 border-b border-surface-100 last:border-0"><span className="text-sm text-surface-500">Status</span><StatusBadge status={selected.status} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
