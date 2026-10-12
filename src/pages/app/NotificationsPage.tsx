import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Shield, ArrowDownToLine, ArrowUpFromLine, TrendingUp, LifeBuoy, Settings as SettingsIcon, Info } from 'lucide-react';
import { Card, PageHeader, EmptyState, Tabs } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { timeAgo, classNames } from '@/lib/format';
import type { Notification, NotificationType } from '@/types';

const iconMap: Record<NotificationType, typeof Bell> = {
  security: Shield,
  deposit: ArrowDownToLine,
  withdrawal: ArrowUpFromLine,
  transaction: TrendingUp,
  investment: TrendingUp,
  support: LifeBuoy,
  account: SettingsIcon,
  system: Info,
};

export default function NotificationsPage() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    if (!session) return;
    (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      setNotifications((data as Notification[]) || []);
      setLoading(false);
    })();
  }, [session]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!session) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = tab === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="dark:bg-surface-950">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={unreadCount > 0 ? <Button variant="outline" size="sm" icon={<Check className="w-4 h-4" />} onClick={markAllAsRead}>Mark All Read</Button> : undefined}
      />

      <div className="mb-4"><Tabs tabs={[{ key: 'all', label: 'All', count: notifications.length }, { key: 'unread', label: 'Unread', count: unreadCount }]} active={tab} onChange={setTab} /></div>

      <Card padding={false} className="overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No notifications" description={tab === 'unread' ? "You're all caught up! No unread notifications." : "You haven't received any notifications yet."} />
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {filtered.map(n => {
              const Icon = iconMap[n.type] || Bell;
              return (
                <div key={n.id} className={classNames('px-5 py-4 flex items-start gap-3 hover:bg-surface-50 dark:hover:bg-surface-800', !n.is_read && 'bg-brand-50/30 dark:bg-brand-950/30')}>
                  <div className={classNames('w-9 h-9 rounded-full flex items-center justify-center shrink-0', !n.is_read ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-400' : 'bg-surface-100 dark:bg-surface-800 text-surface-400 dark:text-surface-500')}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-surface-900 dark:text-white">{n.title}</p>
                      {!n.is_read && <span className="w-2 h-2 bg-brand-600 rounded-full shrink-0" />}
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.is_read && <button onClick={() => markAsRead(n.id)} className="p-1.5 text-surface-400 dark:text-surface-500 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded" title="Mark as read"><Check className="w-4 h-4" /></button>}
                    <button onClick={() => deleteNotification(n.id)} className="p-1.5 text-surface-400 dark:text-surface-500 hover:text-negative hover:bg-surface-100 dark:hover:bg-surface-800 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
