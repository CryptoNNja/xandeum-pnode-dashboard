"use client";

import React, { memo } from "react";
import { ChevronDown, Info } from "lucide-react";
import { getStatusColors } from "@/lib/utils";

type HealthDistributionProps = {
  healthDistribution: {
    excellent: number;
    good: number;
    warning: number;
    critical: number;
  };
  totalNodes: number;
};

const HealthDistributionComponent = ({
  healthDistribution,
  totalNodes,
}: HealthDistributionProps) => {
  const statusColors = getStatusColors();
  
  const stats = [
    { label: "EXCELLENT", count: healthDistribution.excellent, color: statusColors.excellent, trend: "stable" },
    { label: "GOOD", count: healthDistribution.good, color: statusColors.good, trend: "stable" },
    { label: "WARNING", count: healthDistribution.warning, color: statusColors.warning, trend: "stable" },
    { label: "CRITICAL", count: healthDistribution.critical, color: statusColors.critical, trend: "stable" },
  ];

  const getPercent = (count: number) => (totalNodes > 0 ? Math.round((count / totalNodes) * 100) : 0);
  const excellentPercent = getPercent(healthDistribution.excellent);

  return (
    <div className="kpi-card p-8 rounded-2xl border border-border-app shadow-xl theme-transition">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-main">Health Distribution</h3>
        <button className="flex items-center gap-2 px-4 py-2 bg-bg-bg border border-border-app rounded-xl text-xs font-bold text-text-main hover:border-accent-aqua transition-all">
          All p-nodes ({totalNodes})
          <ChevronDown className="w-4 h-4 text-text-soft" />
        </button>
      </div>

      <div className="space-y-6">
        {stats.map((item) => {
          const percent = getPercent(item.count);
          return (
            <div key={item.label} className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black tracking-[0.15em]">
                <span className="text-text-main">{item.label}</span>
                <div className="flex items-center gap-2 text-text-soft">
                  <span className="text-text-main">{item.count}</span>
                  <span>({percent}%)</span>
                  <span className="text-text-faint">→</span>
                  <span className="text-text-soft">{item.trend}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                <div 
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                  style={{ 
                    width: `${percent}%`, 
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}40`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border-app/50 flex justify-center">
        <div className="flex items-center gap-2 text-[11px] text-text-soft font-medium italic">
          <Info className="w-3.5 h-3.5 text-accent-aqua" />
          <span>{excellentPercent}% of all p-nodes in excellent health</span>
        </div>
      </div>
    </div>
  );
};

export const HealthDistribution = memo(HealthDistributionComponent);
HealthDistribution.displayName = "HealthDistribution";
