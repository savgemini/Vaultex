import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { classNames } from '@/lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, suffix, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={classNames(
              'w-full h-10 rounded border bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-white placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
              icon ? 'pl-10' : '',
              suffix ? 'pr-12' : '',
              error ? 'border-negative focus:border-negative focus:ring-negative/20' : 'border-surface-300 dark:border-surface-700',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-surface-400 text-sm font-medium pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-negative">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-surface-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-surface-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={classNames(
          'w-full h-10 rounded border bg-white dark:bg-surface-800 px-3 text-sm text-surface-900 dark:text-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500',
          error ? 'border-negative' : 'border-surface-300 dark:border-surface-700',
          className,
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-negative">{error}</p>}
    </div>
  );
}
