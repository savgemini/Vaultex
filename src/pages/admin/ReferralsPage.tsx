import { useEffect, useState } from 'react';
import { Card, PageHeader, StatCard, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { formatCurrency, formatDate } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface ReferralRow {
  id: string; referrer_id: string; referred_id: string; code: string; bonus: number; status: string; created_at: string;
}

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<Array<{ id: string; referrer: string; referred: string; code: string; bonus: number; status: string; date: string }>>([]);

  useEffect(() => {
    const loadReferrals = async () => {
      const { data } = await supabase.from('referrals').select('id, referrer_id, referred_id, code, bonus, status, created_at').order('created_at', { ascending: false });
      const rows = (data || []) as ReferralRow[];
      const userIds = Array.from(new Set(rows.flatMap(row => [row.referrer_id, row.referred_id])));
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map(profile => [profile.id, profile.full_name || profile.email || profile.id]));
      setReferrals(rows.map(row => ({
        id: row.id,
        referrer: profileMap.get(row.referrer_id) || row.referrer_id,
        referred: profileMap.get(row.referred_id) || row.referred_id,
        code: row.code,
        bonus: Number(row.bonus),
        status: row.status,
        date: row.created_at,
      })));
    };

    loadReferrals();
  }, []);

  const completedCount = referrals.filter(referral => referral.status === 'completed').length;
  const pendingCount = referrals.filter(referral => referral.status === 'pending').length;
  const paidRewards = referrals.filter(referral => referral.status === 'completed').reduce((sum, referral) => sum + referral.bonus, 0);

  return (
    <div>
      <PageHeader title="Referrals" subtitle="Platform referral program overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Referrals" value={referrals.length.toLocaleString()} />
        <StatCard label="Completed" value={completedCount.toLocaleString()} />
        <StatCard label="Pending" value={pendingCount.toLocaleString()} />
        <StatCard label="Total Rewards Paid" value={formatCurrency(paidRewards)} />
      </div>

      <Table
        columns={[
          { key: 'referrer', header: 'Referrer', render: (r) => <span className="text-sm font-medium text-surface-900">{r.referrer}</span> },
          { key: 'referred', header: 'Referred User', render: (r) => <span className="text-sm text-surface-700">{r.referred}</span> },
          { key: 'code', header: 'Code', render: (r) => <span className="text-xs font-mono text-surface-500">{r.code}</span> },
          { key: 'bonus', header: 'Bonus', align: 'right', render: (r) => <span className="text-sm num text-surface-900">{r.bonus > 0 ? `$${r.bonus}` : '—'}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (r) => <span className={`text-xs px-2 py-0.5 rounded font-medium ${r.status === 'completed' ? 'bg-positive-light text-positive-dark' : 'bg-pending-light text-pending-dark'}`}>{r.status}</span> },
          { key: 'date', header: 'Date', render: (r) => <span className="text-xs text-surface-500">{formatDate(r.date)}</span> },
        ]}
        data={referrals}
        rowKey={(r) => r.id}
        emptyState={<EmptyState title="No referrals" description="No referral activity yet." />}
      />
    </div>
  );
}
