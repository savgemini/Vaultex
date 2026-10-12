import { useState } from 'react';
import { Search, ChevronDown, BookOpen, LifeBuoy, CreditCard, Shield, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { classNames } from '@/lib/format';

const faqs = [
  { category: 'Account', q: 'How do I verify my account?', a: 'Navigate to the Verification Center in your account settings. Complete the basic information, identity verification, and address verification stages.' },
  { category: 'Account', q: 'What documents do I need for verification?', a: 'A government-issued photo ID for identity verification and a recent utility bill or bank statement for address verification.' },
  { category: 'Deposits', q: 'How long do deposits take?', a: 'Crypto deposits typically credit after 3-12 network confirmations (10-30 minutes). Bank transfers take 1-3 business days.' },
  { category: 'Deposits', q: 'What is the minimum deposit?', a: 'Minimum deposit amounts vary by asset. Check the deposit page for specific minimums for each supported asset.' },
  { category: 'Withdrawals', q: 'How do I withdraw funds?', a: 'Go to the Withdraw page, select your asset, enter the destination address and amount, and confirm the withdrawal. Most withdrawals require verification.' },
  { category: 'Withdrawals', q: 'Why is my withdrawal pending?', a: 'Withdrawals undergo a security review process. Processing time depends on the withdrawal method and security checks.' },
  { category: 'Trading', q: 'What order types are available?', a: 'Market, limit, and stop orders are supported. Market orders execute immediately at the best available price. Limit orders execute at your specified price.' },
  { category: 'Trading', q: 'What are the trading fees?', a: 'A flat 0.10% fee applies to all spot trading orders. Check the Pricing page for the full fee schedule.' },
  { category: 'Security', q: 'How do I enable two-factor authentication?', a: 'Go to Settings > Security and follow the 2FA setup process. We strongly recommend enabling 2FA for account security.' },
  { category: 'Security', q: 'What should I do if I suspect unauthorized access?', a: 'Immediately change your password, review active sessions in Settings > Security, and contact support through the Support Center.' },
];

const categories = [
  { icon: BookOpen, label: 'Getting Started', count: 5 },
  { icon: TrendingUp, label: 'Trading', count: 8 },
  { icon: CreditCard, label: 'Deposits & Withdrawals', count: 6 },
  { icon: Shield, label: 'Security', count: 4 },
  { icon: LifeBuoy, label: 'Account', count: 7 },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filtered = faqs.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Help Center</h1>
      <p className="text-sm text-surface-500 mb-8">Find answers to common questions about using the Vaultex platform.</p>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search help articles..."
          className="w-full h-12 pl-10 pr-4 rounded border border-surface-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="text-center p-4 border border-surface-200 rounded-lg hover:bg-surface-50 cursor-pointer transition-colors">
              <Icon className="w-6 h-6 text-brand-700 mx-auto mb-2" />
              <p className="text-xs font-medium text-surface-700">{c.label}</p>
              <p className="text-2xs text-surface-400">{c.count} articles</p>
            </div>
          );
        })}
      </div>

      <h2 className="text-lg font-semibold text-surface-900 mb-4">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {filtered.map((faq, i) => (
          <Card key={i} padding={false} className="overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-50"
            >
              <div>
                <span className="text-2xs font-medium text-brand-700 uppercase tracking-wide">{faq.category}</span>
                <p className="text-sm font-medium text-surface-900 mt-0.5">{faq.q}</p>
              </div>
              <ChevronDown className={classNames('w-4 h-4 text-surface-400 shrink-0 transition-transform', openFaq === i && 'rotate-180')} />
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-surface-600">{faq.a}</p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-sm text-surface-500">No articles match your search. Try different keywords or contact support.</p>
        </Card>
      )}

      <Card className="mt-8 text-center">
        <h3 className="text-base font-semibold text-surface-900 mb-1">Still need help?</h3>
        <p className="text-sm text-surface-600 mb-4">Our support team is available to assist you.</p>
        <a href="/contact" className="inline-flex items-center justify-center h-10 px-4 bg-brand-700 text-white text-sm font-medium rounded hover:bg-brand-800 transition-colors">
          Contact Support
        </a>
      </Card>
    </div>
  );
}
