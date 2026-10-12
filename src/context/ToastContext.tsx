import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-positive" />,
  error: <XCircle className="w-5 h-5 text-negative" />,
  warning: <AlertCircle className="w-5 h-5 text-pending" />,
  info: <Info className="w-5 h-5 text-info" />,
};

const borders: Record<ToastType, string> = {
  success: 'border-l-positive',
  error: 'border-l-negative',
  warning: 'border-l-pending',
  info: 'border-l-info',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`bg-white border border-surface-200 ${borders[t.type]} border-l-4 rounded shadow-dropdown animate-slide-up flex items-start gap-3 p-4 pr-3`}
          >
            <div className="shrink-0 mt-0.5">{icons[t.type]}</div>
            <p className="text-sm text-surface-800 flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-surface-400 hover:text-surface-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
