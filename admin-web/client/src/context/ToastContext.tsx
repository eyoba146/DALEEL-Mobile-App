import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string, duration = 4200) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const defaultTitle =
        title ||
        (type === 'success'
          ? 'Operation Successful'
          : type === 'error'
          ? 'Action Failed'
          : type === 'warning'
          ? 'Attention Required'
          : 'Notice');

      const newToast: ToastItem = {
        id,
        type,
        title: defaultTitle,
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast(message, 'success', title),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast(message, 'error', title),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast(message, 'info', title),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast(message, 'warning', title),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Floating Bottom-Right Toast Container */}
      <div style={styles.toastContainer} aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          const accentColor = isSuccess
            ? '#10B981'
            : isError
            ? '#EF4444'
            : isWarning
            ? '#DFB76C'
            : '#38BDF8';

          return (
            <div
              key={toast.id}
              style={{
                ...styles.toastCard,
                borderLeft: `4px solid ${accentColor}`,
              }}
              className="toast-slide-in"
            >
              {/* Icon */}
              <div style={styles.iconWrap}>
                {isSuccess && <CheckCircle2 size={19} color="#10B981" />}
                {isError && <AlertCircle size={19} color="#EF4444" />}
                {isWarning && <AlertTriangle size={19} color="#DFB76C" />}
                {!isSuccess && !isError && !isWarning && <Info size={19} color="#38BDF8" />}
              </div>

              {/* Text content strictly left-aligned */}
              <div style={styles.contentWrap}>
                {toast.title && <div style={styles.toastTitle}>{toast.title}</div>}
                <div style={styles.toastMessage}>{toast.message}</div>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                style={styles.closeBtn}
                onClick={() => removeToast(toast.id)}
                title="Dismiss message"
              >
                <X size={14} color="#8A9AA8" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles: { [key: string]: React.CSSProperties } = {
  toastContainer: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 99999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '440px',
    width: 'calc(100vw - 48px)',
    pointerEvents: 'none',
  },
  toastCard: {
    pointerEvents: 'auto',
    backgroundColor: '#07152B',
    color: '#FFFFFF',
    borderRadius: '14px',
    padding: '16px 18px',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
    textAlign: 'left',
  },
  iconWrap: {
    flexShrink: 0,
    marginTop: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    textAlign: 'left',
  },
  toastTitle: {
    fontSize: '13.5px',
    fontWeight: 750,
    color: '#FFFFFF',
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    textAlign: 'left',
  },
  toastMessage: {
    fontSize: '13px',
    color: '#CBD5E1',
    lineHeight: 1.5,
    margin: 0,
    wordBreak: 'break-word',
    textAlign: 'left',
  },
  closeBtn: {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    padding: '4px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8A9AA8',
    transition: 'color 0.15s ease',
  },
};
