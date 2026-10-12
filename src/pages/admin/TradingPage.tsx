import { useEffect, useState } from 'react';
import { Card, PageHeader, StatCard, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface TradingOrder {
  id: string; user_id: string; pair: string; side: 'buy' | 'sell'; order_type: string; price: number; amount: number; total: number; fee: number; status: string; created_at: string;
}

export default function AdminTradingPage() {
  const [orders, setOrders] = useState<Array<TradingOrder & { user: string }>>([]);

  useEffect(() => {
    const loadOrders = async () => {
      const { data } = await supabase.from('orders').select('id, user_id, pair, side, order_type, price, amount, total, fee, status, created_at').order('created_at', { ascending: false }).limit(1000);
      const rows = (data || []) as TradingOrder[];
      const userIds = Array.from(new Set(rows.map(row => row.user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map(profile => [profile.id, profile.full_name || profile.email || profile.id]));
      setOrders(rows.map(row => ({ ...row, user: profileMap.get(row.user_id) || row.user_id })));
    };

    loadOrders();
  }, []);

  const since24h = Date.now() - 24 * 60 * 60 * 1000;
  const orders24h = orders.filter(order => new Date(order.created_at).getTime() >= since24h);
  const filled24h = orders24h.filter(order => order.status === 'filled');
  const openOrders = orders.filter(order => ['open', 'pending', 'partially_filled'].includes(order.status)).length;
  const volume24h = filled24h.reduce((sum, order) => sum + Number(order.total), 0);
  const fees24h = filled24h.reduce((sum, order) => sum + Number(order.fee), 0);

  return (
    <div>
      <PageHeader title="Trading Activity" subtitle="Platform trading overview and order management" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="24h Trading Volume" value={formatCurrency(volume24h)} />
        <StatCard label="Open Orders" value={openOrders.toLocaleString()} />
        <StatCard label="Filled Orders (24h)" value={filled24h.length.toLocaleString()} />
        <StatCard label="Trading Fees (24h)" value={formatCurrency(fees24h)} />
      </div>

      <Table
        columns={[
          { key: 'user', header: 'User', render: (o) => <span className="text-sm font-medium text-surface-900">{o.user}</span> },
          { key: 'pair', header: 'Pair', render: (o) => <span className="text-sm text-surface-700">{o.pair}</span> },
          { key: 'side', header: 'Side', align: 'center', render: (o) => <span className={`text-xs font-medium px-2 py-0.5 rounded ${o.side === 'buy' ? 'bg-positive-light text-positive-dark' : 'bg-negative-light text-negative-dark'}`}>{o.side}</span> },
          { key: 'type', header: 'Type', render: (o) => <span className="text-sm text-surface-600 capitalize">{o.order_type}</span> },
          { key: 'price', header: 'Price', align: 'right', render: (o) => <span className="text-sm num text-surface-700">{o.price}</span> },
          { key: 'amount', header: 'Amount', align: 'right', render: (o) => <span className="text-sm num text-surface-700">{o.amount}</span> },
          { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="text-sm num font-medium text-surface-900">{formatCurrency(o.total)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (o) => <StatusBadge status={o.status} /> },
          { key: 'date', header: 'Date', render: (o) => <span className="text-xs text-surface-500">{formatDateTime(o.created_at)}</span> },
        ]}
        data={orders}
        rowKey={(o) => o.id}
        emptyState={<EmptyState title="No trading activity" description="No orders have been placed." />}
      />
    </div>
  );
}
