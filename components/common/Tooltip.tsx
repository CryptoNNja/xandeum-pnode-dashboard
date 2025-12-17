"use client";

import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { motion } from "framer-motion";

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
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={`
              max-w-xs px-3 py-2
              bg-bg-card border border-border-app rounded-xl 
              shadow-2xl
              text-text-main text-[12px] font-semibold leading-relaxed
              theme-transition
              ${className || ""}
            `}
          >
            {content}
            <TooltipPrimitive.Arrow 
              className="fill-border-app" 
              width={12} 
              height={6} 
            />
          </motion.div>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};
