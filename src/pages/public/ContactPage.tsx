import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast('Your message has been received. Our team will respond within 24 hours.', 'success');
      setName(''); setEmail(''); setSubject(''); setMessage('');
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Contact Us</h1>
      <p className="text-sm text-surface-500 mb-8">Get in touch with our team for support, inquiries, or feedback.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
              <Mail className="w-5 h-5 text-brand-700" />
            </div>
            <h3 className="text-sm font-semibold text-surface-900">Email</h3>
            <p className="text-sm text-surface-600 mt-1">support@vaultex.com</p>
          </Card>
          <Card>
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-brand-700" />
            </div>
            <h3 className="text-sm font-semibold text-surface-900">Live Chat</h3>
            <p className="text-sm text-surface-600 mt-1">Available 24/7 through the in-app support center.</p>
          </Card>
          <Card>
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-brand-700" />
            </div>
            <h3 className="text-sm font-semibold text-surface-900">Office</h3>
            <p className="text-sm text-surface-600 mt-1">Remote-first organization</p>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Full Name" name="name" value={name} onChange={e => setName(e.target.value)} required />
                <Input label="Email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <Input label="Subject" name="subject" value={subject} onChange={e => setSubject(e.target.value)} required />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  required
                  rows={5}
                  className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>
              <Button type="submit" loading={sending} icon={<Send className="w-4 h-4" />}>Send Message</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
