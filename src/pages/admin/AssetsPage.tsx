import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Search as SearchInput, Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { formatPrice, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface AssetRow {
  id: string;
  name: string;
  symbol: string;
  network: string;
  decimals: number;
  status: string;
  deposit_enabled: boolean;
  withdrawal_enabled: boolean;
  trading_enabled: boolean;
  min_deposit: number;
  min_withdrawal: number;
  withdrawal_fee: number;
  current_price: number;
}

type AssetForm = Pick<AssetRow, 'name' | 'symbol' | 'network' | 'decimals' | 'status' | 'deposit_enabled' | 'withdrawal_enabled' | 'trading_enabled' | 'min_deposit' | 'min_withdrawal' | 'withdrawal_fee'>;

const emptyAssetForm: AssetForm = {
  name: '', symbol: '', network: '', decimals: 8, status: 'active',
  deposit_enabled: true, withdrawal_enabled: true, trading_enabled: true,
  min_deposit: 0, min_withdrawal: 0, withdrawal_fee: 0,
};

export default function AdminAssetsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRow | null>(null);
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [form, setForm] = useState<AssetForm>(emptyAssetForm);

  const loadAssets = useCallback(async () => {
    const { data, error } = await supabase.from('assets').select('*').order('display_order', { ascending: true });
    if (error) {
      toast('Failed to load assets from the database.', 'error');
      return;
    }
    setAssets((data as AssetRow[]) || []);
  }, [toast]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const openAssetEditor = (asset: AssetRow | null) => {
    setEditingAsset(asset);
    setForm(asset ? {
      name: asset.name,
      symbol: asset.symbol,
      network: asset.network,
      decimals: asset.decimals,
      status: asset.status,
      deposit_enabled: asset.deposit_enabled,
      withdrawal_enabled: asset.withdrawal_enabled,
      trading_enabled: asset.trading_enabled,
      min_deposit: asset.min_deposit,
      min_withdrawal: asset.min_withdrawal,
      withdrawal_fee: asset.withdrawal_fee,
    } : emptyAssetForm);
    setEditOpen(true);
  };

  const saveAsset = async () => {
    if (!form.name.trim() || !form.symbol.trim()) { toast('Name and symbol are required.', 'error'); return; }
    const payload = { ...form, name: form.name.trim(), symbol: form.symbol.trim().toUpperCase() };
    const result = editingAsset
      ? await supabase.from('assets').update(payload).eq('id', editingAsset.id)
      : await supabase.from('assets').insert(payload);
    if (result.error) { toast(`Failed to save asset: ${result.error.message}`, 'error'); return; }
    toast('Asset saved.', 'success');
    setEditOpen(false);
    await loadAssets();
  };

  const toggleAsset = async (asset: AssetRow, field: 'deposit_enabled' | 'withdrawal_enabled' | 'trading_enabled') => {
    const { error } = await supabase.from('assets').update({ [field]: !asset[field] }).eq('id', asset.id);
    if (error) { toast(`Failed to update ${asset.symbol}: ${error.message}`, 'error'); return; }
    await loadAssets();
  };

  const filtered = assets.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Asset Management" subtitle={`${assets.length} supported assets`} actions={<Button size="sm" onClick={() => openAssetEditor(null)}>Add Asset</Button>} />

      <div className="mb-4"><SearchInput value={search} onChange={setSearch} placeholder="Search assets..." className="max-w-xs" /></div>

      <Table
        columns={[
          { key: 'symbol', header: 'Symbol', render: (a) => <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{a.symbol.slice(0, 2)}</div><span className="text-sm font-medium text-surface-900">{a.symbol}</span></div> },
          { key: 'name', header: 'Name', render: (a) => <span className="text-sm text-surface-600">{a.name}</span> },
          { key: 'network', header: 'Network', render: (a) => <span className="text-sm text-surface-600 hidden md:table-cell">{a.network}</span> },
          { key: 'price', header: 'Price', align: 'right', render: (a) => <span className="text-sm num text-surface-900">{formatPrice(a.current_price)}</span> },
          { key: 'status', header: 'Status', align: 'center', render: (a) => <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.status === 'active' ? 'bg-positive-light text-positive-dark' : a.status === 'coming_soon' ? 'bg-info-light text-info-dark' : 'bg-surface-100 text-surface-600'}`}>{a.status}</span> },
          { key: 'deposit', header: 'Deposit', align: 'center', render: (a) => <span className={classNames('text-xs', a.deposit_enabled ? 'text-positive' : 'text-surface-300')}>{a.deposit_enabled ? 'On' : 'Off'}</span> },
          { key: 'withdrawal', header: 'Withdraw', align: 'center', render: (a) => <span className={classNames('text-xs', a.withdrawal_enabled ? 'text-positive' : 'text-surface-300')}>{a.withdrawal_enabled ? 'On' : 'Off'}</span> },
          { key: 'trading', header: 'Trade', align: 'center', render: (a) => <span className={classNames('text-xs', a.trading_enabled ? 'text-positive' : 'text-surface-300')}>{a.trading_enabled ? 'On' : 'Off'}</span> },
          { key: 'actions', header: '', align: 'right', render: (a) => (
            <Dropdown trigger={<button className="p-1.5 hover:bg-surface-100 rounded text-sm">Manage</button>}>
              <DropdownItem onClick={() => openAssetEditor(a)}>Edit Asset</DropdownItem>
              <DropdownSeparator />
              <DropdownItem onClick={() => toggleAsset(a, 'deposit_enabled')}>{a.deposit_enabled ? 'Disable' : 'Enable'} Deposits</DropdownItem>
              <DropdownItem onClick={() => toggleAsset(a, 'withdrawal_enabled')}>{a.withdrawal_enabled ? 'Disable' : 'Enable'} Withdrawals</DropdownItem>
              <DropdownItem onClick={() => toggleAsset(a, 'trading_enabled')}>{a.trading_enabled ? 'Disable' : 'Enable'} Trading</DropdownItem>
            </Dropdown>
          ) },
        ]}
        data={filtered}
        rowKey={(a) => a.id}
        emptyState={<EmptyState title="No assets found" description="No assets match your search." />}
      />

      <Pagination page={page} totalPages={Math.ceil(filtered.length / 10)} onPageChange={setPage} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editingAsset ? `Edit ${editingAsset.symbol}` : 'Add New Asset'}
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveAsset}>Save</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Symbol" value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} disabled={!!editingAsset} />
            <Input label="Network" value={form.network} onChange={e => setForm({ ...form, network: e.target.value })} />
            <Input label="Decimals" type="number" value={form.decimals} onChange={e => setForm({ ...form, decimals: Number(e.target.value) })} />
            <Input label="Min Deposit" type="number" value={form.min_deposit} onChange={e => setForm({ ...form, min_deposit: Number(e.target.value) })} />
            <Input label="Min Withdrawal" type="number" value={form.min_withdrawal} onChange={e => setForm({ ...form, min_withdrawal: Number(e.target.value) })} />
            <Input label="Withdrawal Fee" type="number" value={form.withdrawal_fee} onChange={e => setForm({ ...form, withdrawal_fee: Number(e.target.value) })} />
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"><option value="active">active</option><option value="inactive">inactive</option><option value="coming_soon">coming_soon</option></select></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['Deposit Enabled', 'deposit_enabled'], ['Withdrawal Enabled', 'withdrawal_enabled'], ['Trading Enabled', 'trading_enabled']].map(([label, key]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-surface-700"><input type="checkbox" checked={form[key as keyof AssetForm] as boolean} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="w-4 h-4 rounded border-surface-300 text-brand-700" />{label}</label>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
