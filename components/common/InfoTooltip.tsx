"use client";

import React from "react";
import { Info } from "lucide-react";
import { Tooltip } from "./Tooltip";

type InfoTooltipProps = {
  content: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
};

export const InfoTooltip = ({ content, className, side = "top" }: InfoTooltipProps) => {
  return (
    <Tooltip content={content} side={side} align="center">
      <div className={`inline-flex items-center shrink-0 cursor-help group ${className || ""}`}>
        <Info className="w-3.5 h-3.5 text-text-soft group-hover:text-accent-aqua transition-colors" />
      </div>
    </Tooltip>
  );
};
