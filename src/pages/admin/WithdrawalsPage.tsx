import { useState, useEffect } from 'react';
import { PageHeader, Tabs, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface Withdrawal extends Record<string, unknown> {
  id: string;
  user: string;
  asset: string;
  amount: number;
  fee: number;
  destination: string;
  method: string;
  date: string;
  status: string;
}

interface WithdrawalRow {
  id: string;
  user_id: string;
  asset_symbol: string;
  amount: number;
  fee: number;
  reference: string;
  status: string;
  created_at: string;
  details?: {
    address?: string;
    method?: string;
    memo?: string;
    network?: string;
  } | null;
}

export default function AdminWithdrawalsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, user_id, asset_symbol, amount, fee, reference, status, created_at, details')
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false });

      if (error) {
        toast('Failed to load withdrawal records from Supabase.', 'error');
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set((rows || []).map((r: WithdrawalRow) => r.user_id).filter(Boolean)));
      const profileMap = new Map<string, string>();

      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        (profiles || []).forEach((profile: { id: string; full_name: string }) => {
          profileMap.set(profile.id, profile.full_name || 'Unknown user');
        });
      }

      const mapped: Withdrawal[] = (rows || []).map((r: WithdrawalRow) => ({
        id: r.id,
        user: profileMap.get(r.user_id) || 'Unknown user',
        asset: r.asset_symbol || 'N/A',
        amount: Number(r.amount) || 0,
        fee: Number(r.fee) || 0,
        destination: typeof r.details?.address === 'string' ? r.details.address : r.reference || 'N/A',
        method: typeof r.details?.method === 'string' ? r.details.method : r.details?.network || 'Crypto Withdrawal',
        date: r.created_at,
        status: r.status || 'pending',
      }));

      setWithdrawals(mapped);
      setLoading(false);
    })();
  }, [toast]);

  const filtered = tab === 'all' ? withdrawals : withdrawals.filter(w => w.status === tab);
  const pageRows = filtered.slice((page - 1) * 10, page * 10);

  const updateWithdrawalStatus = async (withdrawal: Withdrawal, status: string) => {
    const { error } = await supabase.from('transactions').update({ status }).eq('id', withdrawal.id).eq('type', 'withdrawal');
    if (error) { toast(`Failed to update withdrawal: ${error.message}`, 'error'); return; }
    setWithdrawals(current => current.map(item => item.id === withdrawal.id ? { ...item, status } : item));
    toast(`Withdrawal status updated to ${status.replace(/_/g, ' ')}.`, 'success');
  };

  return (
    <div>
      <PageHeader title="Withdrawal Management" subtitle={`${withdrawals.length} total withdrawal requests`} />

      <div className="mb-4"><Tabs tabs={[
        { key: 'all', label: 'All', count: withdrawals.length },
        { key: 'pending', label: 'Pending', count: withdrawals.filter(w => w.status === 'pending').length },
        { key: 'under_review', label: 'Under Review', count: withdrawals.filter(w => w.status === 'under_review').length },
        { key: 'processing', label: 'Processing', count: withdrawals.filter(w => w.status === 'processing').length },
        { key: 'completed', label: 'Completed', count: withdrawals.filter(w => w.status === 'completed').length },
        { key: 'rejected', label: 'Rejected', count: withdrawals.filter(w => w.status === 'rejected').length },
      ]} active={tab} onChange={(k) => { setTab(k); setPage(1); }} /></div>

      <Table<Withdrawal>
        columns={[
          { key: 'user', header: 'User', render: (w) => <span className="text-sm font-medium text-surface-900">{w.user}</span> },
          { key: 'asset', header: 'Asset', render: (w) => <span className="text-sm text-surface-700">{w.asset}</span> },
          { key: 'amount', header: 'Amount', align: 'right', render: (w) => <span className="text-sm num font-medium text-surface-900">{w.amount} {w.asset}</span> },
          { key: 'fee', header: 'Fee', align: 'right', render: (w) => <span className="text-sm num text-surface-500">{w.fee} {w.asset}</span> },
          { key: 'destination', header: 'Destination', render: (w) => <span className="text-xs font-mono text-surface-500 hidden md:table-cell">{w.destination}</span> },
          { key: 'date', header: 'Date', render: (w) => <span className="text-xs text-surface-500">{formatDateTime(w.date)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (w) => <StatusBadge status={w.status} /> },
          { key: 'actions', header: '', align: 'right', render: (w) => (
            <Dropdown trigger={<button className="p-1.5 hover:bg-surface-100 rounded text-sm">Review</button>}>
              <DropdownItem onClick={() => updateWithdrawalStatus(w, 'approved')}>Approve</DropdownItem>
              <DropdownItem onClick={() => updateWithdrawalStatus(w, 'under_review')}>Put on Hold</DropdownItem>
              <DropdownItem onClick={() => updateWithdrawalStatus(w, 'processing')}>Mark Processing</DropdownItem>
              <DropdownSeparator />
              <DropdownItem variant="danger" onClick={() => updateWithdrawalStatus(w, 'rejected')}>Reject</DropdownItem>
            </Dropdown>
          ) },
        ]}
        data={pageRows}
        loading={loading}
        rowKey={(w) => w.id}
        emptyState={<EmptyState title="No withdrawals found" description="No withdrawals match your current filter." />}
      />

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />
    </div>
  );
}
