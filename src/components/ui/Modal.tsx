import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { classNames } from '@/lib/format';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/40 animate-fade-in" onClick={onClose} />
      <div className={classNames('relative bg-white dark:bg-surface-900 rounded-lg shadow-dropdown w-full animate-slide-up max-h-[90vh] flex flex-col', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-800">
            <h2 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 p-1 rounded hover:bg-surface-100 dark:hover:bg-surface-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto scrollbar-thin flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'primary',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} className="h-10 px-4 text-sm font-medium text-surface-700 hover:bg-surface-100 rounded border border-surface-300">
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={classNames(
              'h-10 px-4 text-sm font-medium text-white rounded border',
              variant === 'danger' ? 'bg-negative hover:bg-negative-dark border-negative' : 'bg-brand-700 hover:bg-brand-800 border-brand-700',
            )}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-surface-600">{message}</p>
    </Modal>
  );
}
