import { useEffect, useState } from 'react';
import { Card, PageHeader, StatCard, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Shield, ShieldCheck, AlertTriangle, Activity } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface SecurityEvent {
  id: string; user_id: string; event_type: string; ip_address: string | null; created_at: string;
}

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<Array<SecurityEvent & { user: string }>>([]);
  const [userCount, setUserCount] = useState(0);
  const [twoFactorCount, setTwoFactorCount] = useState(0);
  const [siteSecurity, setSiteSecurity] = useState<{ require_2fa: boolean; session_duration_hours: number; admin_session_duration_hours: number } | null>(null);

  useEffect(() => {
    const loadSecurityData = async () => {
      const [eventResult, profileResult, settingsResult] = await Promise.all([
        supabase.from('security_events').select('id, user_id, event_type, ip_address, created_at').order('created_at', { ascending: false }).limit(500),
        supabase.from('profiles').select('id, full_name, email, two_factor_enabled'),
        supabase.from('site_settings').select('require_2fa, session_duration_hours, admin_session_duration_hours').maybeSingle(),
      ]);
      const profiles = profileResult.data || [];
      const profileMap = new Map(profiles.map(profile => [profile.id, profile.full_name || profile.email || profile.id]));
      setUserCount(profiles.length);
      setTwoFactorCount(profiles.filter(profile => profile.two_factor_enabled).length);
      setEvents(((eventResult.data || []) as SecurityEvent[]).map(event => ({ ...event, user: profileMap.get(event.user_id) || event.user_id })));
      setSiteSecurity(settingsResult.data);
    };

    loadSecurityData();
  }, []);

  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const events24h = events.filter(event => new Date(event.created_at).getTime() >= since24h);
  const suspiciousEvents = events24h.filter(event => event.event_type === 'suspicious_activity').length;
  const twoFactorPercent = userCount ? Math.round((twoFactorCount / userCount) * 100) : 0;

  return (
    <div>
      <PageHeader title="Security Center" subtitle="Monitor platform security events and threats" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Recorded Events (24h)" value={events24h.length.toLocaleString()} icon={<Activity className="w-5 h-5" />} />
        <StatCard label="Suspicious Activity (24h)" value={suspiciousEvents.toLocaleString()} icon={<AlertTriangle className="w-5 h-5" />} />
        <StatCard label="Failed Logins" value="Not tracked" />
        <StatCard label="2FA Adoption" value={`${twoFactorPercent}%`} subtitle={`${twoFactorCount} of ${userCount} profiles`} icon={<ShieldCheck className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-positive-light rounded-lg flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-positive" /></div>
            <div><h3 className="text-sm font-semibold text-surface-900">Authentication Settings</h3><p className="text-xs text-surface-500">Persisted platform settings</p></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-surface-500">Require 2FA</span><span className="text-surface-700">{siteSecurity ? siteSecurity.require_2fa ? 'Yes' : 'No' : 'Not configured'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">User Session Duration</span><span className="text-surface-700">{siteSecurity ? `${siteSecurity.session_duration_hours} hours` : 'Not configured'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-surface-500">Admin Session Duration</span><span className="text-surface-700">{siteSecurity ? `${siteSecurity.admin_session_duration_hours} hours` : 'Not configured'}</span></div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5 text-brand-700" /></div>
            <div><h3 className="text-sm font-semibold text-surface-900">Security Data Coverage</h3><p className="text-xs text-surface-500">What this application records</p></div>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-surface-600">Failed login attempts, IP allowlists, active session inventories, and infrastructure security checks are not stored in this database.</p>
          </div>
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-surface-900">Recent Security Events</h3>
          <span className="text-xs text-surface-500">Latest {events.length} records</span>
        </div>
        <Table
          columns={[
            { key: 'event_type', header: 'Event', render: (e) => <span className="text-sm font-medium text-surface-900">{e.event_type.replace(/_/g, ' ')}</span> },
            { key: 'user', header: 'User', render: (e) => <span className="text-sm text-surface-600">{e.user}</span> },
            { key: 'ip_address', header: 'IP Address', render: (e) => <span className="text-xs font-mono text-surface-500">{e.ip_address || '—'}</span> },
            { key: 'created_at', header: 'Date', align: 'right', render: (e) => <span className="text-xs text-surface-500">{formatDateTime(e.created_at)}</span> },
          ]}
          data={events}
          rowKey={(e) => e.id}
          emptyState={<EmptyState icon={<Shield className="w-8 h-8" />} title="No security events" description="Security events will appear here." />}
        />
      </Card>
    </div>
  );
}
