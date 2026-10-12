import { useEffect, useState } from 'react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { VerificationBadge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/context/ToastContext';

interface Verification {
  id: string; user_id: string; user: string; email: string; stage: string; status: string; submitted: string; level: string;
}

interface VerificationRow { id: string; user_id: string; stage: string; status: string; submitted_at: string | null; created_at: string; }

export default function AdminVerificationPage() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);

  const loadVerifications = async () => {
    const { data } = await supabase.from('verification_records').select('id, user_id, stage, status, submitted_at, created_at').order('created_at', { ascending: false });
    const rows = (data || []) as VerificationRow[];
    const userIds = Array.from(new Set(rows.map(row => row.user_id)));
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id, full_name, email, verification_level').in('id', userIds)
      : { data: [] };
    const profileMap = new Map((profiles || []).map(profile => [profile.id, profile]));
    setVerifications(rows.map(row => {
      const profile = profileMap.get(row.user_id);
      return {
        id: row.id,
        user_id: row.user_id,
        user: profile?.full_name || profile?.email || row.user_id,
        email: profile?.email || '',
        stage: row.stage,
        status: row.status,
        submitted: row.submitted_at || row.created_at,
        level: profile?.verification_level || 'unverified',
      };
    }));
  };

  useEffect(() => { loadVerifications(); }, []);

  const review = async (verification: Verification, approved: boolean) => {
    const status = approved ? 'approved' : 'rejected';
    const { error } = await supabase.from('verification_records').update({ status, stage: approved ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', verification.id);
    if (error) { toast(`Failed to update verification: ${error.message}`, 'error'); return; }

    const verificationLevel = approved ? verification.stage === 'basic_info' ? 'basic' : 'verified' : 'rejected';
    const { error: profileError } = await supabase.from('profiles').update({ verification_level: verificationLevel }).eq('id', verification.user_id);
    if (profileError) { toast(`Verification record updated, but profile status failed: ${profileError.message}`, 'error'); }
    else { toast(`Verification ${status}.`, 'success'); }
    await loadVerifications();
  };

  const pendingVerifications = verifications.filter(verification => ['pending', 'submitted'].includes(verification.status));

  return (
    <div>
      <PageHeader title="Verification Management" subtitle={`${pendingVerifications.length} pending verification requests`} />

      <Table
        columns={[
          { key: 'user', header: 'User', render: (v) => <span className="text-sm font-medium text-surface-900">{v.user}</span> },
          { key: 'email', header: 'Email', render: (v) => <span className="text-sm text-surface-600">{v.email}</span> },
          { key: 'stage', header: 'Stage', render: (v) => <span className="text-sm text-surface-700 capitalize">{v.stage.replace('_', ' ')}</span> },
          { key: 'level', header: 'Current Level', align: 'center', render: (v) => <VerificationBadge level={v.level as 'unverified' | 'basic' | 'verified' | 'rejected'} /> },
          { key: 'status', header: 'Status', align: 'center', render: (v) => <span className={`text-xs px-2 py-0.5 rounded font-medium ${v.status === 'submitted' ? 'bg-info-light text-info-dark' : 'bg-pending-light text-pending-dark'}`}>{v.status}</span> },
          { key: 'submitted', header: 'Submitted', render: (v) => <span className="text-xs text-surface-500">{formatDateTime(v.submitted)}</span> },
          { key: 'actions', header: '', align: 'right', render: (v) => (
            <div className="flex items-center gap-1">
              <button onClick={() => review(v, true)} disabled={!['pending', 'submitted'].includes(v.status)} className="text-sm text-positive hover:text-positive-dark px-2 py-1 disabled:opacity-40">Approve</button>
              <button onClick={() => review(v, false)} disabled={!['pending', 'submitted'].includes(v.status)} className="text-sm text-negative hover:text-negative-dark px-2 py-1 disabled:opacity-40">Reject</button>
            </div>
          ) },
        ]}
        data={verifications}
        rowKey={(v) => v.id}
        emptyState={<EmptyState title="No verification records" description="Verification requests will appear here after users submit them." />}
      />
    </div>
  );
}
