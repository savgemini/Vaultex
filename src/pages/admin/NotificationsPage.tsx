import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/context/ToastContext';
import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/format';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string; user_id: string; type: string; title: string; sent: string; status: string;
}

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [composeOpen, setComposeOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sending, setSending] = useState(false);

  const loadNotifications = async () => {
    const { data, error } = await supabase.from('notifications').select('id, user_id, type, title, created_at, is_read').order('created_at', { ascending: false }).limit(1000);
    if (error) { toast(`Failed to load notifications: ${error.message}`, 'error'); return; }
    setNotifications((data || []).map(row => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      sent: row.created_at,
      status: row.is_read ? 'read' : 'unread',
    })));
  };

  useEffect(() => { loadNotifications(); }, []);

  const send = async () => {
    if (!title.trim() || !message.trim()) { toast('Please fill in all fields.', 'error'); return; }
    setSending(true);
    const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id');
    if (profilesError) { toast(`Could not load recipients: ${profilesError.message}`, 'error'); setSending(false); return; }

    const recipients = profiles || [];
    for (let offset = 0; offset < recipients.length; offset += 500) {
      const rows = recipients.slice(offset, offset + 500).map(profile => ({
        user_id: profile.id,
        type: 'system' as const,
        title: title.trim(),
        message: message.trim(),
        is_read: false,
      }));
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) {
        toast(`Notification send stopped after ${Math.min(offset, recipients.length)} recipients: ${error.message}`, 'error');
        setSending(false);
        await loadNotifications();
        return;
      }
    }

    toast(`Notification sent to ${recipients.length} accounts.`, 'success');
    setSending(false);
    setComposeOpen(false);
    setTitle('');
    setMessage('');
    await loadNotifications();
  };

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${notifications.length} user notification records`} actions={<Button size="sm" onClick={() => setComposeOpen(true)}>Compose</Button>} />

      <Table
        columns={[
          { key: 'title', header: 'Title', render: (n) => <span className="text-sm font-medium text-surface-900">{n.title}</span> },
          { key: 'type', header: 'Type', render: (n) => <span className="text-sm text-surface-600 capitalize">{n.type}</span> },
          { key: 'user_id', header: 'Recipient User ID', render: (n) => <span className="text-xs font-mono text-surface-500">{n.user_id}</span> },
          { key: 'sent', header: 'Sent', render: (n) => <span className="text-xs text-surface-500">{formatDateTime(n.sent)}</span> },
          { key: 'status', header: 'Status', align: 'right', render: (n) => <span className={`text-xs px-2 py-0.5 rounded font-medium ${n.status === 'read' ? 'bg-surface-100 text-surface-600' : 'bg-pending-light text-pending-dark'}`}>{n.status}</span> },
        ]}
        data={notifications}
        rowKey={(n) => n.id}
        emptyState={<EmptyState title="No notifications sent" description="Compose a notification to send to your users." />}
      />

      <Modal open={composeOpen} onClose={() => setComposeOpen(false)} title="Send Notification"
        footer={<><Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button><Button loading={sending} onClick={send}>Send to All Users</Button></>}>
        <div className="space-y-4">
          <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title" />
          <div><label className="block text-sm font-medium text-surface-700 mb-1.5">Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} className="w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20" placeholder="Notification message..." /></div>
        </div>
      </Modal>
    </div>
  );
}
