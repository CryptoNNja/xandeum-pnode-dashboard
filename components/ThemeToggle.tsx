"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useHydrated } from "@/hooks/useHydrated";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, mounted } = useTheme();
  const hasHydrated = useHydrated();

  if (!mounted || !hasHydrated) {
    return (
      <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 animate-pulse" />
    );
  }

  const isDark = theme === "dark";

  const handleToggle = () => {
    // Haptic feedback on mobile
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    toggleTheme();
  };

  return (
    <motion.button
      onClick={handleToggle}
      className="relative w-20 h-10 rounded-full backdrop-blur-md hover:bg-white/10 flex items-center justify-center group overflow-hidden"
      style={{
        background: theme === 'dark' ? 'var(--bg-card)' : 'rgb(240, 240, 245)',
        border: theme === 'dark' ? '1.5px solid var(--border-app)' : '1.5px solid rgb(210, 210, 215)',
        boxShadow: theme === 'dark'
          ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 16px rgba(147, 51, 234, 0.4)'
          : 'inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 16px rgba(255, 193, 7, 0.3)',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Background glow on hover */}
      <motion.div
        className={`absolute inset-0 blur-xl ${isDark ? "bg-purple-500/20" : "bg-amber-500/20"}`}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon container with sliding + rotation effect */}
      <motion.div
        key={theme}
        initial={{ 
          x: isDark ? -18 : 18, 
          opacity: 0,
          rotate: isDark ? -180 : 180,
          scale: 0.5
        }}
        animate={{ 
          x: 0, 
          opacity: 1,
          rotate: 0,
          scale: 1
        }}
        exit={{ 
          x: isDark ? 18 : -18, 
          opacity: 0,
          rotate: isDark ? 180 : -180,
          scale: 0.5
        }}
        transition={{ 
          duration: 0.5, 
          ease: [0.34, 1.56, 0.64, 1], // Custom easing for bounce effect
          opacity: { duration: 0.3 }
        }}
        className="absolute z-10 flex items-center justify-center w-8 h-8 rounded-full"
        style={{
            left: isDark ? '6px' : 'auto',
            right: isDark ? 'auto' : '6px',
            backgroundColor: isDark ? '#9333ea' : '#F59E0B',
            boxShadow: isDark ? '0 0 12px #9333ea, inset 0 1px 2px rgba(255,255,255,0.2)' : '0 0 12px #F59E0B, inset 0 1px 2px rgba(255,255,255,0.3)',
        }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isDark ? 0 : 360 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-white" strokeWidth={2} />
          ) : (
            <Sun className="w-5 h-5 text-white" strokeWidth={2} />
          )}
        </motion.div>
      </motion.div>

      {/* Subtle shine effect - smoother */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))',
        }}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatDelay: 1.5,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle;