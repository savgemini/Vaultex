import { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Table, Pagination } from '@/components/ui/Table';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { timeAgo } from '@/lib/format';

interface Ticket {
  id: string;
  number: string;
  user: string;
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'waiting_customer' | 'waiting_support' | 'resolved' | 'closed';
  assignedTo: string | null;
  created: string;
  lastUpdate: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

export default function AdminSupportPage() {
  const { toast } = useToast();
  const { session } = useAuth();
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [replyText, setReplyText] = useState('');

  const loadTickets = useCallback(async () => {
    const { data: ticketRows, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id, ticket_number, subject, category, priority, status, assigned_to, created_at, updated_at')
      .order('updated_at', { ascending: false });

    if (ticketError) {
      toast('Failed to load support tickets from the database.', 'error');
      return;
    }

    const userIds = Array.from(new Set((ticketRows || []).map(row => row.user_id).filter(Boolean)));
    const assigneeIds = Array.from(new Set((ticketRows || []).map(row => row.assigned_to).filter(Boolean)));
    const profileIds = Array.from(new Set([...userIds, ...assigneeIds]));

    const profileMap = new Map<string, string>();
    if (profileIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds);

      if (!profileError && profileRows) {
        (profileRows as Array<{ id: string; full_name: string }>).forEach(row => {
          profileMap.set(row.id, row.full_name || 'Unknown User');
        });
      }
    }

    const rows: Ticket[] = (ticketRows || []).map((row: {
      id: string;
      user_id: string;
      ticket_number: string;
      subject: string;
      category: string;
      priority: 'low' | 'normal' | 'high' | 'urgent';
      status: 'open' | 'waiting_customer' | 'waiting_support' | 'resolved' | 'closed';
      assigned_to: string | null;
      created_at: string;
      updated_at: string;
    }) => ({
      id: row.id,
      number: row.ticket_number,
      user: profileMap.get(row.user_id) || 'Unknown User',
      subject: row.subject,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to ? (profileMap.get(row.assigned_to) || 'Unassigned') : null,
      created: row.created_at,
      lastUpdate: row.updated_at || row.created_at,
    }));

    setTickets(rows);
  }, [toast]);

  const loadMessages = useCallback(async (ticket: Ticket) => {
    const { data: messageRows, error } = await supabase
      .from('support_messages')
      .select('id, ticket_id, sender_id, message, is_internal, created_at')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (error) {
      toast('Failed to load ticket messages from the database.', 'error');
      return;
    }

    const senderIds = Array.from(new Set((messageRows || []).map(row => row.sender_id).filter(Boolean)));
    const profileMap = new Map<string, string>();
    if (senderIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      if (!profileError && profileRows) {
        (profileRows as Array<{ id: string; full_name: string }>).forEach(row => {
          profileMap.set(row.id, row.full_name || 'Unknown User');
        });
      }
    }

    const rows: TicketMessage[] = (messageRows || []).map((row: {
      id: string;
      ticket_id: string;
      sender_id: string;
      message: string;
      is_internal: boolean;
      created_at: string;
    }) => ({
      id: row.id,
      ticket_id: row.ticket_id,
      sender_id: row.sender_id,
      sender_name: profileMap.get(row.sender_id) || 'Support User',
      message: row.message,
      is_internal: row.is_internal,
      created_at: row.created_at,
    }));

    setMessages(rows);
  }, [toast]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await loadMessages(ticket);
    setTicketModalOpen(true);
  };

  const submitReply = async () => {
    if (!selectedTicket || !replyText.trim() || !session?.user?.id) {
      toast('Select a ticket and provide a reply message.', 'error');
      return;
    }

    const { error: sendError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: selectedTicket.id,
        sender_id: session.user.id,
        message: replyText.trim(),
        is_internal: false,
      });

    if (sendError) {
      toast(`Failed to send the reply: ${sendError.message}`, 'error');
      return;
    }

    await supabase
      .from('support_tickets')
      .update({
        assigned_to: session.user.id,
        status: 'waiting_customer',
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTicket.id);

    toast('Reply sent to the ticket.', 'success');
    setReplyText('');
    await loadTickets();
    await loadMessages(selectedTicket);
  };

  const stats = [
    { label: 'Open', count: tickets.filter(t => t.status === 'open').length, color: 'text-info' },
    { label: 'Waiting', count: tickets.filter(t => t.status === 'waiting_support').length, color: 'text-warning' },
    { label: 'Unassigned', count: tickets.filter(t => !t.assignedTo).length, color: 'text-surface-500' },
    { label: 'Assigned to Me', count: tickets.filter(t => t.assignedTo).length, color: 'text-brand-700' },
    { label: 'High Priority', count: tickets.filter(t => t.priority === 'high' || t.priority === 'urgent').length, color: 'text-negative' },
    { label: 'Resolved', count: tickets.filter(t => t.status === 'resolved').length, color: 'text-positive' },
  ];

  return (
    <div>
      <PageHeader title="Support Management" subtitle={`${tickets.length} support tickets`} />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {stats.map(s => (
          <Card key={s.label} padding={false} className="p-3">
            <p className="text-xs text-surface-500 dark:text-surface-400">{s.label}</p>
            <p className={`text-2xl font-bold num ${s.color}`}>{s.count}</p>
          </Card>
        ))}
      </div>

      <Table
        columns={[
          { key: 'number', header: 'Ticket #', render: (t) => <span className="text-xs font-mono text-surface-500 dark:text-surface-400">{t.number}</span> },
          { key: 'user', header: 'User', render: (t) => <span className="text-sm font-medium text-surface-900 dark:text-surface-100">{t.user}</span> },
          { key: 'subject', header: 'Subject', render: (t) => <span className="text-sm text-surface-700 dark:text-surface-300">{t.subject}</span> },
          { key: 'category', header: 'Category', render: (t) => <span className="text-sm text-surface-600 dark:text-surface-400 capitalize hidden md:table-cell">{t.category}</span> },
          { key: 'priority', header: 'Priority', align: 'center', render: (t) => <TicketPriorityBadge priority={t.priority as 'low' | 'normal' | 'high' | 'urgent'} /> },
          { key: 'status', header: 'Status', align: 'right', render: (t) => <TicketStatusBadge status={t.status as 'open' | 'waiting_customer' | 'waiting_support' | 'resolved' | 'closed'} /> },
          { key: 'assigned', header: 'Assigned', render: (t) => <span className="text-sm text-surface-600 dark:text-surface-400">{t.assignedTo || 'Unassigned'}</span> },
          { key: 'lastUpdate', header: 'Last Update', render: (t) => <span className="text-xs text-surface-500 dark:text-surface-400">{timeAgo(t.lastUpdate)}</span> },
          { key: 'actions', header: 'Action', align: 'right', render: (t) => (
            <button className="text-sm font-medium text-brand-700 dark:text-brand-400 hover:text-brand-800" onClick={(e) => { e.stopPropagation(); openTicket(t); }}>Reply</button>
          ) },
        ]}
        data={tickets}
        rowKey={(t) => t.id}
        onRowClick={(ticket) => openTicket(ticket)}
        emptyState={<EmptyState title="No support tickets" description="Support tickets will appear here when users create them." />}
      />

      <Pagination page={page} totalPages={Math.ceil(tickets.length / 10)} onPageChange={setPage} />

      <Modal open={ticketModalOpen} onClose={() => setTicketModalOpen(false)} title={selectedTicket ? `${selectedTicket.number} · ${selectedTicket.subject}` : 'Support Ticket'} size="lg">
        {selectedTicket && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">User: {selectedTicket.user}</span>
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Priority: <TicketPriorityBadge priority={selectedTicket.priority} /></span>
              <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Status: <TicketStatusBadge status={selectedTicket.status} /></span>
            </div>

            <div className="border border-surface-200 dark:border-surface-800 rounded-lg bg-surface-50 dark:bg-surface-900 p-4 space-y-3 max-h-80 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-surface-500 dark:text-surface-400">No messages yet.</p>
              ) : messages.map(message => (
                <div key={message.id} className="rounded border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950 px-3 py-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{message.sender_name}</span>
                    <span className="text-[11px] text-surface-500 dark:text-surface-400">{timeAgo(message.created_at)}</span>
                  </div>
                  <p className="text-sm text-surface-600 dark:text-surface-300 mt-2 whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200">Reply</label>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} className="w-full rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500" placeholder="Write a reply to the customer..." />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTicketModalOpen(false)}>Close</Button>
              <Button onClick={submitReply}>Send Reply</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
