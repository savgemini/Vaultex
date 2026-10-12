import { useState, useEffect } from 'react';
import { Receipt, Search, Filter } from 'lucide-react';
import { Card, PageHeader, EmptyState, Tabs } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Search as SearchInput, Dropdown } from '@/components/ui/Dropdown';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatDateTime, classNames } from '@/lib/format';
import type { Transaction, TransactionType } from '@/types';

const typeTabs = [
  { key: 'all', label: 'All' },
  { key: 'deposit', label: 'Deposits' },
  { key: 'withdrawal', label: 'Withdrawals' },
  { key: 'trade', label: 'Trades' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'investment', label: 'Investments' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

export default function TransactionsPage() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from('transactions').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      setTransactions((data as Transaction[]) || []);
      setLoading(false);
    })();
  }, [session]);

  let filtered = transactions;
  if (search) filtered = filtered.filter(t => t.asset_symbol.toLowerCase().includes(search.toLowerCase()) || t.reference.toLowerCase().includes(search.toLowerCase()));
  if (tab !== 'all') filtered = filtered.filter(t => t.type === tab || (tab === 'trade' && (t.type === 'buy' || t.type === 'sell')));
  if (statusFilter !== 'all') filtered = filtered.filter(t => t.status === statusFilter);

  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <PageHeader title="Transaction History" subtitle="View and filter all your account transactions." />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by asset or reference..." className="flex-1" />
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 pl-9 pr-8 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
        </div>
      </div>

      <div className="mb-4"><Tabs tabs={typeTabs} active={tab} onChange={(k) => { setTab(k); setPage(1); }} /></div>

      <Table<Transaction>
        columns={[
          { key: 'created_at', header: 'Date', render: (t) => <span className="text-sm text-surface-600">{formatDateTime(t.created_at)}</span> },
          { key: 'type', header: 'Type', render: (t) => <span className="text-sm font-medium text-surface-900 capitalize">{t.type.replace('_', ' ')}</span> },
          { key: 'asset_symbol', header: 'Asset', render: (t) => <span className="text-sm text-surface-700">{t.asset_symbol}</span> },
          { key: 'amount', header: 'Amount', align: 'right', render: (t) => <span className="text-sm num text-surface-900">{Number(t.amount).toFixed(4)}</span> },
          { key: 'fee', header: 'Fee', align: 'right', render: (t) => <span className="text-sm num text-surface-500">{Number(t.fee).toFixed(4)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (t) => <StatusBadge status={t.status} /> },
          { key: 'reference', header: 'Reference', render: (t) => <span className="text-xs font-mono text-surface-500">{t.reference}</span> },
        ]}
        data={paged}
        loading={loading}
        onRowClick={setSelected}
        rowKey={(t) => t.id}
        emptyState={<EmptyState icon={<Receipt className="w-8 h-8" />} title="No transactions found" description="Your deposit, withdrawal, and trading activity will appear here." />}
      />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Transaction Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Type</span><span className="text-sm font-medium text-surface-900 dark:text-white capitalize">{selected.type.replace('_', ' ')}</span></div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Asset</span><span className="text-sm font-medium text-surface-900 dark:text-white">{selected.asset_symbol}</span></div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Amount</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{Number(selected.amount).toFixed(8)}</span></div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Fee</span><span className="text-sm font-medium num text-surface-900 dark:text-white">{Number(selected.fee).toFixed(8)}</span></div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Status</span><StatusBadge status={selected.status} /></div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Reference</span><span className="text-xs font-mono text-surface-700 dark:text-surface-300">{selected.reference}</span></div>
            <div className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800"><span className="text-sm text-surface-500 dark:text-surface-400">Date</span><span className="text-sm text-surface-700 dark:text-surface-300">{formatDateTime(selected.created_at)}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
