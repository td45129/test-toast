import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Toast } from '../types/types';
import { ToastItem } from '../components/ToastItem';

interface InternalToast extends Toast {
  resetKey: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<InternalToast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts(prev => {
      const existing = prev.find(t => t.message === toast.message && t.type === toast.type);
      if (existing) {
        return prev.map(t =>
          t.id === existing.id ? { ...t, resetKey: t.resetKey + 1 } : t
        );
      }

      const newToast: InternalToast = {
        ...toast,
        id: `${Date.now()}-${Math.random()}`,
        resetKey: 0,
      };
      return [...prev, newToast];
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-list">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            resetKey={toast.resetKey}
            onRemove={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
