import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Lock, User, Globe, Phone, Gift, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const countries = ['United States', 'United Kingdom', 'Germany', 'France', 'Japan', 'Singapore', 'Canada', 'Australia', 'Brazil', 'India', 'Other'];

export default function SignupPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', country: '', phone: '', referral: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) { toast('Please accept the Terms of Service to continue.', 'error'); return; }
    setLoading(true);
    const { error } = await signUp(form.email, form.password, {
      full_name: form.fullName,
      country: form.country,
      phone: form.phone,
      referral_code: form.referral,
    });
    setLoading(false);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Account created. Please check your email to verify your account.', 'success');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-brand-700 rounded flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-surface-900 dark:text-white tracking-tight">Vaultex</span>
          </Link>

          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-card p-6">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Create your account</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Start trading and investing in digital assets.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" name="fullName" value={form.fullName} onChange={e => update('fullName', e.target.value)} required icon={<User className="w-4 h-4" />} placeholder="John Doe" />
              <Input label="Email" type="email" name="email" value={form.email} onChange={e => update('email', e.target.value)} required icon={<Mail className="w-4 h-4" />} placeholder="you@example.com" />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => update('password', e.target.value)}
                    required
                    minLength={8}
                    className="w-full h-10 pl-10 pr-10 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    placeholder="Minimum 8 characters"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <select
                    value={form.country}
                    onChange={e => update('country', e.target.value)}
                    required
                    className="w-full h-10 pl-10 pr-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Select country</option>
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <Input label="Phone Number" name="phone" value={form.phone} onChange={e => update('phone', e.target.value)} icon={<Phone className="w-4 h-4" />} placeholder="+1 234 567 890" />
              <Input label="Referral Code (Optional)" name="referral" value={form.referral} onChange={e => update('referral', e.target.value)} icon={<Gift className="w-4 h-4" />} placeholder="Enter referral code" />

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-surface-300 text-brand-700 focus:ring-brand-500" />
                <span className="text-xs text-surface-600 dark:text-surface-400">
                  I agree to the <Link to="/terms" className="text-brand-700 dark:text-brand-400 hover:text-brand-800">Terms of Service</Link> and <Link to="/privacy" className="text-brand-700 dark:text-brand-400 hover:text-brand-800">Privacy Policy</Link>, and acknowledge the <Link to="/risk-disclosure" className="text-brand-700 dark:text-brand-400 hover:text-brand-800">Risk Disclosure</Link>.
                </span>
              </label>

              <Button type="submit" loading={loading} className="w-full">Create Account</Button>
            </form>

            <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
              Already have an account? <Link to="/login" className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
