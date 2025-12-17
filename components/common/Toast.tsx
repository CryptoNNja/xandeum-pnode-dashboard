'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(toast.id), 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: { 
      bg: 'rgba(34, 197, 94, 0.15)', 
      border: 'rgba(34, 197, 94, 0.4)', 
      icon: '#22c55e' 
    },
    error: { 
      bg: 'rgba(239, 68, 68, 0.15)', 
      border: 'rgba(239, 68, 68, 0.4)', 
      icon: '#ef4444' 
    },
    warning: { 
      bg: 'rgba(234, 179, 8, 0.15)', 
      border: 'rgba(234, 179, 8, 0.4)', 
      icon: '#eab308' 
    },
    info: { 
      bg: 'rgba(59, 130, 246, 0.15)', 
      border: 'rgba(59, 130, 246, 0.4)', 
      icon: '#3b82f6' 
    },
  };

  const Icon = icons[toast.type];
  const colorScheme = colors[toast.type];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="rounded-lg p-4 shadow-lg backdrop-blur-sm min-w-[300px] max-w-[500px] theme-transition"
      style={{
        backgroundColor: colorScheme.bg,
        border: `1px solid ${colorScheme.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <Icon 
          className="w-5 h-5 flex-shrink-0 mt-0.5" 
          strokeWidth={2}
          style={{ color: colorScheme.icon }}
        />
        <div className="flex-1">
          <p className="text-sm font-medium theme-transition" style={{ color: 'var(--text-main)' }}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onRemove(toast.id), 300);
          }}
          className="theme-transition flex-shrink-0"
          style={{ 
            color: 'var(--text-faint)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-faint)';
          }}
          aria-label="Close"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Hook pour utiliser les toasts
let toastIdCounter = 0;
const toastListeners = new Set<(toast: Toast) => void>();

export const useToast = () => {
  const showToast = (type: ToastType, message: string, duration?: number) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${toastIdCounter++}`,
      type,
      message,
      duration,
    };
    toastListeners.forEach((listener) => listener(toast));
  };

  return {
    success: (message: string, duration?: number) => showToast('success', message, duration),
    error: (message: string, duration?: number) => showToast('error', message, duration),
    warning: (message: string, duration?: number) => showToast('warning', message, duration),
    info: (message: string, duration?: number) => showToast('info', message, duration),
  };
};

// Provider component pour gérer les toasts globalement
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
    };
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

