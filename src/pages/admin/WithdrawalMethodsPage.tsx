import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { MethodStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';

interface Method {
  id: string;
  name: string;
  asset_symbol: string;
  network: string;
  method_type: string;
  min_withdrawal: number;
  max_withdrawal: number;
  fee: number;
  processing_time: string;
  verification_required: boolean;
  status: string;
  instructions: string;
  fee_type: string;
}

type MethodForm = Omit<Method, 'id'>;

const emptyForm: MethodForm = {
  name: '', asset_symbol: '', network: '', method_type: 'crypto', min_withdrawal: 0,
  max_withdrawal: 0, fee: 0, fee_type: 'fixed', processing_time: '',
  verification_required: true, status: 'active', instructions: '',
};

export default function AdminWithdrawalMethodsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Method | null>(null);
  const [methods, setMethods] = useState<Method[]>([]);
  const [form, setForm] = useState<MethodForm>(emptyForm);

  const loadMethods = useCallback(async () => {
    const { data, error } = await supabase.from('withdrawal_methods').select('*').order('display_order', { ascending: true });
    if (error) {
      toast('Failed to load withdrawal methods from the database.', 'error');
      return;
    }
    setMethods((data as Method[]) || []);
  }, [toast]);

  useEffect(() => { loadMethods(); }, [loadMethods]);

  const openEditor = (method: Method | null) => {
    setEditing(method);
    setForm(method ? {
      name: method.name,
      asset_symbol: method.asset_symbol,
      network: method.network,
      method_type: method.method_type,
      min_withdrawal: method.min_withdrawal,
      max_withdrawal: method.max_withdrawal,
      fee: method.fee,
      fee_type: method.fee_type,
      processing_time: method.processing_time,
      verification_required: method.verification_required,
      status: method.status,
      instructions: method.instructions,
    } : emptyForm);
    setEditOpen(true);
  };

  const saveMethod = async () => {
    if (!form.name.trim() || !form.asset_symbol.trim()) { toast('Method name and asset symbol are required.', 'error'); return; }
    const payload = { ...form, name: form.name.trim(), asset_symbol: form.asset_symbol.trim().toUpperCase() };
    const result = editing
      ? await supabase.from('withdrawal_methods').update(payload).eq('id', editing.id)
      : await supabase.from('withdrawal_methods').insert(payload);
    if (result.error) { toast(`Failed to save withdrawal method: ${result.error.message}`, 'error'); return; }
    toast('Withdrawal method saved.', 'success');
    setEditOpen(false);
    await loadMethods();
  };

  const toggleMethod = async (method: Method) => {
    const status = method.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('withdrawal_methods').update({ status }).eq('id', method.id);
    if (error) { toast(`Failed to update method status: ${error.message}`, 'error'); return; }
    await loadMethods();
  };

  const pageRows = methods.slice((page - 1) * 10, page * 10);

  return (
    <div>
      <PageHeader title="Withdrawal Methods" subtitle={`${methods.length} methods configured`} actions={<Button size="sm" onClick={() => openEditor(null)}>Add Method</Button>} />

      <Table
        columns={[
          { key: 'name', header: 'Method Name', render: (m) => <span className="text-sm font-medium text-surface-900">{m.name}</span> },
          { key: 'asset', header: 'Asset', render: (m) => <span className="text-sm text-surface-700">{m.asset_symbol}</span> },
          { key: 'network', header: 'Network', render: (m) => <span className="text-sm text-surface-600 hidden md:table-cell">{m.network || '—'}</span> },
          { key: 'min', header: 'Min', align: 'right', render: (m) => <span className="text-sm num text-surface-700">{m.min_withdrawal} {m.asset_symbol}</span> },
          { key: 'fee', header: 'Fee', align: 'right', render: (m) => <span className="text-sm num text-surface-700">{m.fee} {m.asset_symbol}</span> },
          { key: 'verification', header: 'Verification', align: 'center', render: (m) => <span className={`text-xs ${m.verification_required ? 'text-positive' : 'text-surface-400'}`}>{m.verification_required ? 'Required' : 'Not Required'}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (m) => <MethodStatusBadge status={m.status as 'active' | 'inactive'} /> },
          { key: 'actions', header: '', align: 'right', render: (m) => (
            <div className="flex items-center gap-1">
              <button onClick={() => openEditor(m)} className="text-sm text-brand-700 hover:text-brand-800 px-2 py-1">Edit</button>
              <button onClick={() => toggleMethod(m)} className="text-sm text-surface-500 hover:text-surface-700 px-2 py-1">{m.status === 'active' ? 'Disable' : 'Enable'}</button>
            </div>
          ) },
        ]}
        data={pageRows}
        rowKey={(m) => m.id}
        emptyState={<EmptyState title="No withdrawal methods" description="Add withdrawal methods for users to withdraw funds." />}
      />

      <Pagination page={page} totalPages={Math.max(1, Math.ceil(methods.length / 10))} onPageChange={setPage} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editing ? `Edit ${editing.name}` : 'Add Withdrawal Method'} size="lg"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveMethod}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Method Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Asset / Currency" value={form.asset_symbol} onChange={e => setForm({ ...form, asset_symbol: e.target.value })} />
            <Input label="Network" value={form.network} onChange={e => setForm({ ...form, network: e.target.value })} />
            <Input label="Minimum Withdrawal" type="number" value={form.min_withdrawal} onChange={e => setForm({ ...form, min_withdrawal: Number(e.target.value) })} />
            <Input label="Maximum Withdrawal" type="number" value={form.max_withdrawal} onChange={e => setForm({ ...form, max_withdrawal: Number(e.target.value) })} />
            <Input label="Fee" type="number" step="0.0001" value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} />
            <Input label="Processing Time" value={form.processing_time} onChange={e => setForm({ ...form, processing_time: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Method Type</label><select value={form.method_type} onChange={e => setForm({ ...form, method_type: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm"><option value="crypto">crypto</option><option value="bank_transfer">bank transfer</option><option value="other">other</option></select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Fee Type</label><select value={form.fee_type} onChange={e => setForm({ ...form, fee_type: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm"><option value="fixed">fixed</option><option value="percentage">percentage</option></select></div>
          </div>
          <label className="flex items-center gap-2 text-sm text-surface-700"><input type="checkbox" checked={form.verification_required} onChange={e => setForm({ ...form, verification_required: e.target.checked })} className="w-4 h-4 rounded border-surface-300 text-brand-700" />Verification Required</label>
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Instructions</label><textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={3} className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Withdrawal instructions for users..." /></div>
        </div>
      </Modal>
    </div>
  );
}
