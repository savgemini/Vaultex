import { useEffect, useState } from 'react';
import { Shield, Smartphone, Key, LogOut } from 'lucide-react';
import { Card, PageHeader, Tabs } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AccountStatusBadge, VerificationBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { timeAgo } from '@/lib/format';

export default function SettingsPage() {
  const { profile, session, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ full_name: '', country: '', phone: '', preferred_currency: 'USD', timezone: 'UTC' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [securityEvents, setSecurityEvents] = useState<Array<{ id: string; event_type: string; ip_address: string | null; created_at: string }>>([]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name || '',
      country: profile.country || '',
      phone: profile.phone || '',
      preferred_currency: profile.preferred_currency || 'USD',
      timezone: profile.timezone || 'UTC',
    });
  }, [profile]);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase.from('security_events').select('id, event_type, ip_address, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(10)
      .then(({ data }) => setSecurityEvents(data || []));
  }, [session?.user?.id]);

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, country: form.country, phone: form.phone }).eq('id', profile.id);
    if (error) { toast(`Failed to save profile: ${error.message}`, 'error'); return; }
    await refreshProfile();
    toast('Profile saved.', 'success');
  };

  const savePreferences = async () => {
    if (!profile) return;
    const { error } = await supabase.from('profiles').update({ preferred_currency: form.preferred_currency, timezone: form.timezone }).eq('id', profile.id);
    if (error) { toast(`Failed to save preferences: ${error.message}`, 'error'); return; }
    await refreshProfile();
    toast('Preferences saved.', 'success');
  };

  const changePassword = async () => {
    if (!session?.user?.email || !passwordForm.current || passwordForm.next.length < 8 || passwordForm.next !== passwordForm.confirm) {
      toast('Enter your current password and matching new passwords of at least 8 characters.', 'error');
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: passwordForm.current });
    if (authError) { toast(`Current password could not be verified: ${authError.message}`, 'error'); return; }
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
    if (error) { toast(`Failed to update password: ${error.message}`, 'error'); return; }
    setPasswordForm({ current: '', next: '', confirm: '' });
    toast('Password updated.', 'success');
  };

  const tabs = [
    { key: 'profile', label: 'Profile' },
    { key: 'security', label: 'Security' },
    { key: 'notifications', label: 'Notifications' },
    { key: 'preferences', label: 'Preferences' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'api', label: 'API' },
  ];

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Settings" subtitle="Manage your account, security, and preferences." />

      <div className="mb-6 flex items-center gap-4 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg">
        <Avatar name={profile?.full_name || 'User'} size="lg" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-surface-900 dark:text-white">{profile?.full_name || 'User'}</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">{profile?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            {profile && <AccountStatusBadge status={profile.account_status} />}
            {profile && <VerificationBadge level={profile.verification_level} />}
          </div>
        </div>
      </div>

      <div className="mb-6"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      {tab === 'profile' && (
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Personal Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            <Input label="Email" defaultValue={profile?.email || ''} disabled />
            <Input label="Country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
            <Input label="Phone Number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="mt-4"><Button onClick={saveProfile}>Save Changes</Button></div>
        </Card>
      )}

      {tab === 'security' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <Input label="Current Password" type="password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} placeholder="Enter current password" />
              <Input label="New Password" type="password" value={passwordForm.next} onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })} placeholder="Minimum 8 characters" />
              <Input label="Confirm New Password" type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Re-enter new password" />
              <Button onClick={changePassword}>Update Password</Button>
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center"><Smartphone className="w-5 h-5 text-brand-700 dark:text-brand-400" /></div>
                <div><h3 className="text-sm font-semibold text-surface-900 dark:text-white">Two-Factor Authentication</h3><p className="text-xs text-surface-500 dark:text-surface-400">Add an extra layer of security to your account</p></div>
              </div>
              <span className="text-sm font-medium text-surface-600 dark:text-surface-300">{profile?.two_factor_enabled ? 'Enabled' : 'Not enabled'}</span>
            </div>
            <p className="mt-3 text-xs text-surface-500 dark:text-surface-400">Authenticator enrollment and recovery are not configured in this application.</p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-3">Security Alerts</h3>
            <div className="space-y-2">
              {securityEvents.length === 0 ? <p className="text-sm text-surface-500">No security events have been recorded.</p> : securityEvents.map(e => (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-surface-400 dark:text-surface-500" />
                    <div><p className="text-sm text-surface-700 dark:text-surface-300">{e.event_type.replace(/_/g, ' ')}</p><p className="text-xs text-surface-400 dark:text-surface-500">{e.ip_address || 'IP unavailable'} · {timeAgo(e.created_at)}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'notifications' && (
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Notification Preferences</h3>
          <p className="text-sm text-surface-500 dark:text-surface-400">Per-category notification preferences are not stored in the current database schema.</p>
        </Card>
      )}

      {tab === 'preferences' && (
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Display Preferences</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Preferred Currency</label>
                <select value={form.preferred_currency} onChange={e => setForm({ ...form, preferred_currency: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Timezone</label>
                <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
                <option value="UTC">UTC</option>
                <option value="EST">EST (UTC-5)</option>
                <option value="PST">PST (UTC-8)</option>
                <option value="CET">CET (UTC+1)</option>
                <option value="JST">JST (UTC+9)</option>
              </select>
            </div>
            <Button onClick={savePreferences}>Save Preferences</Button>
          </div>
        </Card>
      )}

      {tab === 'sessions' && (
        <Card>
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-4">Current Session</h3>
          <div className="flex items-center gap-3 p-3 border border-surface-200 dark:border-surface-800 rounded">
            <Smartphone className="w-5 h-5 text-surface-400 dark:text-surface-500" />
            <div>
              <p className="text-sm font-medium text-surface-900 dark:text-white">This browser</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">{session?.expires_at ? `Session expires ${new Date(session.expires_at * 1000).toLocaleString()}` : 'Expiry unavailable'}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-surface-500 dark:text-surface-400">The configured authentication client does not expose a list of other active sessions.</p>
          <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-800">
            <Button variant="danger" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={() => signOut()}>Sign Out</Button>
          </div>
        </Card>
      )}

      {tab === 'api' && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center"><Key className="w-5 h-5 text-brand-700 dark:text-brand-400" /></div>
            <div><h3 className="text-sm font-semibold text-surface-900 dark:text-white">API Settings</h3><p className="text-xs text-surface-500 dark:text-surface-400">Programmatic access to your account (coming soon)</p></div>
          </div>
          <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded text-center">
            <p className="text-sm text-surface-500 dark:text-surface-400">API key management is not yet available. This feature will allow programmatic access to account data and trading functionality.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
