import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Welcome back!', 'success');
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .maybeSingle();
      navigate(profile?.is_admin ? '/admin' : '/app');
    }
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

          <div className="bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-card p-6">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-white mb-1">Sign in to your account</h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mb-6">Enter your credentials to access your dashboard.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} required icon={<Mail className="w-4 h-4" />} placeholder="you@example.com" />
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full h-10 pl-10 pr-10 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-4 h-4 rounded border-surface-300 text-brand-700 focus:ring-brand-500" />
                  <span className="text-sm text-surface-600 dark:text-surface-400">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Forgot password?</Link>
              </div>

              <Button type="submit" loading={loading} className="w-full">Sign In</Button>
            </form>

            <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
              Don't have an account? <Link to="/signup" className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
