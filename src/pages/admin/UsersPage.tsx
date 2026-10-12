import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Eye } from 'lucide-react';
import { Card, PageHeader, Tabs, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Search as SearchInput, Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { AccountStatusBadge, VerificationBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string; name: string; email: string; country: string; verification: string;
  status: 'active' | 'pending_verification' | 'restricted' | 'suspended' | 'closed'; balance: number; created: string;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      const [profileResult, balanceResult, assetResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, country, verification_level, account_status, created_at').eq('is_demo', false).order('created_at', { ascending: false }),
        supabase.from('balances').select('user_id, asset_id, available, invested, pending'),
        supabase.from('assets').select('id, current_price'),
      ]);

      if (profileResult.error || balanceResult.error || assetResult.error) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const priceMap = new Map((assetResult.data || []).map(asset => [asset.id, Number(asset.current_price)]));
      const balanceMap = new Map<string, number>();
      (balanceResult.data || []).forEach(balance => {
        const value = (Number(balance.available) + Number(balance.invested) + Number(balance.pending)) * (priceMap.get(balance.asset_id) || 0);
        balanceMap.set(balance.user_id, (balanceMap.get(balance.user_id) || 0) + value);
      });

      const mapped = (profileResult.data || []).map(row => ({
        id: row.id,
        name: row.full_name || row.email || 'Unknown User',
        email: row.email,
        country: row.country || 'Unknown',
        verification: row.verification_level || 'unverified',
        status: row.account_status || 'pending_verification',
        balance: balanceMap.get(row.id) || 0,
        created: row.created_at ? String(row.created_at).slice(0, 10) : '',
      })) as AdminUser[];

      setUsers(mapped);
      setLoading(false);
    };

    loadUsers();
  }, []);

  let filtered = users;
  if (search) filtered = filtered.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search));
  if (tab !== 'all') {
    if (tab === 'verified') filtered = filtered.filter(u => u.verification === 'verified');
    else if (tab === 'unverified') filtered = filtered.filter(u => u.verification !== 'verified');
    else filtered = filtered.filter(u => u.status === tab);
  }
  const pageRows = filtered.slice((page - 1) * 10, page * 10);

  return (
    <div>
      <PageHeader title="User Management" subtitle={`${users.length} total users on the platform`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, or user ID..." className="flex-1" />
      </div>

      <div className="mb-4">
        <Tabs tabs={[
          { key: 'all', label: 'All', count: users.length },
          { key: 'active', label: 'Active' },
          { key: 'pending_verification', label: 'Pending' },
          { key: 'restricted', label: 'Restricted' },
          { key: 'suspended', label: 'Suspended' },
          { key: 'verified', label: 'Verified' },
          { key: 'unverified', label: 'Unverified' },
        ]} active={tab} onChange={(k) => { setTab(k); setPage(1); }} />
      </div>

      <Table<AdminUser>
        columns={[
          { key: 'id', header: 'User ID', render: (u) => <span className="text-xs font-mono text-surface-500">{u.id}</span> },
          { key: 'name', header: 'Name', render: (u) => <Link to={`/admin/users/${u.id}`} className="text-sm font-medium text-brand-700 hover:text-brand-800">{u.name}</Link> },
          { key: 'email', header: 'Email', render: (u) => <span className="text-sm text-surface-600">{u.email}</span> },
          { key: 'country', header: 'Country', render: (u) => <span className="text-sm text-surface-600 hidden lg:table-cell">{u.country}</span> },
          { key: 'verification', header: 'Verification', render: (u) => <VerificationBadge level={u.verification as 'unverified' | 'basic' | 'verified' | 'rejected'} /> },
          { key: 'balance', header: 'Balance', align: 'right', render: (u) => <span className="text-sm num font-medium text-surface-900">{formatCurrency(u.balance)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (u) => <AccountStatusBadge status={u.status as 'active' | 'pending_verification' | 'restricted' | 'suspended'} /> },
          { key: 'created', header: 'Created', render: (u) => <span className="text-xs text-surface-500 hidden md:table-cell">{formatDate(u.created)}</span> },
          { key: 'actions', header: '', align: 'right', render: (u) => (
            <Dropdown trigger={<button className="p-1.5 hover:bg-surface-100 rounded"><MoreVertical className="w-4 h-4 text-surface-400" /></button>}>
              <DropdownItem icon={<Eye className="w-4 h-4" />} onClick={() => window.location.href = `/admin/users/${u.id}`}>View Account</DropdownItem>
            </Dropdown>
          ) },
        ]}
        data={pageRows}
        loading={loading}
        rowKey={(u) => u.id}
        onRowClick={(u) => window.location.href = `/admin/users/${u.id}`}
        emptyState={<EmptyState title="No users found" description="No users match your current filters." />}
      />

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />
    </div>
  );
}
