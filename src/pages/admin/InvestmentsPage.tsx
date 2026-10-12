import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { RiskLevelBadge, ProductStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { formatPercent } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  description: string;
  asset_symbol: string;
  product_type: string;
  term_days: number;
  apy: number;
  min_amount: number;
  max_amount: number;
  risk_level: string;
  status: string;
}

type ProductForm = Omit<Product, 'id'>;

const emptyProductForm: ProductForm = {
  name: '', description: '', asset_symbol: '', product_type: 'flexible', term_days: 0,
  apy: 0, min_amount: 0, max_amount: 0, risk_level: 'low', status: 'active',
};

export default function AdminInvestmentsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyProductForm);

  const loadProducts = useCallback(async () => {
    const { data, error } = await supabase.from('investment_products').select('*').order('display_order', { ascending: true });
    if (error) {
      toast('Failed to load investment products from the database.', 'error');
      return;
    }
    setProducts((data as Product[]) || []);
  }, [toast]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openProductEditor = (product: Product | null) => {
    setEditing(product);
    setForm(product ? {
      name: product.name,
      description: product.description || '',
      asset_symbol: product.asset_symbol,
      product_type: product.product_type,
      term_days: product.term_days,
      apy: product.apy,
      min_amount: product.min_amount,
      max_amount: product.max_amount,
      risk_level: product.risk_level,
      status: product.status,
    } : emptyProductForm);
    setEditOpen(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim() || !form.asset_symbol.trim()) { toast('Product name and asset symbol are required.', 'error'); return; }
    const payload = { ...form, name: form.name.trim(), asset_symbol: form.asset_symbol.trim().toUpperCase() };
    const result = editing
      ? await supabase.from('investment_products').update(payload).eq('id', editing.id)
      : await supabase.from('investment_products').insert(payload);
    if (result.error) { toast(`Failed to save product: ${result.error.message}`, 'error'); return; }
    toast('Investment product saved.', 'success');
    setEditOpen(false);
    await loadProducts();
  };

  const toggleProduct = async (product: Product) => {
    const status = product.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('investment_products').update({ status }).eq('id', product.id);
    if (error) { toast(`Failed to update product status: ${error.message}`, 'error'); return; }
    await loadProducts();
  };

  return (
    <div>
      <PageHeader title="Investment Products" subtitle={`${products.length} products configured`} actions={<Button size="sm" onClick={() => openProductEditor(null)}>Create Product</Button>} />

      <Table
        columns={[
          { key: 'name', header: 'Name', render: (p) => <span className="text-sm font-medium text-surface-900">{p.name}</span> },
          { key: 'asset', header: 'Asset', render: (p) => <span className="text-sm text-surface-700">{p.asset_symbol}</span> },
          { key: 'type', header: 'Type', render: (p) => <span className="text-sm text-surface-600 capitalize">{p.product_type.replace('_', ' ')}</span> },
          { key: 'term', header: 'Term', align: 'right', render: (p) => <span className="text-sm text-surface-700">{p.term_days === 0 ? 'Flexible' : `${p.term_days}d`}</span> },
          { key: 'apy', header: 'APY', align: 'right', render: (p) => <span className="text-sm num text-positive font-medium">{formatPercent(p.apy, false)}</span> },
          { key: 'risk', header: 'Risk', align: 'center', render: (p) => <RiskLevelBadge level={p.risk_level as 'low' | 'medium' | 'high'} /> },
          { key: 'min', header: 'Min', align: 'right', render: (p) => <span className="text-sm num text-surface-700">{p.min_amount}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (p) => <ProductStatusBadge status={p.status as 'active' | 'paused' | 'coming_soon' | 'closed'} /> },
          { key: 'actions', header: '', align: 'right', render: (p) => (
            <div className="flex items-center gap-1">
              <button onClick={() => openProductEditor(p)} className="text-sm text-brand-700 hover:text-brand-800 px-2 py-1">Edit</button>
              <button onClick={() => toggleProduct(p)} className="text-sm text-surface-500 hover:text-surface-700 px-2 py-1">{p.status === 'active' ? 'Pause' : 'Resume'}</button>
            </div>
          ) },
        ]}
        data={products}
        rowKey={(p) => p.id}
        emptyState={<EmptyState title="No products found" description="Create investment products for your users." />}
      />

      <Pagination page={page} totalPages={Math.ceil(products.length / 10)} onPageChange={setPage} />

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={editing ? `Edit ${editing.name}` : 'Create Investment Product'} size="lg"
        footer={<><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveProduct}>Save Product</Button></>}>
        <div className="space-y-4">
          <Input label="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Asset Symbol" value={form.asset_symbol} onChange={e => setForm({ ...form, asset_symbol: e.target.value })} />
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Product Type</label><select value={form.product_type} onChange={e => setForm({ ...form, product_type: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"><option value="flexible">flexible</option><option value="fixed_term">fixed_term</option><option value="staking">staking</option><option value="portfolio_plan">portfolio_plan</option></select></div>
            <Input label="Term (days, 0 = flexible)" type="number" value={form.term_days} onChange={e => setForm({ ...form, term_days: Number(e.target.value) })} />
            <Input label="APY (%)" type="number" step="0.01" value={form.apy} onChange={e => setForm({ ...form, apy: Number(e.target.value) })} />
            <Input label="Minimum Amount" type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: Number(e.target.value) })} />
            <Input label="Maximum Amount" type="number" value={form.max_amount} onChange={e => setForm({ ...form, max_amount: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Risk Level</label><select value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full h-10 px-3 rounded border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"><option value="active">active</option><option value="paused">paused</option><option value="coming_soon">coming_soon</option><option value="closed">closed</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Product description..." /></div>
        </div>
      </Modal>
    </div>
  );
}
