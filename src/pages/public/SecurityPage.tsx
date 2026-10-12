import { Shield, Lock, Eye, KeyRound, FileCheck, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Security</h1>
      <p className="text-sm text-surface-500 mb-8">How we protect your account and digital assets on the Vaultex platform.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {[
          { icon: KeyRound, title: 'Two-Factor Authentication', desc: 'Optional 2FA adds an additional verification layer to your account for withdrawals and security settings.' },
          { icon: Lock, title: 'Session Management', desc: 'Monitor active sessions and revoke access from any device. Configurable session durations.' },
          { icon: Eye, title: 'Audit Logging', desc: 'All administrative actions are recorded in an immutable audit log with timestamps and admin identity.' },
          { icon: Shield, title: 'Account Restrictions', desc: 'Granular restriction system allows targeted enforcement without locking entire accounts.' },
          { icon: FileCheck, title: 'Verification System', desc: 'KYC verification process designed for integration with compliant third-party providers.' },
          { icon: AlertTriangle, title: 'Security Alerts', desc: 'Notifications for login events, withdrawal requests, and suspicious activity on your account.' },
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
        <h2 className="text-base font-semibold text-surface-900 mb-3">Responsible Disclosure</h2>
        <p className="text-sm text-surface-600 mb-4">
          If you discover a security vulnerability on our platform, please report it responsibly to our security team. We are committed to addressing reported issues promptly.
        </p>
        <p className="text-sm text-surface-600">
          Contact: <span className="font-medium text-surface-900">security@vaultex.com</span>
        </p>
      </Card>

      <p className="mt-8 text-xs text-surface-400">
        No security system is perfect. While we implement industry-standard protections, users should follow best practices including strong passwords, 2FA, and careful device management.
      </p>
    </div>
  );
}
