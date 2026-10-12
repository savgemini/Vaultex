import { TrendingUp, Shield, Users, Globe } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-2">About Vaultex</h1>
      <p className="text-sm text-surface-500 mb-8">A digital asset platform built for transparency and usability.</p>

      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-surface-900 mb-3">Our Mission</h2>
        <p className="text-sm text-surface-600 leading-relaxed">
          Vaultex provides a professional environment for trading and investing in digital assets. We focus on clear fee structures, comprehensive security controls, and an interface designed for both new and experienced users.
        </p>
        <p className="text-sm text-surface-600 leading-relaxed mt-3">
          This is a demonstration platform showcasing a full-stack crypto exchange architecture. No real financial transactions are processed.
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {[
          { icon: TrendingUp, title: 'Trading', desc: 'Spot trading with market, limit, and stop order types.' },
          { icon: Shield, title: 'Security', desc: 'Multi-layered security with audit logging and account controls.' },
          { icon: Users, title: 'Support', desc: 'Integrated support center with ticket tracking and live chat.' },
          { icon: Globe, title: 'Accessibility', desc: 'Responsive design across desktop, tablet, and mobile devices.' },
        ].map(f => {
          const Icon = f.icon;
          return (
            <Card key={f.title}>
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-brand-700" />
              </div>
              <h3 className="text-base font-semibold text-surface-900 mb-1">{f.title}</h3>
              <p className="text-sm text-surface-600">{f.desc}</p>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-surface-900 mb-3">Risk Disclosure</h2>
        <p className="text-sm text-surface-600 leading-relaxed">
          Digital asset investments are subject to high market risk. The value of cryptocurrencies can fluctuate significantly. Past performance does not guarantee future results. Only invest what you can afford to lose.
        </p>
      </Card>
    </div>
  );
}
