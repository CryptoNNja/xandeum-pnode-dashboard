"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor: string;
  id?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  description,
  children,
  defaultOpen = true,
  accentColor,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4" id={id}>
      {/* Section Header - Clickable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full group"
      >
        <div className="flex items-center justify-between p-4 rounded-xl border border-border-app bg-bg-card hover:bg-bg-card/80 transition-all duration-200 shadow-sm hover:shadow-md">
          <div className="flex items-center gap-3">
            {/* Icon with accent color */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
                border: `1px solid ${accentColor}30`,
              }}
            >
              <div style={{ color: accentColor }}>
                {icon}
              </div>
            </div>

            {/* Title & Description */}
            <div className="text-left">
              <h3 className="text-sm font-bold tracking-wide" style={{ color: accentColor }}>
                {title}
              </h3>
              <p className="text-xs text-text-faint mt-0.5">{description}</p>
            </div>
          </div>

          {/* Chevron indicator */}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-text-soft group-hover:text-text-main transition-colors"
          >
            <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
          </motion.div>
        </div>
      </button>

      {/* Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
