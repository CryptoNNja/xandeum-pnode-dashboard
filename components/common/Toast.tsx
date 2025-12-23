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

  // Helper to get CSS variable value
  const getCssVar = (varName: string, fallback: string): string => {
    if (typeof window === "undefined") return fallback;
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
  };

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const sanitized = hex.replace("#", "");
    const expanded = sanitized.length === 3
      ? sanitized.split("").map((char) => char + char).join("")
      : sanitized;
    const bigint = Number.parseInt(expanded, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const successColor = getCssVar("--kpi-excellent", "#22c55e");
  const errorColor = getCssVar("--kpi-critical", "#ef4444");
  const warningColor = getCssVar("--kpi-warning", "#eab308");
  const infoColor = getCssVar("--kpi-good", "#3b82f6");

  const colors = {
    success: { 
      bg: hexToRgba(successColor, 0.15), 
      border: hexToRgba(successColor, 0.4), 
      icon: successColor
    },
    error: { 
      bg: hexToRgba(errorColor, 0.15), 
      border: hexToRgba(errorColor, 0.4), 
      icon: errorColor
    },
    warning: { 
      bg: hexToRgba(warningColor, 0.15), 
      border: hexToRgba(warningColor, 0.4), 
      icon: warningColor
    },
    info: { 
      bg: hexToRgba(infoColor, 0.15), 
      border: hexToRgba(infoColor, 0.4), 
      icon: infoColor
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

// Hook to use toasts
let toastIdCounter = 0;
const toastListeners = new Set<(toast: Toast) => void>();

const showToast = (type: ToastType, message: string, duration?: number) => {
  const toast: Toast = {
    id: `toast-${Date.now()}-${toastIdCounter++}`,
    type,
    message,
    duration,
  };
  toastListeners.forEach((listener) => listener(toast));
};

export const useToast = () => {
  return {
    success: (message: string, duration?: number) => showToast('success', message, duration),
    error: (message: string, duration?: number) => showToast('error', message, duration),
    warning: (message: string, duration?: number) => showToast('warning', message, duration),
    info: (message: string, duration?: number) => showToast('info', message, duration),
  };
};

// Provider component to manage toasts globally
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

