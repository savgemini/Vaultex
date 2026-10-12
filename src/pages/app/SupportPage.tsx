import { useState, useEffect, useCallback } from 'react';
import { LifeBuoy, Send, MessageSquare, Plus, Search } from 'lucide-react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { timeAgo, classNames } from '@/lib/format';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'waiting_customer' | 'waiting_support' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
  last_message?: string;
}

interface ChatMessage {
  sender: 'user' | 'support';
  message: string;
  time: string;
}

const categoryOptions = [
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
  { value: 'deposit', label: 'Deposit' },
  { value: 'withdrawal', label: 'Withdrawal' },
  { value: 'trading', label: 'Trading' },
  { value: 'investment', label: 'Investment' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

export default function SupportPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newMessage, setNewMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const loadTickets = useCallback(async () => {
    if (!session?.user?.id) {
      setTickets([]);
      return;
    }

    const { data: ticketRows, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id, ticket_number, subject, category, priority, status, created_at, updated_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (ticketError) {
      toast('Failed to load support tickets from the database.', 'error');
      return;
    }

    const ticketIds = (ticketRows || []).map(row => row.id);
    let latestMessageByTicket = new Map<string, string>();

    if (ticketIds.length) {
      const { data: messageRows, error: messageError } = await supabase
        .from('support_messages')
        .select('ticket_id, message, created_at')
        .in('ticket_id', ticketIds)
        .order('created_at', { ascending: false });

      if (!messageError) {
        (messageRows || []).forEach((row: { ticket_id: string; message: string }) => {
          if (!latestMessageByTicket.has(row.ticket_id)) {
            latestMessageByTicket.set(row.ticket_id, row.message);
          }
        });
      }
    }

    const rows: Ticket[] = (ticketRows || []).map((row: {
      id: string;
      ticket_number: string;
      subject: string;
      category: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      status: 'open' | 'waiting_customer' | 'waiting_support' | 'resolved' | 'closed';
      created_at: string;
    }) => ({
      id: row.id,
      ticket_number: row.ticket_number,
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      created_at: row.created_at,
      last_message: latestMessageByTicket.get(row.id) || 'No messages yet',
    }));

    setTickets(rows);
  }, [session, toast]);

  const loadMessages = useCallback(async (ticketId: string) => {
    const { data: messageRows, error } = await supabase
      .from('support_messages')
      .select('id, ticket_id, sender_id, message, created_at, is_internal')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      toast('Failed to load support messages from the database.', 'error');
      return;
    }

    const messages = (messageRows || []).map((row: {
      sender_id: string;
      message: string;
      created_at: string;
    }) => ({
      sender: (row.sender_id === session?.user?.id ? 'user' : 'support') as ChatMessage['sender'],
      message: row.message,
      time: row.created_at,
    }));

    setChatMessages(messages);
  }, [session, toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadMessages(ticket.id);
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast('Please fill in all fields.', 'error');
      return;
    }

    if (!session?.user?.id) {
      toast('You must be signed in to open a support ticket.', 'error');
      return;
    }

    const ticketNum = `TKT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: ticketInsert, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: session.user.id,
        ticket_number: ticketNum,
        subject: newSubject.trim(),
        category: newCategory,
        priority: 'normal',
        status: 'open',
      })
      .select('id')
      .maybeSingle();

    if (ticketError || !ticketInsert) {
      toast(`Failed to create the support ticket: ${ticketError?.message || 'Unknown error'}`, 'error');
      return;
    }

    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketInsert.id,
        sender_id: session.user.id,
        message: newMessage.trim(),
        is_internal: false,
      });

    if (messageError) {
      toast(`Ticket created, but the first message could not be saved: ${messageError.message}`, 'error');
      return;
    }

    setNewTicketOpen(false);
    setNewSubject('');
    setNewMessage('');
    setNewCategory('general');
    toast('Support ticket created. Our team will respond shortly.', 'success');
    await loadTickets();
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !selectedTicket || !session?.user?.id) return;

    const message = chatMessage.trim();
    const { error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: session.user.id,
        message,
        is_internal: false,
      });

    if (error) {
      toast(`Failed to send message: ${error.message}`, 'error');
      return;
    }

    await supabase
      .from('support_tickets')
      .update({
        status: 'waiting_support',
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTicket.id);

    setChatMessages(prev => [...prev, { sender: 'user', message, time: new Date().toISOString() }]);
    setChatMessage('');
    await loadTickets();
  };

  if (selectedTicket) {
    return (
      <div className="dark:bg-surface-950">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button onClick={() => setSelectedTicket(null)} className="text-sm text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-300 mb-2">← Back to tickets</button>
            <h1 className="text-lg font-semibold text-surface-900 dark:text-white">{selectedTicket.subject}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-mono text-surface-500 dark:text-surface-400">{selectedTicket.ticket_number}</span>
              <TicketStatusBadge status={selectedTicket.status} />
              <TicketPriorityBadge priority={selectedTicket.priority as 'low' | 'normal' | 'high' | 'urgent'} />
            </div>
          </div>
        </div>

        <Card padding={false} className="overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4" style={{ maxHeight: '500px' }}>
            {chatMessages.map((msg, i) => (
              <div key={`${msg.time}-${i}`} className={classNames('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={classNames('max-w-md rounded-lg px-4 py-2.5', msg.sender === 'user' ? 'bg-brand-700 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200')}>
                  <p className="text-sm">{msg.message}</p>
                  <p className={classNames('text-xs mt-1', msg.sender === 'user' ? 'text-brand-200' : 'text-surface-400 dark:text-surface-500')}>{new Date(msg.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 dark:border-surface-800 p-4 flex gap-2">
            <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
            <Button icon={<Send className="w-4 h-4" />} onClick={sendMessage}>Send</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="dark:bg-surface-950">
      <PageHeader title="Support Center" subtitle="Get help with your account, transactions, and platform features." actions={<Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setNewTicketOpen(true)}>New Ticket</Button>} />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: LifeBuoy, title: 'Help Center', desc: 'Browse articles and FAQs', link: '/help' },
          { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with our support team', link: '#' },
          { icon: Search, title: 'Track Tickets', desc: 'View your support history', link: '#' },
        ].map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="hover:shadow-card-hover transition-shadow cursor-pointer">
              <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center mb-3"><Icon className="w-5 h-5 text-brand-700 dark:text-brand-400" /></div>
              <h3 className="text-sm font-semibold text-surface-900 dark:text-white">{c.title}</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{c.desc}</p>
            </Card>
          );
        })}
      </div>

      <Card padding={false} className="overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-200 dark:border-surface-800"><h3 className="text-sm font-semibold text-surface-900 dark:text-white">Your Support Tickets</h3></div>
        {tickets.length === 0 ? (
          <EmptyState icon={<LifeBuoy className="w-8 h-8" />} title="No support tickets" description="Create a ticket if you need help with your account." action={<Button size="sm" onClick={() => setNewTicketOpen(true)}>Create a Ticket</Button>} />
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {tickets.map(t => (
              <button key={t.id} onClick={() => openTicket(t)} className="w-full text-left px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-surface-500 dark:text-surface-400">{t.ticket_number}</span>
                    <TicketStatusBadge status={t.status} />
                  </div>
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{t.subject}</p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 truncate mt-0.5">{t.last_message}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-surface-400 dark:text-surface-500">{timeAgo(t.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Modal open={newTicketOpen} onClose={() => setNewTicketOpen(false)} title="Create Support Ticket"
        footer={<><Button variant="outline" onClick={() => setNewTicketOpen(false)}>Cancel</Button><Button onClick={createTicket}>Create Ticket</Button></>}>
        <div className="space-y-4">
          <Input label="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Briefly describe your issue" />
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Category</label>
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full h-10 px-3 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500">
              {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Message</label>
            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={5} placeholder="Describe your issue in detail..." className="w-full rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
