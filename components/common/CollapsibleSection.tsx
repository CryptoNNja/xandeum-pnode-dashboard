
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '@/hooks/useTheme';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  Icon?: LucideIcon; // New prop for the icon
  iconColorClass?: string; // New prop for icon color (Tailwind class)
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultCollapsed = false,
  className,
  headerClassName,
  contentClassName,
  Icon, // Destructure new prop
  iconColorClass = "text-text-soft", // Default color
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const contentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Function to get the height of the content dynamically
  const getContentHeight = () => contentRef.current ? contentRef.current.scrollHeight : 0;

  return (
    <div
      className={clsx(
        "bg-bg-card border border-border-app rounded-xl shadow-card-shadow theme-transition overflow-hidden",
        className
      )}
    >
      <div
        className={clsx(
          "flex items-center justify-between p-6 cursor-pointer theme-transition",
          isLight ? "hover:bg-gray-50" : "hover:bg-bg-bg2", // Subtle hover for light/dark
          headerClassName
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3"> {/* Container for icon and title */}
          {Icon && <Icon className={clsx("w-5 h-5", iconColorClass)} />} {/* Render icon if provided */}
          <h2 className="text-sm font-semibold text-text-main uppercase tracking-wider">
            {title}
          </h2>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-text-soft" />
        </motion.div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ height: { duration: 0.3, ease: "easeInOut" }, opacity: { duration: 0.2, ease: "easeInOut" } }}
            style={{ overflow: 'hidden' }}
          >
            <div ref={contentRef} className={clsx("p-6 pt-0", contentClassName)}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
