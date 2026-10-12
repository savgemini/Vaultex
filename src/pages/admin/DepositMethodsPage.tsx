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
  min_deposit: number;
  max_deposit: number;
  fee: number;
  processing_time: string;
  status: string;
  display_order: number;
  deposit_address: string;
  instructions: string;
}

export default function AdminDepositMethodsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Method | null>(null);
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMethods = useCallback(async () => {
    const { data, error } = await supabase.from('deposit_methods').select('*').order('display_order', { ascending: true });
    if (error) { toast('Failed to load deposit methods.', 'error'); return; }
    setMethods((data as Method[]) || []);
    setLoading(false);
  }, [toast]);

  useEffect(() => { loadMethods(); }, [loadMethods]);

  const handleSave = async () => {
    const name = (document.getElementById('dm-name') as HTMLInputElement)?.value || '';
    const asset = (document.getElementById('dm-asset') as HTMLInputElement)?.value || '';
    const network = (document.getElementById('dm-network') as HTMLInputElement)?.value || '';
    const type = (document.getElementById('dm-type') as HTMLSelectElement)?.value || 'crypto';
    const processing = (document.getElementById('dm-processing') as HTMLInputElement)?.value || '';
    const min = Number((document.getElementById('dm-min') as HTMLInputElement)?.value || 0);
    const max = Number((document.getElementById('dm-max') as HTMLInputElement)?.value || 0);
    const fee = Number((document.getElementById('dm-fee') as HTMLInputElement)?.value || 0);
    const order = Number((document.getElementById('dm-order') as HTMLInputElement)?.value || 1);
    const address = (document.getElementById('dm-address') as HTMLInputElement)?.value || '';
    const instructions = (document.getElementById('dm-instructions') as HTMLTextAreaElement)?.value || '';

    if (editing) {
      const { error } = await supabase.from('deposit_methods').update({
        name, asset_symbol: asset, network, method_type: type, processing_time: processing,
        min_deposit: min, max_deposit: max, fee, display_order: order, deposit_address: address, instructions,
      }).eq('id', editing.id);
      if (error) { toast('Failed to update: ' + error.message, 'error'); return; }
      toast('Deposit method updated.', 'success');
    } else {
      const { error } = await supabase.from('deposit_methods').insert({
        name, asset_symbol: asset, network, method_type: type, processing_time: processing,
        min_deposit: min, max_deposit: max, fee, display_order: order, deposit_address: address, instructions, status: 'active',
      });
      if (error) { toast('Failed to add: ' + error.message, 'error'); return; }
      toast('Deposit method added.', 'success');
    }
    setEditOpen(false);
    loadMethods();
  };

  const toggleStatus = async (m: Method) => {
    const newStatus = m.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('deposit_methods').update({ status: newStatus }).eq('id', m.id);
    if (error) { toast('Failed to update status.', 'error'); return; }
    toast(`${m.name} ${newStatus === 'active' ? 'enabled' : 'disabled'}.`, 'info');
    loadMethods();
  };

  return (
    <div className="bg-surface-50 dark:bg-surface-950 min-h-full">
      <PageHeader title="Deposit Methods" subtitle={`${methods.length} methods configured`} actions={<Button size="sm" onClick={() => { setEditing(null); setEditOpen(true); }}>Add Method</Button>} />

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />)}</div>
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Method Name', render: (m: Method) => <span className="text-sm font-medium text-surface-900 dark:text-white">{m.name}</span> },
            { key: 'asset_symbol', header: 'Asset', render: (m: Method) => <span className="text-sm text-surface-700 dark:text-surface-300">{m.asset_symbol}</span> },
            { key: 'network', header: 'Network', render: (m: Method) => <span className="text-sm text-surface-600 dark:text-surface-400 hidden md:table-cell">{m.network || '—'}</span> },
            { key: 'deposit_address', header: 'Deposit Address', render: (m: Method) => <code className="text-xs font-mono text-surface-500 dark:text-surface-400 hidden lg:table-cell">{m.deposit_address ? m.deposit_address.slice(0, 16) + '...' : '—'}</code> },
            { key: 'min_deposit', header: 'Min', align: 'right', render: (m: Method) => <span className="text-sm num text-surface-700 dark:text-surface-300">{m.min_deposit} {m.asset_symbol}</span> },
            { key: 'processing_time', header: 'Processing', render: (m: Method) => <span className="text-sm text-surface-600 dark:text-surface-400 hidden md:table-cell">{m.processing_time}</span> },
            { key: 'status', header: 'Status', align: 'right', render: (m: Method) => <MethodStatusBadge status={m.status as 'active' | 'inactive'} /> },
            { key: 'actions', header: '', align: 'right', render: (m: Method) => (
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(m); setEditOpen(true); }} className="text-sm text-brand-700 dark:text-brand-400 hover:text-brand-800 px-2 py-1">Edit</button>
                <button onClick={() => toggleStatus(m)} className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 px-2 py-1">{m.status === 'active' ? 'Disable' : 'Enable'}</button>
              </div>
            ) },
          ]}
          data={methods}
          rowKey={(m: Method) => m.id}
          emptyState={<EmptyState title="No deposit methods" description="Add deposit methods for users to fund their accounts." />}
        />
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editing ? `Edit ${editing.name}` : 'Add Deposit Method'} size="lg"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Method Name" defaultValue={editing?.name || ''} id="dm-name" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Currency / Asset" defaultValue={editing?.asset_symbol || ''} id="dm-asset" />
            <Input label="Network" defaultValue={editing?.network || ''} id="dm-network" />
            <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Type</label><select id="dm-type" defaultValue={editing?.method_type || 'crypto'} className="w-full h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"><option>crypto</option><option>bank_transfer</option><option>card</option><option>other</option></select></div>
            <Input label="Processing Time" defaultValue={editing?.processing_time || ''} id="dm-processing" />
            <Input label="Minimum Deposit" type="number" defaultValue={editing?.min_deposit || 0} id="dm-min" />
            <Input label="Maximum Deposit" type="number" defaultValue={editing?.max_deposit || 0} id="dm-max" />
            <Input label="Fee" type="number" defaultValue={editing?.fee || 0} id="dm-fee" />
            <Input label="Display Order" type="number" defaultValue={editing?.display_order || 1} id="dm-order" />
          </div>
          <Input label="Deposit Wallet Address" defaultValue={editing?.deposit_address || ''} id="dm-address" placeholder="The wallet address users should send deposits to" />
          <div><label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Instructions</label><textarea id="dm-instructions" rows={3} defaultValue={editing?.instructions || ''} className="w-full rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Deposit instructions for users..." /></div>
        </div>
      </Modal>
    </div>
  );
}
