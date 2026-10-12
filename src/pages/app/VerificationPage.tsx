import { useEffect, useState } from 'react';
import { ShieldCheck, Upload, Check, Clock, Info } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerificationBadge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';

const stages = [
  { key: 'basic_info', label: 'Basic Information', desc: 'Personal details and contact information' },
  { key: 'identity', label: 'Identity Verification', desc: 'Government-issued photo ID' },
  { key: 'address', label: 'Address Verification', desc: 'Proof of residence document' },
  { key: 'review', label: 'Review', desc: 'Compliance review by our team' },
];

export default function VerificationPage() {
  const { profile, session } = useAuth();
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState(0);
  const [formData, setFormData] = useState({ fullName: '', dob: '', address: '', city: '', postalCode: '', country: '' });
  const [records, setRecords] = useState<Array<{ id: string; stage: string; status: string; submitted_at: string | null; rejection_reason: string | null; data: Record<string, string> | null }>>([]);
  const [saving, setSaving] = useState(false);

  const loadRecords = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase.from('verification_records').select('id, stage, status, submitted_at, rejection_reason, data').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const loadedRecords = data || [];
    setRecords(loadedRecords);
    const basic = loadedRecords.find(record => record.stage === 'basic_info');
    const basicData = basic?.data;
    if (basicData) {
      setFormData(current => ({ ...current, ...basicData }));
    }
    if (profile?.verification_level === 'basic' && currentStage === 0) setCurrentStage(1);
  };

  useEffect(() => {
    setFormData(current => ({ ...current, fullName: profile?.full_name || '', country: profile?.country || '' }));
  }, [profile?.full_name, profile?.country]);

  useEffect(() => { loadRecords(); }, [session?.user?.id]);

  const submitBasicInfo = async () => {
    if (!session?.user?.id || !formData.fullName.trim() || !formData.dob || !formData.address.trim() || !formData.city.trim() || !formData.country.trim()) {
      toast('Complete all required personal information fields.', 'error');
      return;
    }
    setSaving(true);
    const existing = records.find(record => record.stage === 'basic_info' && ['pending', 'submitted', 'rejected'].includes(record.status));
    const payload = {
      user_id: session.user.id,
      stage: 'basic_info',
      status: 'submitted',
      data: formData,
      submitted_at: new Date().toISOString(),
      rejection_reason: null,
    };
    const result = existing
      ? await supabase.from('verification_records').update(payload).eq('id', existing.id)
      : await supabase.from('verification_records').insert(payload);
    setSaving(false);
    if (result.error) { toast(`Failed to submit verification information: ${result.error.message}`, 'error'); return; }
    toast('Basic verification information submitted.', 'success');
    setCurrentStage(1);
    await loadRecords();
  };

  const completedStage = (stage: string) => profile?.verification_level === 'verified' || records.some(record => record.stage === stage && record.status === 'approved');

  return (
    <div>
      <PageHeader title="Verification Center" subtitle="Complete identity verification to unlock all platform features." />

      <div className="mb-6 flex items-center gap-3 p-4 bg-white border border-surface-200 rounded-lg">
        <ShieldCheck className="w-6 h-6 text-brand-700" />
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-900">Current Status: {profile && <VerificationBadge level={profile.verification_level} />}</p>
          <p className="text-xs text-surface-500 mt-0.5">Verification is required for deposits, withdrawals, and trading.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-surface-900 mb-4">Verification Stages</h3>
          <div className="space-y-3">
            {stages.map((stage, i) => {
              const isCompleted = i < 3 && completedStage(stage.key);
              const isCurrent = i === currentStage && !isCompleted;
              return (
                <button key={stage.key} onClick={() => setCurrentStage(i)} className={classNames('w-full text-left p-3 rounded border transition-colors', isCurrent ? 'border-brand-500 bg-brand-50' : isCompleted ? 'border-positive/30 bg-positive-light/30' : 'border-surface-200 hover:bg-surface-50')}>
                  <div className="flex items-center gap-3">
                    <div className={classNames('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0', isCompleted ? 'bg-positive text-white' : isCurrent ? 'bg-brand-700 text-white' : 'bg-surface-200 text-surface-500')}>
                      {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{stage.label}</p>
                      <p className="text-xs text-surface-500">{stage.desc}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-2">
          {currentStage === 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Full Legal Name" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
                  <Input label="Date of Birth" type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} />
                </div>
                <Input label="Residential Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Street address" />
                <div className="grid sm:grid-cols-3 gap-4">
                  <Input label="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                  <Input label="Postal Code" value={formData.postalCode} onChange={e => setFormData({ ...formData, postalCode: e.target.value })} />
                  <Input label="Country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                </div>
                <Button loading={saving} onClick={submitBasicInfo}>Submit Basic Information</Button>
              </div>
            </Card>
          )}

          {currentStage === 1 && (
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-4">Identity Verification</h3>
              <p className="text-sm text-surface-600 mb-4">A government-issued photo ID is required for this stage.</p>
              <div className="border-2 border-dashed border-surface-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                <p className="text-sm text-surface-600">Document uploads are not configured.</p>
                <p className="text-xs text-surface-400 mt-1">No file was uploaded or submitted.</p>
              </div>
              <div className="flex items-start gap-2 p-3 bg-info-light/50 rounded mt-4">
                <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <p className="text-xs text-surface-600">This project has no configured document storage or KYC provider, so this stage cannot be submitted yet.</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setCurrentStage(0)}>Back</Button>
                <Button disabled>Submit unavailable</Button>
              </div>
            </Card>
          )}

          {currentStage === 2 && (
            <Card>
              <h3 className="text-sm font-semibold text-surface-900 mb-4">Address Verification</h3>
              <p className="text-sm text-surface-600 mb-4">A recent proof-of-address document is required for this stage.</p>
              <div className="border-2 border-dashed border-surface-300 rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 text-surface-400 mx-auto mb-2" />
                <p className="text-sm text-surface-600">Document uploads are not configured.</p>
                <p className="text-xs text-surface-400 mt-1">No file was uploaded or submitted.</p>
              </div>
              <p className="mt-4 text-xs text-surface-600">This stage cannot be submitted until document storage and review are configured.</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={() => setCurrentStage(1)}>Back</Button>
                <Button disabled>Submit unavailable</Button>
              </div>
            </Card>
          )}

          {currentStage === 3 && (
            <Card>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-pending-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-pending" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">Verification Records</h3>
                {records.length === 0 ? (
                  <p className="text-sm text-surface-600 max-w-md mx-auto mb-6">No verification submissions are recorded for this account.</p>
                ) : (
                  <div className="max-w-md mx-auto space-y-2 text-left">
                    {records.map(record => (
                      <div key={record.id} className="p-3 border border-surface-200 rounded">
                        <p className="text-sm font-medium capitalize">{record.stage.replace(/_/g, ' ')} · {record.status}</p>
                        <p className="text-xs text-surface-500">{record.submitted_at ? new Date(record.submitted_at).toLocaleString() : 'Not submitted'}</p>
                        {record.rejection_reason && <p className="mt-1 text-xs text-negative">{record.rejection_reason}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
