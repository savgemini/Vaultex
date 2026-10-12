import { Card } from '@/components/ui/Card';

export default function PricingPage() {
  const tiers = [
    { name: 'Spot Trading', fee: '0.10%', desc: 'Standard rate for all market and limit orders' },
    { name: 'Maker (Limit)', fee: '0.10%', desc: 'Orders that add liquidity to the order book' },
    { name: 'Taker (Market)', fee: '0.10%', desc: 'Orders that remove liquidity from the order book' },
  ];

  const withdrawalFees = [
    { asset: 'BTC', fee: '0.0004 BTC', min: '0.001 BTC' },
    { asset: 'ETH', fee: '0.005 ETH', min: '0.01 ETH' },
    { asset: 'USDT', fee: '1 USDT', min: '10 USDT' },
    { asset: 'SOL', fee: '0.01 SOL', min: '0.5 SOL' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Pricing & Fees</h1>
      <p className="text-sm text-surface-500 mb-8">Transparent fee structure for trading and transactions on Vaultex.</p>

      <h2 className="text-lg font-semibold text-surface-900 mb-4">Trading Fees</h2>
      <Card padding={false} className="overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase text-left">Order Type</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">Fee</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase text-left hidden md:table-cell">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {tiers.map(t => (
              <tr key={t.name}>
                <td className="px-4 py-3 text-sm font-medium text-surface-900">{t.name}</td>
                <td className="px-4 py-3 text-sm font-semibold text-surface-900 num text-right">{t.fee}</td>
                <td className="px-4 py-3 text-sm text-surface-600 hidden md:table-cell">{t.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="text-lg font-semibold text-surface-900 mb-4">Withdrawal Fees</h2>
      <Card padding={false} className="overflow-hidden mb-8">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-50 border-b border-surface-200">
              <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase text-left">Asset</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">Withdrawal Fee</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-surface-500 uppercase text-right">Minimum Withdrawal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {withdrawalFees.map(w => (
              <tr key={w.asset}>
                <td className="px-4 py-3 text-sm font-medium text-surface-900">{w.asset}</td>
                <td className="px-4 py-3 text-sm text-surface-700 num text-right">{w.fee}</td>
                <td className="px-4 py-3 text-sm text-surface-700 num text-right">{w.min}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <h2 className="text-lg font-semibold text-surface-900 mb-4">Deposit Fees</h2>
      <Card>
        <p className="text-sm text-surface-600">Deposits are free of charge on Vaultex. Network confirmation times vary by asset and blockchain.</p>
      </Card>

      <p className="mt-8 text-xs text-surface-400">Fees are subject to change. All fee adjustments are logged and communicated to users in advance.</p>
    </div>
  );
}
