import { type ReactNode } from 'react';
import { classNames } from '@/lib/format';

interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  rowKey?: (row: T) => string;
  className?: string;
}

export function Table<T extends object>({
  columns, data, loading, emptyState, onRowClick, rowKey, className,
}: TableProps<T>) {
  const alignClass = (align?: string) => align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (loading) {
    return (
      <div className="border border-surface-200 dark:border-surface-800 rounded-lg overflow-hidden">
        <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-4 py-3">
          <div className="flex gap-4">
            {columns.map((c, i) => (
              <div key={i} className={`h-4 bg-surface-200 dark:bg-surface-800 rounded animate-pulse ${c.width || 'flex-1'}`} style={{ maxWidth: c.width || '200px' }} />
            ))}
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border-b border-surface-100 dark:border-surface-800 px-4 py-3.5">
            <div className="flex gap-4">
              {columns.map((c, j) => (
                <div key={j} className="h-4 bg-surface-100 dark:bg-surface-800 rounded animate-pulse" style={{ width: '80%', maxWidth: c.width || '150px' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="border border-surface-200 rounded-lg overflow-hidden">
        <div className="px-4 py-16 text-center">
          {emptyState || <p className="text-sm text-surface-500">No records found.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={classNames('border border-surface-200 dark:border-surface-800 rounded-lg overflow-x-auto scrollbar-thin', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800">
            {columns.map(col => (
              <th
                key={col.key}
                className={`px-4 py-2.5 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wide ${alignClass(col.align)}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
          {data.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row) : i}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer' : 'hover:bg-surface-50/50 dark:hover:bg-surface-800/50'}
            >
              {columns.map(col => (
                <td key={col.key} className={`px-4 py-3 text-sm text-surface-700 dark:text-surface-300 ${alignClass(col.align)}`}>
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-xs text-surface-500 dark:text-surface-400">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="h-8 px-3 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded border border-surface-200 dark:border-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 text-sm rounded border ${
              p === page
                ? 'bg-brand-700 text-white border-brand-700'
                : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 border-surface-200 dark:border-surface-700'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="h-8 px-3 text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded border border-surface-200 dark:border-surface-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
