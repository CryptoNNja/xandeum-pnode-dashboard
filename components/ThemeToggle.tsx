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

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-20 h-10 rounded-full backdrop-blur-md hover:bg-white/10 transition-all flex items-center justify-center group overflow-hidden"
      style={{
        background: theme === 'dark' ? 'var(--bg-card)' : 'rgb(240, 240, 245)',
        border: theme === 'dark' ? '1.5px solid var(--border-app)' : '1.5px solid rgb(210, 210, 215)',
        boxShadow: theme === 'dark'
          ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 0 16px rgba(147, 51, 234, 0.4)' // Stronger purple glow for dark
          : 'inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 16px rgba(255, 193, 7, 0.3)', // Stronger yellow glow for light
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Background glow on hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity blur-xl ${isDark ? "bg-purple-500/20" : "bg-amber-500/20" // Purple for dark, Amber for light
          }`}
      />

      {/* Icon container with sliding effect */}
      <motion.div
        key={theme} // Key to trigger re-animation on theme change
        initial={{ x: isDark ? -18 : 18, opacity: 0 }} // Initial position off-center
        animate={{ x: 0, opacity: 1 }} // Animate to center
        exit={{ x: isDark ? 18 : -18, opacity: 0 }} // Animate off-center on exit
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute z-10 flex items-center justify-center w-8 h-8 rounded-full" // Fixed size for the sliding icon
        style={{
            left: isDark ? '6px' : 'auto', // Position left for dark mode
            right: isDark ? 'auto' : '6px', // Position right for light mode
            backgroundColor: isDark ? '#9333ea' : '#F59E0B', // Purple for dark, Amber for light
            boxShadow: isDark ? '0 0 8px #9333ea' : '0 0 8px #F59E0B',
        }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-white" strokeWidth={2} /> // White icon for better contrast
        ) : (
          <Sun className="w-5 h-5 text-white" strokeWidth={2} /> // White icon for better contrast
        )}
      </motion.div>

      {/* Subtle shine effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))',
        }}
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 1,
        }}
      />
    </motion.button>
  );
};

export default ThemeToggle;