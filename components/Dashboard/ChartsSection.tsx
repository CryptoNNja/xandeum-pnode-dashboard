"use client"

import {
    Cpu,
    Package,
    Radio,
  } from "lucide-react";
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts";
import TopPerformersChart from "@/components/TopPerformersChart";
import type { PNode } from "@/lib/types";
import { CustomTooltip } from "@/components/common/Tooltips";
import { getHealthBadgeStyles, getHealthLabel } from "@/lib/utils";

type ChartsSectionProps = {
    cpuDistribution: any[];
    storageDistribution: any[];
    versionChart: any;
    latestVersionPercentage: number;
    isLight: boolean;
    pnodes: PNode[];
};

export const ChartsSection = ({
    cpuDistribution,
    storageDistribution,
    versionChart,
    latestVersionPercentage,
    isLight,
    pnodes
}: ChartsSectionProps) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* CPU LOAD */}
        <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-4 h-4 text-[#10B981]" strokeWidth={2.5} />
            <h3 className="text-xs font-semibold text-[#10B981]">CPU Load</h3>
          </div>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={cpuDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                <XAxis dataKey="range" stroke="var(--text-soft)" fontSize={11} />
                <YAxis stroke="var(--text-soft)" fontSize={11} />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.08)" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {cpuDistribution.map((item, idx) => (
                    <Cell key={idx} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STORAGE DISTRIBUTION */}
        <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-[#7B3FF2]" strokeWidth={2.5} />
            <h3 className="text-xs font-semibold text-[#7B3FF2]">Storage</h3>
          </div>
          <div className="h-[260px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart
                margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                data={storageDistribution}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                <XAxis
                  dataKey="range"
                  stroke="var(--text-soft)"
                  fontSize={11}
                  label={{ value: "Storage Capacity", position: "insideBottom", offset: -10 }}
                />
                <YAxis
                  stroke="var(--text-soft)"
                  fontSize={11}
                  label={{ value: "Nodes", angle: -90, position: "insideLeft" }}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.08)" }}
                />
                <Bar dataKey="count" fill="#7B3FF2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NETWORK VERSIONS */}
        <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#F97316]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold text-[#F97316]">Network Versions</h3>
            </div>
            <div className={`px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getHealthBadgeStyles(latestVersionPercentage)}`}>
              {getHealthLabel(latestVersionPercentage)}
            </div>
          </div>
          <div className="h-[180px] w-full min-w-0 relative mb-4">
            {versionChart.entries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                    <Pie
                    data={versionChart.entries}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                    >
                    {versionChart.entries.map((entry: any) => (
                        <Cell
                        key={entry.id}
                        fill={entry.color}
                        stroke="var(--bg-bg)"
                        strokeWidth={2}
                        />
                    ))}
                    </Pie>
                </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <p className="text-xs text-text-soft">No version data available</p>
                </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-3xl font-bold text-text-main">{versionChart.latestPercentLabel}%</p>
                <p className="text-[10px] text-text-faint uppercase tracking-wider">Latest</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {versionChart.entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-text-soft">{entry.label}</span>
                </div>
                <span className="font-mono font-bold text-text-main">
                  {entry.count} | {entry.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-text-soft text-center mt-4 tracking-wide uppercase">
            {versionChart.message}
          </p>
        </div>

        {/* TOP PERFORMERS */}
        <TopPerformersChart nodes={pnodes} />
      </div>
    )
}
