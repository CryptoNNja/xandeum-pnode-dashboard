"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";

type TooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
  delayDuration?: number;
};

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 8,
  className,
  delayDuration = 150,
}: TooltipProps) => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="z-[9999]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === "top" ? 2 : -2 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`max-w-xs px-4 py-3 rounded-xl shadow-2xl ${className || ""}`}
            style={{
              backgroundColor: isLight ? "#ffffff" : "#1a1f3a",
              border: `1.5px solid ${isLight ? "rgba(123, 63, 242, 0.25)" : "rgba(123, 63, 242, 0.4)"}`,
              boxShadow: isLight 
                ? "0 10px 40px -10px rgba(123, 63, 242, 0.15), 0 4px 12px -2px rgba(0, 0, 0, 0.08)"
                : "0 10px 40px -10px rgba(123, 63, 242, 0.3), 0 4px 12px -2px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div 
              className="text-[13px] font-medium leading-relaxed"
              style={{ color: isLight ? "#1e293b" : "#e2e8f0" }}
            >
              {content}
            </div>
            <TooltipPrimitive.Arrow 
              width={12} 
              height={6}
              style={{ fill: isLight ? "#ffffff" : "#1a1f3a" }}
            />
          </motion.div>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};
