
"use client";

import React from "react";
import clsx from "clsx";
import { ChevronDown, Check, Lightbulb } from "lucide-react";
import type { PNode } from "@/lib/types";

type HealthDistributionProps = {
    isLight: boolean;
    isHealthMenuOpen: boolean;
    setIsHealthMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
    healthMenuRef: React.RefObject<HTMLDivElement>;
    healthFilter: "all" | "public" | "private";
    setHealthFilter: (filter: "all" | "public" | "private") => void;
    pnodes: PNode[];
    publicCount: number;
    privateCount: number;
    healthTrendData: Array<{
        key: string;
        label: string;
        color: string;
        percentage: number;
        count: number;
        delta: number;
    }>;
    healthInsight: {
        label: string;
        percent: number;
    };
};

export const HealthDistribution = ({
    isLight,
    isHealthMenuOpen,
    setIsHealthMenuOpen,
    healthMenuRef,
    healthFilter,
    setHealthFilter,
    pnodes,
    publicCount,
    privateCount,
    healthTrendData,
    healthInsight,
}: HealthDistributionProps) => {
    return (
        <div className="bg-bg-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-text-main">
            Health Distribution
          </h2>
          <div className="relative" ref={healthMenuRef}>
            <button
              type="button"
              onClick={() => setIsHealthMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-app text-sm text-text-main shadow-[0_10px_30px_rgba(5,9,20,0.35)] theme-transition"
              style={{
                backgroundColor: isLight ? "rgba(247,249,255,0.98)" : "rgba(5,9,24,0.97)",
                borderColor: isLight ? "rgba(15,23,42,0.12)" : "rgba(226,232,240,0.08)",
              }}
            >
              <span>
                {healthFilter === "all"
                  ? `All p-nodes (${pnodes.length})`
                  : healthFilter === "public"
                    ? `Public only (${publicCount})`
                    : `Private only (${privateCount})`}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-text-soft transition-transform ${isHealthMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isHealthMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-60 rounded-xl border border-border-app shadow-[0_30px_60px_rgba(2,6,23,0.65)] z-30 overflow-hidden"
                style={{
                  backgroundColor: isLight ? "rgba(247,249,255,0.99)" : "rgba(4,8,22,0.99)",
                  borderColor: isLight ? "rgba(15,23,42,0.12)" : "rgba(226,232,240,0.08)",
                }}
              >
                {(
                  [
                    { key: "all" as const, label: "All p-nodes", count: pnodes.length },
                    { key: "public" as const, label: "Public only", count: publicCount },
                    { key: "private" as const, label: "Private only", count: privateCount },
                  ]
                ).map((option) => {
                  const active = option.key === healthFilter;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setHealthFilter(option.key);
                        setIsHealthMenuOpen(false);
                      }}
                      className={clsx(
                        "w-full px-4 py-4 text-sm flex items-center justify-between",
                        active
                          ? "bg-accent-aqua/15 text-accent-aqua"
                          : "text-text-main hover:bg-bg-bg2"
                      )}
                    >
                      <span>{`${option.label} (${option.count})`}</span>
                      {active && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <style>{`
          .recharts-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
          }
          .recharts-default-tooltip {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
        `}</style>
        <div className="space-y-4">
          {healthTrendData.map((item) => {
            const isPositive = item.delta > 0;
            const isNegative = item.delta < 0;
            const trendIcon = isPositive ? "▲" : isNegative ? "▼" : "→";
            const trendLabel = item.delta !== 0 ? `${Math.abs(item.delta)}%` : "stable";

            return (
              <div key={item.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-soft uppercase tracking-wider">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-text-main font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                    <span
                      className={clsx(
                        "flex items-center gap-2 font-semibold",
                        isPositive
                          ? "text-green-400"
                          : isNegative
                            ? "text-red-400"
                            : "text-text-faint"
                      )}
                    >
                      <span>{trendIcon}</span>
                      <span>{trendLabel}</span>
                    </span>
                  </div>
                </div>
                <div className="w-full bg-bg-bg2 rounded-full overflow-hidden h-2 border border-border-app">
                  <div
                    className="h-full transition-all"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-faint">
          <Lightbulb className="w-4 h-4" />
          <span>
            {healthInsight.percent}% of {healthInsight.label} in excellent health
          </span>
        </div>
      </div>
    );
};
