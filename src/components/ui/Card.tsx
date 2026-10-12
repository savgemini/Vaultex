import { type ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div className={classNames('bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-card dark:shadow-none', padding && 'p-5', className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  change?: number;
  icon?: ReactNode;
  subtitle?: string;
}

export function StatCard({ label, value, change, icon, subtitle }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-semibold text-surface-900 dark:text-white mt-1 num">{value}</p>
          {subtitle && <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">{subtitle}</p>}
          {change !== undefined && (
            <p className={classNames('text-xs font-medium mt-1 num', change >= 0 ? 'text-positive' : 'text-negative')}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </p>
          )}
        </div>
        {icon && <div className="text-surface-400 dark:text-surface-500 ml-3">{icon}</div>}
      </div>
    </Card>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="text-surface-300 dark:text-surface-600 mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold text-surface-700 dark:text-surface-200">{title}</h3>
      {description && <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 className="text-xl font-semibold text-surface-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface TabsProps {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="border-b border-surface-200 dark:border-surface-800 flex items-center gap-1 overflow-x-auto scrollbar-thin">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={classNames(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
            active === tab.key
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:border-surface-300 dark:hover:border-surface-600',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={classNames('ml-1.5 text-xs px-1.5 py-0.5 rounded', active === tab.key ? 'bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300' : 'bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
