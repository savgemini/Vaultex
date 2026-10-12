import { useEffect, useState } from 'react';
import { Gift, Copy, Users, TrendingUp, Award } from 'lucide-react';
import { Card, PageHeader, StatCard, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Referral {
  id: string;
  referred_id: string;
  code: string;
  bonus: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
}

export default function RewardsPage() {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}` : '';

  useEffect(() => {
    const loadReferrals = async () => {
      if (!session?.user?.id) { setLoading(false); return; }
      const { data } = await supabase.from('referrals').select('id, referred_id, code, bonus, status, created_at').eq('referrer_id', session.user.id).order('created_at', { ascending: false });
      setReferrals((data || []) as Referral[]);
      setLoading(false);
    };

    loadReferrals();
  }, [session?.user?.id]);

  const copyCode = () => {
    if (!referralCode) { toast('A referral code is not assigned to this account.', 'error'); return; }
    navigator.clipboard.writeText(referralCode);
    toast('Referral code copied.', 'success');
  };
  const copyLink = () => {
    if (!referralLink) { toast('A referral link is not available for this account.', 'error'); return; }
    navigator.clipboard.writeText(referralLink);
    toast('Referral link copied.', 'success');
  };

  const completedReferrals = referrals.filter(referral => referral.status === 'completed');
  const pendingReferrals = referrals.filter(referral => referral.status === 'pending');
  const earnedRewards = completedReferrals.reduce((sum, referral) => sum + Number(referral.bonus), 0);
  const pendingRewards = pendingReferrals.reduce((sum, referral) => sum + Number(referral.bonus), 0);

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Rewards & Referrals" subtitle="Earn rewards by referring friends to the platform." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Referrals" value={referrals.length.toString()} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Completed Referrals" value={completedReferrals.length.toString()} />
        <StatCard label="Total Rewards Earned" value={formatCurrency(earnedRewards)} />
        <StatCard label="Pending Rewards" value={formatCurrency(pendingRewards)} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center"><Gift className="w-5 h-5 text-brand-700 dark:text-brand-400" /></div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-white">Referral Program</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">Referral rewards are shown only when they are recorded on your referral entries.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Your Referral Code</label>
              <div className="flex gap-2">
                <input readOnly value={referralCode || 'No referral code assigned'} className="flex-1 h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm font-mono" />
                <Button variant="outline" size="md" icon={<Copy className="w-4 h-4" />} onClick={copyCode}>Copy</Button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1">Your Referral Link</label>
              <div className="flex gap-2">
                <input readOnly value={referralLink || 'No referral link available'} className="flex-1 h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-sm font-mono text-xs" />
                <Button variant="outline" size="md" icon={<Copy className="w-4 h-4" />} onClick={copyLink}>Copy</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold text-surface-900 dark:text-white mb-4">How It Works</h3>
          <div className="space-y-4">
            {[
              { icon: Users, title: 'Share your link', desc: 'Send your referral link to friends and family.' },
              { icon: TrendingUp, title: 'They sign up', desc: 'Your friend creates an account using your link.' },
              { icon: Award, title: 'Recorded rewards', desc: 'Completed referral rewards appear in your account history.' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400 rounded-full flex items-center justify-center shrink-0"><Icon className="w-4 h-4" /></div>
                  <div><p className="text-sm font-medium text-surface-900 dark:text-white">{s.title}</p><p className="text-xs text-surface-500 dark:text-surface-400">{s.desc}</p></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800"><h3 className="text-sm font-semibold text-surface-900 dark:text-white">Your Referrals</h3></div>
        {loading ? (
          <div className="p-6 text-center text-sm text-surface-500">Loading referrals...</div>
        ) : referrals.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8" />} title="No referrals yet" description="Share your referral link to start earning rewards." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead><tr className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-800">
                <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Referred Account</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left hidden md:table-cell">Referral Code</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Status</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Bonus</th>
                <th className="px-5 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right hidden lg:table-cell">Date</th>
              </tr></thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {referrals.map(r => (
                  <tr key={r.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                    <td className="px-5 py-3 text-sm font-medium text-surface-900 dark:text-white">{r.referred_id}</td>
                    <td className="px-5 py-3 text-sm text-surface-500 dark:text-surface-400 hidden md:table-cell">{r.code}</td>
                    <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded ${r.status === 'completed' ? 'bg-positive-light text-positive-dark' : 'bg-pending-light text-pending-dark'}`}>{r.status}</span></td>
                    <td className="px-5 py-3 text-right text-sm num text-surface-900 dark:text-white">{Number(r.bonus) > 0 ? `+${r.bonus}` : '—'}</td>
                    <td className="px-5 py-3 text-right text-sm text-surface-500 dark:text-surface-400 hidden lg:table-cell">{new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
