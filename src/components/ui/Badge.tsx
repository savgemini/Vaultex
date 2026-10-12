import { type ReactNode } from 'react';
import { classNames } from '@/lib/format';
import type {
  TransactionStatus, OrderStatus, AccountStatus, VerificationLevel,
  ProductStatus, TicketStatus, TicketPriority, MethodStatus, InvestmentStatus,
  RiskLevel,
} from '@/types';

type BadgeVariant = 'neutral' | 'positive' | 'negative' | 'pending' | 'info' | 'restricted' | 'warning' | 'completed' | 'failed';

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-surface-700',
  positive: 'bg-positive-light dark:bg-positive/15 text-positive-dark dark:text-positive border-positive/20 dark:border-positive/30',
  negative: 'bg-negative-light dark:bg-negative/15 text-negative-dark dark:text-negative border-negative/20 dark:border-negative/30',
  pending: 'bg-pending-light dark:bg-pending/15 text-pending-dark dark:text-pending border-pending/20 dark:border-pending/30',
  info: 'bg-info-light dark:bg-info/15 text-info-dark dark:text-info border-info/20 dark:border-info/30',
  restricted: 'bg-restricted-light dark:bg-restricted/15 text-restricted-dark dark:text-restricted border-restricted/20 dark:border-restricted/30',
  warning: 'bg-warning-light dark:bg-warning/15 text-warning-dark dark:text-warning border-warning/20 dark:border-warning/30',
  completed: 'bg-positive-light dark:bg-positive/15 text-positive-dark dark:text-positive border-positive/20 dark:border-positive/30',
  failed: 'bg-negative-light dark:bg-negative/15 text-negative-dark dark:text-negative border-negative/20 dark:border-negative/30',
};

export function Badge({ variant = 'neutral', children, className }: { variant?: BadgeVariant; children: ReactNode; className?: string }) {
  return (
    <span className={classNames(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap',
      variantStyles[variant],
      className,
    )}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: TransactionStatus | OrderStatus | string }) {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    pending: { variant: 'pending', label: 'Pending' },
    under_review: { variant: 'pending', label: 'Under Review' },
    confirmed: { variant: 'info', label: 'Confirmed' },
    completed: { variant: 'completed', label: 'Completed' },
    rejected: { variant: 'failed', label: 'Rejected' },
    expired: { variant: 'neutral', label: 'Expired' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
    processing: { variant: 'info', label: 'Processing' },
    approved: { variant: 'info', label: 'Approved' },
    partially_filled: { variant: 'pending', label: 'Partially Filled' },
    filled: { variant: 'completed', label: 'Filled' },
    open: { variant: 'info', label: 'Open' },
  };
  const config = map[status] || { variant: 'neutral' as BadgeVariant, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const map: Record<AccountStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'positive', label: 'Active' },
    pending_verification: { variant: 'pending', label: 'Pending Verification' },
    restricted: { variant: 'restricted', label: 'Restricted' },
    suspended: { variant: 'negative', label: 'Suspended' },
    closed: { variant: 'neutral', label: 'Closed' },
  };
  const config = map[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  const map: Record<VerificationLevel, { variant: BadgeVariant; label: string }> = {
    unverified: { variant: 'neutral', label: 'Unverified' },
    basic: { variant: 'info', label: 'Basic' },
    verified: { variant: 'positive', label: 'Verified' },
    rejected: { variant: 'negative', label: 'Rejected' },
  };
  const config = map[level];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'positive', label: 'Active' },
    paused: { variant: 'pending', label: 'Paused' },
    coming_soon: { variant: 'info', label: 'Coming Soon' },
    closed: { variant: 'neutral', label: 'Closed' },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const map: Record<TicketStatus, { variant: BadgeVariant; label: string }> = {
    open: { variant: 'info', label: 'Open' },
    waiting_customer: { variant: 'pending', label: 'Waiting for Customer' },
    waiting_support: { variant: 'warning', label: 'Waiting for Support' },
    resolved: { variant: 'positive', label: 'Resolved' },
    closed: { variant: 'neutral', label: 'Closed' },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const map: Record<TicketPriority, { variant: BadgeVariant; label: string }> = {
    low: { variant: 'neutral', label: 'Low' },
    normal: { variant: 'info', label: 'Normal' },
    high: { variant: 'warning', label: 'High' },
    urgent: { variant: 'negative', label: 'Urgent' },
  };
  return <Badge variant={map[priority].variant}>{map[priority].label}</Badge>;
}

export function MethodStatusBadge({ status }: { status: MethodStatus }) {
  const map: Record<MethodStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'positive', label: 'Active' },
    inactive: { variant: 'neutral', label: 'Inactive' },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}

export function InvestmentStatusBadge({ status }: { status: InvestmentStatus }) {
  const map: Record<InvestmentStatus, { variant: BadgeVariant; label: string }> = {
    active: { variant: 'positive', label: 'Active' },
    completed: { variant: 'completed', label: 'Completed' },
    cancelled: { variant: 'neutral', label: 'Cancelled' },
    pending: { variant: 'pending', label: 'Pending' },
  };
  return <Badge variant={map[status].variant}>{map[status].label}</Badge>;
}

export function RiskLevelBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { variant: BadgeVariant; label: string }> = {
    low: { variant: 'positive', label: 'Low Risk' },
    medium: { variant: 'warning', label: 'Medium Risk' },
    high: { variant: 'negative', label: 'High Risk' },
  };
  return <Badge variant={map[level].variant}>{map[level].label}</Badge>;
}
