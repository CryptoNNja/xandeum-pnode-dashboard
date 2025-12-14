
"use client";

import {
  Radio,
  ShieldCheck,
  Network,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { hexToRgba, KPI_COLORS } from "@/lib/utils"; // Assuming KPI_COLORS and hexToRgba are in lib/utils

type SummaryHeaderProps = {
  publicCount: number;
  privateCount: number;
  totalNodes: number;
  networkHealthInsights: {
    score: number;
    delta: number;
    color: string;
    trendIcon: string;
    trendColor: string;
    svgWidth: number;
    svgHeight: number;
    sparklinePoints: string;
    sparklineAreaPoints: string;
    sparklineFill: string;
  };
  networkUptimeStats: {
    badge: string;
    color: string;
    Icon: LucideIcon;
    percent: number;
    publicOnline: number;
    publicTotal: number;
  };
};

export const SummaryHeader = ({
  publicCount,
  privateCount,
  totalNodes,
  networkHealthInsights,
  networkUptimeStats,
}: SummaryHeaderProps) => {
  const UptimeIcon = networkUptimeStats.Icon;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Public Nodes */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
              Public Nodes
            </p>
            <p className="text-4xl font-bold text-text-main mt-2">
              {publicCount}
            </p>
            <p className="text-sm text-text-soft mt-2">Public storage network</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(KPI_COLORS.public, 0.12) }}
          >
            <Radio
              className="w-5 h-5"
              strokeWidth={2.2}
              style={{ color: KPI_COLORS.public }}
            />
          </div>
        </div>
      </div>

      {/* Private Nodes */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
              Private Nodes
            </p>
            <p className="text-4xl font-bold text-text-main mt-2">
              {privateCount}
            </p>
            <p className="text-sm text-text-soft mt-2">Private storage network</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(KPI_COLORS.private, 0.12) }}
          >
            <ShieldCheck
              className="w-5 h-5"
              strokeWidth={2.2}
              style={{ color: KPI_COLORS.private }}
            />
          </div>
        </div>
      </div>

      {/* Total Nodes */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
              Total Nodes
            </p>
            <p className="text-4xl font-bold text-text-main mt-2">
              {totalNodes}
            </p>
            <p className="text-sm text-text-soft mt-2">Total network size</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(KPI_COLORS.total, 0.12) }}
          >
            <Network
              className="w-5 h-5"
              strokeWidth={2.2}
              style={{ color: KPI_COLORS.total }}
            />
          </div>
        </div>
      </div>

      {/* Network Health */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
              Network Health
            </p>
            <p className="text-sm text-text-faint">Overall network score</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(networkHealthInsights.color, 0.12) }}
          >
            <ShieldCheck
              className="w-5 h-5"
              strokeWidth={2.3}
              style={{ color: networkHealthInsights.color }}
            />
          </div>
        </div>
        <div className="flex items-end justify-between gap-6 mt-6">
          <div>
            <div className="flex items-baseline gap-2">
              <p
                className="text-4xl font-bold tracking-tight"
                style={{ color: networkHealthInsights.color }}
              >
                {networkHealthInsights.score}
              </p>
              <span className="text-lg text-text-soft font-semibold">/100</span>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs uppercase tracking-widest text-text-soft">
              <span
                className="flex items-center gap-2 font-semibold"
                style={{ color: networkHealthInsights.trendColor }}
              >
                <span>{networkHealthInsights.trendIcon}</span>
                <span className="font-mono">
                  {networkHealthInsights.delta > 0
                    ? `+${networkHealthInsights.delta}`
                    : networkHealthInsights.delta}
                </span>
              </span>
              <span>vs yesterday</span>
              <span>vs last refresh</span>
            </div>
          </div>
          <svg
            width={networkHealthInsights.svgWidth}
            height={networkHealthInsights.svgHeight}
            viewBox={`0 0 ${networkHealthInsights.svgWidth} ${networkHealthInsights.svgHeight}`}
            className="shrink-0"
          >
            <polygon
              fill={networkHealthInsights.sparklineFill}
              points={networkHealthInsights.sparklineAreaPoints}
              opacity={0.25}
            />
            <polyline
              fill="none"
              stroke={networkHealthInsights.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={networkHealthInsights.sparklinePoints}
            />
          </svg>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-soft">
          <span className="inline-flex items-center gap-2 px-2 py-2 rounded-full border border-border-app-soft">
            <UptimeIcon
              className="w-3.5 h-3.5"
              strokeWidth={2.2}
              style={{ color: networkUptimeStats.color }}
            />
            <span
              className="font-semibold"
              style={{ color: networkUptimeStats.color }}
            >
              {networkUptimeStats.badge}
            </span>
          </span>
          <span className="font-mono text-text-main">
            {networkUptimeStats.percent.toFixed(1)}%
          </span>
          <span>
            {networkUptimeStats.publicOnline}/{networkUptimeStats.publicTotal}{" "}
            public online
          </span>
        </div>
      </div>
    </div>
  );
};
