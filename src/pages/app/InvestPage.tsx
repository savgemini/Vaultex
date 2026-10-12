import { useEffect, useState } from 'react';
import { TrendingUp, Lock, Calendar, Info } from 'lucide-react';
import { Card, PageHeader, EmptyState, Tabs } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { RiskLevelBadge, ProductStatusBadge, InvestmentStatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatPercent, classNames } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useAccountRestrictions } from '@/hooks/useAccountRestrictions';

interface Product {
  id: string; name: string; description: string; asset_symbol: string;
  product_type: 'flexible' | 'fixed_term' | 'staking'; term_days: number;
  apy: number; min_amount: number; max_amount: number; risk_level: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'coming_soon' | 'closed';
}

interface InvestmentRow {
  id: string; product_id: string; asset_symbol: string; principal: number; accrued_earnings: number; apy: number;
  start_date: string; maturity_date: string | null; status: 'active' | 'completed' | 'cancelled' | 'pending';
}

export default function InvestPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const { hasRestriction, loading: restrictionsLoading, error: restrictionsError } = useAccountRestrictions();
  const [tab, setTab] = useState('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [investments, setInvestments] = useState<Array<InvestmentRow & { product_name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadInvestments = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase.from('investments').select('id, product_id, asset_symbol, principal, accrued_earnings, apy, start_date, maturity_date, status').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const productMap = new Map(products.map(product => [product.id, product.name]));
    setInvestments(((data || []) as InvestmentRow[]).map(investment => ({
      ...investment,
      product_name: productMap.get(investment.product_id) || 'Investment product',
    })));
  };

  useEffect(() => {
    const loadData = async () => {
      const { data: productRows } = await supabase.from('investment_products').select('id, name, description, asset_symbol, product_type, term_days, apy, min_amount, max_amount, risk_level, status').order('display_order');
      const loadedProducts = (productRows || []) as Product[];
      setProducts(loadedProducts);
      if (session?.user?.id) {
        const { data: investmentRows } = await supabase.from('investments').select('id, product_id, asset_symbol, principal, accrued_earnings, apy, start_date, maturity_date, status').eq('user_id', session.user.id).order('created_at', { ascending: false });
        const productMap = new Map(loadedProducts.map(product => [product.id, product.name]));
        setInvestments(((investmentRows || []) as InvestmentRow[]).map(investment => ({ ...investment, product_name: productMap.get(investment.product_id) || 'Investment product' })));
      }
      setLoading(false);
    };

    loadData();
  }, [session?.user?.id]);

  const handleInvest = async () => {
    if (!investAmount || Number(investAmount) <= 0) { toast('Please enter a valid amount.', 'error'); return; }
    if (restrictionsLoading || restrictionsError) { toast('Unable to verify account restrictions. Please try again.', 'error'); return; }
    if (hasRestriction('disable_investments')) { toast('Investments are disabled for this account.', 'error'); return; }
    if (!selectedProduct || !session?.user?.id) { toast('Sign in to submit an investment request.', 'error'); return; }
    const amount = Number(investAmount);
    if (amount < selectedProduct.min_amount || amount > selectedProduct.max_amount) { toast('Amount is outside the product limits.', 'error'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('investments').insert({
      user_id: session.user.id,
      product_id: selectedProduct.id,
      asset_symbol: selectedProduct.asset_symbol,
      principal: amount,
      accrued_earnings: 0,
      apy: selectedProduct.apy,
      maturity_date: selectedProduct.term_days > 0 ? new Date(Date.now() + selectedProduct.term_days * 86400000).toISOString() : null,
      status: 'pending',
    });
    setSubmitting(false);
    if (error) { toast(`Failed to submit investment request: ${error.message}`, 'error'); return; }
    toast('Investment request submitted for review. No funds have been moved yet.', 'success');
    setSelectedProduct(null);
    setInvestAmount('');
    await loadInvestments();
  };

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Invest" subtitle="Grow your assets with flexible and fixed-term investment products." />

      <div className="mb-6 px-4 py-2.5 bg-pending-light border border-pending/20 rounded flex items-center gap-2">
        <Info className="w-4 h-4 text-pending-dark shrink-0" />
        <p className="text-xs text-pending-dark">Investment products carry risk. Returns are not guaranteed. Review product terms and risk disclosures before investing.</p>
      </div>

      <div className="mb-6">
        <Tabs tabs={[{ key: 'products', label: 'Available Products' }, { key: 'active', label: 'My Investments', count: investments.length }]} active={tab} onChange={setTab} />
      </div>

      {tab === 'products' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {products.map(p => (
            <Card key={p.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-surface-900 dark:text-white">{p.name}</h3>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">{p.asset_symbol} · {p.product_type.replace('_', ' ')}</p>
                </div>
                <ProductStatusBadge status={p.status} />
              </div>
              <p className="text-sm text-surface-600 dark:text-surface-400 mb-4">{p.description}</p>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><p className="text-xs text-surface-500 dark:text-surface-400">APY</p><p className="text-lg font-bold num text-positive">{formatPercent(p.apy, false)}</p></div>
                <div><p className="text-xs text-surface-500 dark:text-surface-400">Term</p><p className="text-sm font-semibold text-surface-700 dark:text-surface-300">{p.term_days === 0 ? 'Flexible' : `${p.term_days} days`}</p></div>
                <div><p className="text-xs text-surface-500 dark:text-surface-400">Min</p><p className="text-sm font-semibold num text-surface-700 dark:text-surface-300">{p.min_amount} {p.asset_symbol}</p></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-surface-100 dark:border-surface-800">
                <RiskLevelBadge level={p.risk_level} />
                <Button size="sm" disabled={p.status !== 'active'} onClick={() => setSelectedProduct(p)}>Invest Now</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding={false} className="overflow-hidden">
          {loading ? <div className="p-6 text-center text-sm text-surface-500">Loading investments...</div> : investments.length === 0 ? (
            <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="No active investments" description="Browse available products to start earning on your digital assets." />
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-800">
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left">Product</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Principal</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Accrued</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right hidden md:table-cell">APY</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left hidden md:table-cell">Start Date</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-left hidden lg:table-cell">Maturity</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                  {investments.map(inv => (
                    <tr key={inv.id} className="hover:bg-surface-50 dark:hover:bg-surface-800">
                      <td className="px-4 py-3"><p className="text-sm font-medium text-surface-900 dark:text-white">{inv.product_name}</p><p className="text-xs text-surface-500 dark:text-surface-400">{inv.asset_symbol}</p></td>
                      <td className="px-4 py-3 text-right text-sm num text-surface-900 dark:text-white">{inv.principal} {inv.asset_symbol}</td>
                      <td className="px-4 py-3 text-right text-sm num text-positive">+{inv.accrued_earnings.toFixed(6)} {inv.asset_symbol}</td>
                      <td className="px-4 py-3 text-right text-sm num text-surface-700 dark:text-surface-300 hidden md:table-cell">{formatPercent(inv.apy, false)}</td>
                      <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400 hidden md:table-cell">{new Date(inv.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="px-4 py-3 text-sm text-surface-600 dark:text-surface-400 hidden lg:table-cell">{inv.maturity_date ? new Date(inv.maturity_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}</td>
                      <td className="px-4 py-3 text-right"><InvestmentStatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Modal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title={`Invest in ${selectedProduct?.name || ''}`}
        footer={<><Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button><Button loading={submitting} onClick={handleInvest}>Submit Request</Button></>}>
        {selectedProduct && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded">
              <div><p className="text-xs text-surface-500 dark:text-surface-400">APY</p><p className="text-lg font-bold num text-positive">{formatPercent(selectedProduct.apy, false)}</p></div>
              <div><p className="text-xs text-surface-500 dark:text-surface-400">Risk Level</p><div className="mt-1"><RiskLevelBadge level={selectedProduct.risk_level} /></div></div>
              <div><p className="text-xs text-surface-500 dark:text-surface-400">Minimum</p><p className="text-sm font-semibold num">{selectedProduct.min_amount} {selectedProduct.asset_symbol}</p></div>
              <div><p className="text-xs text-surface-500 dark:text-surface-400">Maximum</p><p className="text-sm font-semibold num">{selectedProduct.max_amount} {selectedProduct.asset_symbol}</p></div>
            </div>
            <Input label="Amount" type="number" value={investAmount} onChange={e => setInvestAmount(e.target.value)} suffix={selectedProduct.asset_symbol} placeholder={`Min ${selectedProduct.min_amount}`} />
            <div className="flex items-start gap-2 p-3 bg-warning-light/50 rounded">
              <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-surface-600 dark:text-surface-400">By confirming, you acknowledge that investment returns are not guaranteed and your principal may be at risk. Review the product terms before proceeding.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
