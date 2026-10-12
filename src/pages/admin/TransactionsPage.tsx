import { useState, useEffect } from 'react';
import { PageHeader, Tabs, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface Txn extends Record<string, unknown> {
  id: string;
  user: string;
  type: string;
  asset: string;
  amount: number;
  fee: number;
  status: string;
  reference: string;
  date: string;
}

interface TransactionRow {
  id: string;
  user_id: string;
  type: string;
  asset_symbol: string;
  amount: number;
  fee: number;
  status: string;
  reference: string;
  created_at: string;
}

export default function AdminTransactionsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, user_id, type, asset_symbol, amount, fee, status, reference, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        toast('Failed to load transaction history from Supabase.', 'error');
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set((rows || []).map((r: TransactionRow) => r.user_id).filter(Boolean)));
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

      const mapped: Txn[] = (rows || []).map((r: TransactionRow) => ({
        id: r.id,
        user: profileMap.get(r.user_id) || 'Unknown user',
        type: r.type,
        asset: r.asset_symbol || 'N/A',
        amount: Number(r.amount) || 0,
        fee: Number(r.fee) || 0,
        status: r.status || 'pending',
        reference: r.reference || r.id,
        date: r.created_at,
      }));

      setTxns(mapped);
      setLoading(false);
    })();
  }, [toast]);

  const filtered = tab === 'all' ? txns : txns.filter(t => t.type === tab);

  return (
    <div>
      <PageHeader title="Transaction History" subtitle={`${txns.length} total transactions`} />

      <div className="mb-4"><Tabs tabs={[
        { key: 'all', label: 'All' }, { key: 'deposit', label: 'Deposits' }, { key: 'withdrawal', label: 'Withdrawals' },
        { key: 'buy', label: 'Buys' }, { key: 'sell', label: 'Sells' }, { key: 'transfer', label: 'Transfers' }, { key: 'investment', label: 'Investments' },
      ]} active={tab} onChange={(k) => { setTab(k); setPage(1); }} /></div>

      <Table
        columns={[
          { key: 'user', header: 'User', render: (t) => <span className="text-sm font-medium text-surface-900">{t.user}</span> },
          { key: 'type', header: 'Type', render: (t) => <span className="text-sm text-surface-700 capitalize">{t.type}</span> },
          { key: 'asset', header: 'Asset', render: (t) => <span className="text-sm text-surface-700">{t.asset}</span> },
          { key: 'amount', header: 'Amount', align: 'right', render: (t) => <span className="text-sm num text-surface-900">{t.amount} {t.asset}</span> },
          { key: 'fee', header: 'Fee', align: 'right', render: (t) => <span className="text-sm num text-surface-500">{t.fee}</span> },
          { key: 'reference', header: 'Reference', render: (t) => <span className="text-xs font-mono text-surface-500">{t.reference}</span> },
          { key: 'date', header: 'Date', render: (t) => <span className="text-xs text-surface-500">{formatDateTime(t.date)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (t) => <StatusBadge status={t.status} /> },
        ]}
        data={filtered}
        loading={loading}
        rowKey={(t) => t.id}
        emptyState={<EmptyState title="No transactions found" description="No transactions match your current filter." />}
      />

      <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} onPageChange={setPage} />
    </div>
  );
}
