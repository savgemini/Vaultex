import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Mail, ArrowLeft } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast('Password reset instructions sent to your email.', 'success');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-brand-700 rounded flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">Vaultex</span>
          </Link>

          <Card>
            {sent ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-positive-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-positive" />
                </div>
                <h1 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">Check your email</h1>
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
                  We've sent password reset instructions to <span className="font-medium text-surface-900 dark:text-white">{email}</span>.
                  Follow the link in the email to reset your password.
                </p>
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">
                  <ArrowLeft className="w-4 h-4" /> Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Reset your password</h1>
                <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Enter your email and we'll send you reset instructions.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Email" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required icon={<Mail className="w-4 h-4" />} placeholder="you@example.com" />
                  <Button type="submit" loading={loading} className="w-full">Send Reset Instructions</Button>
                </form>
                <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
                  <Link to="/login" className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Back to sign in</Link>
                </p>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
