import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

const toastConfig = {
  success: {
    bg: 'bg-success-50',
    border: 'border-success-500',
    text: 'text-success-600',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-error-50',
    border: 'border-error-500',
    text: 'text-error-600',
    icon: XCircle,
  },
  warning: {
    bg: 'bg-warning-50',
    border: 'border-warning-500',
    text: 'text-warning-600',
    icon: AlertTriangle,
  },
  info: {
    bg: 'bg-primary-50',
    border: 'border-primary-500',
    text: 'text-primary-600',
    icon: Info,
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`
                flex items-center gap-3 px-5 py-4 rounded-2xl shadow-elevated
                border-l-4 ${config.bg} ${config.border}
                min-w-[320px] max-w-md
                animate-[slideIn_0.3s_ease-out]
              `}
              style={{
                animation: 'slideIn 0.3s ease-out',
              }}
            >
              <div
                className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-5 h-5 ${config.text}`} />
              </div>
              <span className="text-gray-700 font-medium flex-1">
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1.5 rounded-lg hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 transition-smooth"
                aria-label="Dismiss"
                title="Dismiss notification"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
