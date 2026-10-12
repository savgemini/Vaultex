import { useEffect, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Search as SearchInput } from '@/components/ui/Dropdown';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface LogEntry {
  id: string; admin: string; action: string; entity: string; entityId: string; ip: string; reason: string; date: string;
}

interface AuditRow {
  id: string; admin_id: string; action: string; target_user_id: string | null; target_entity: string; reason: string; ip_address: string | null; created_at: string;
}

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      const { data } = await supabase.from('audit_logs').select('id, admin_id, action, target_user_id, target_entity, reason, ip_address, created_at').order('created_at', { ascending: false }).limit(500);
      const rows = (data || []) as AuditRow[];
      const adminIds = Array.from(new Set(rows.map(row => row.admin_id)));
      const { data: profiles } = adminIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', adminIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map(profile => [profile.id, profile.full_name || profile.email || profile.id]));
      setLogs(rows.map(row => ({
        id: row.id,
        admin: profileMap.get(row.admin_id) || row.admin_id,
        action: row.action,
        entity: row.target_entity,
        entityId: row.target_user_id || row.target_entity,
        ip: row.ip_address || '—',
        reason: row.reason || '—',
        date: row.created_at,
      })));
      setLoading(false);
    };

    loadLogs();
  }, []);

  const filtered = logs.filter(log => !search || [log.admin, log.action, log.entityId, log.reason].some(value => value.toLowerCase().includes(search.toLowerCase())));
  const pageRows = filtered.slice((page - 1) * 10, page * 10);

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle={`${logs.length} records from the audit log`} />

      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search by admin, action, or entity ID..." className="max-w-md" /></div>

      <Table
        columns={[
          { key: 'date', header: 'Timestamp', render: (l) => <span className="text-xs text-surface-500">{formatDateTime(l.date)}</span> },
          { key: 'admin', header: 'Admin', render: (l) => <span className="text-sm font-medium text-surface-900">{l.admin}</span> },
          { key: 'action', header: 'Action', render: (l) => <span className="text-sm font-mono text-surface-700">{l.action}</span> },
          { key: 'entity', header: 'Entity', render: (l) => <span className="text-sm text-surface-600">{l.entity || '—'}</span> },
          { key: 'entityId', header: 'Entity ID', render: (l) => <span className="text-xs font-mono text-surface-500">{l.entityId}</span> },
          { key: 'reason', header: 'Reason', render: (l) => <span className="text-sm text-surface-600">{l.reason}</span> },
          { key: 'ip', header: 'IP Address', render: (l) => <span className="text-xs font-mono text-surface-500 hidden md:table-cell">{l.ip}</span> },
        ]}
        data={pageRows}
        rowKey={(l) => l.id}
        emptyState={<EmptyState title="No audit logs found" description="No logs match your current filters." />}
      />

      {!loading && <Pagination page={page} totalPages={Math.max(1, Math.ceil(filtered.length / 10))} onPageChange={setPage} />}
    </div>
  );
}
