import { useEffect, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge } from '@/components/ui/Badge';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string; name: string; email: string; role: string; status: 'active' | 'pending_verification' | 'restricted' | 'suspended' | 'closed'; created: string;
}

export default function AdminAdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('profiles').select('id, full_name, email, admin_role, account_status, created_at').eq('is_admin', true).order('created_at', { ascending: true })
      .then(({ data }) => {
        setAdmins((data || []).map(row => ({
          id: row.id,
          name: row.full_name || row.email || 'Unknown admin',
          email: row.email,
          role: row.admin_role || 'Role not assigned',
          status: row.account_status,
          created: row.created_at,
        })));
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <PageHeader title="Admin Users" subtitle={`${admins.length} admin accounts from profiles`} />
      <p className="text-xs text-surface-500 mb-4">New admin provisioning and role-based permissions require a server-side auth administration workflow, which is not configured.</p>

      <Table
        columns={[
          { key: 'name', header: 'Name', render: (a) => (
            <div className="flex items-center gap-3">
              <Avatar name={a.name} size="sm" />
              <div><p className="text-sm font-medium text-surface-900">{a.name}</p><p className="text-xs text-surface-500">{a.email}</p></div>
            </div>
          ) },
          { key: 'role', header: 'Role', render: (a) => <span className="text-sm font-medium text-surface-700">{a.role.replace(/_/g, ' ')}</span> },
          { key: 'created', header: 'Created', render: (a) => <span className="text-xs text-surface-500">{new Date(a.created).toLocaleDateString()}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (a) => <AccountStatusBadge status={a.status} /> },
        ]}
        data={admins}
        loading={loading}
        rowKey={(a) => a.id}
        emptyState={<EmptyState title="No admin users" description="Add admin users to manage the platform." />}
      />
    </div>
  );
}
