'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileJson, Link2, Star, X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions: ActionItem[];
}

export default function FloatingActionButton({ actions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
            style={{
              background: isLight 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(5, 9, 20, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50"
            style={{
              background: isLight ? '#ffffff' : 'rgba(16, 23, 52, 0.95)',
              border: `1px solid ${isLight ? 'rgba(15, 23, 42, 0.1)' : 'rgba(123, 63, 242, 0.3)'}`,
              borderRadius: '16px',
              boxShadow: isLight
                ? '0 20px 60px rgba(0, 0, 0, 0.15)'
                : '0 20px 60px rgba(123, 63, 242, 0.25)',
              minWidth: '240px',
            }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  color: isLight ? '#1e293b' : '#e2e8f0',
                  borderBottom: index < actions.length - 1 
                    ? `1px solid ${isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.05)'}`
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isLight 
                    ? 'rgba(123, 63, 242, 0.05)' 
                    : 'rgba(123, 63, 242, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-lg"
                  style={{ 
                    background: `${action.color}15`,
                    color: action.color 
                  }}
                >
                  {action.icon}
                </div>
                <span>{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl cursor-pointer"
        style={{
          background: isOpen 
            ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
            : 'linear-gradient(135deg, #14f195 0%, #7B3FF2 100%)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}
        whileHover={{ scale: 1.1, rotate: isOpen ? 90 : 0 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        ) : (
          <Download className="w-5 h-5 text-white" strokeWidth={2.5} />
        )}
      </motion.button>
    </>
  );
}
