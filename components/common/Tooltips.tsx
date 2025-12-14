
"use client";

import clsx from "clsx";
import React from "react";

export const TOOLTIP_STYLES = `
  .custom-tooltip {
    background: var(--bg-card);
    border: 1px solid var(--border-app);
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 20px 40px rgba(5,9,20,0.35);
    color: var(--text-main);
  }
  .custom-tooltip p {
    margin: 0;
  }
  .recharts-tooltip-wrapper {
    outline: none;
  }
`;

export const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: unknown; color?: string; fill?: string }>; label?: unknown; }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    return (
      <div className="custom-tooltip text-sm">
        <p className="text-[10px] uppercase tracking-[0.35em] text-text-faint mb-2">
          {String(label ?? payload[0]?.name ?? "")}
        </p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 text-text-main">
            <span
              className="w-2.5 h-2.5 rounded-full inline-flex"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="font-mono font-semibold">{String(entry.value ?? "")}</span>
          </div>
        ))}
      </div>
    );
};

export const ToolbarTooltip = ({ label }: { label: string }) => (
    <span
      className="pointer-events-none absolute left-1/2 top-full mt-2 w-max max-w-[260px] -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-app bg-bg-card px-3 py-2 text-[11px] text-text-main opacity-0 shadow-2xl translate-y-1 scale-[0.98] transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100"
      role="tooltip"
    >
      {label}
    </span>
);

export const TOOLBAR_BUTTON_BASE = "relative group p-2 rounded-lg hover:bg-white/5 transition-colors";
