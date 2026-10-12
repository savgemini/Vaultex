import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { classNames } from '@/lib/format';

interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function Search({ value, onChange, placeholder = 'Search...', className }: SearchProps) {
  return (
    <div className={classNames('relative', className)}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-10 pr-9 rounded border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export function Dropdown({ trigger, children, align = 'right', width = 'w-56' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div className={classNames(
          'absolute top-full mt-1 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-lg shadow-dropdown py-1 z-50 animate-fade-in',
          align === 'right' ? 'right-0' : 'left-0',
          width,
        )}>
          <div onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'danger';
}

export function DropdownItem({ onClick, children, icon, variant = 'default' }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors',
        variant === 'danger' ? 'text-negative hover:bg-negative-light dark:hover:bg-negative/15' : 'text-surface-700 dark:text-surface-300',
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div className="my-1 border-t border-surface-100 dark:border-surface-800" />;
}
