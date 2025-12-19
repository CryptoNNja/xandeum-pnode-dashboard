"use client"

import React, { memo } from "react";
import {
    Cpu,
    Package,
  } from "lucide-react";
import { InfoTooltip } from "@/components/common/InfoTooltip";
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
import { DataDistributionChart } from "@/components/Dashboard/DataDistributionChart";
import { CustomTooltip } from "@/components/common/Tooltips";

type ChartsSectionProps = {
    cpuDistribution: any[];
    storageDistribution: any[];
    pagesDistribution: any[];
    isLight: boolean;
};

const ChartsSectionComponent = ({
    cpuDistribution,
    storageDistribution,
    pagesDistribution,
    isLight
}: ChartsSectionProps) => {
    return (
        <div className="space-y-6">
        {/* First row: 3 distribution charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CPU LOAD */}
        <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#10B981]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold tracking-[0.35em] text-[#10B981]">CPU Load</h3>
            </div>
            <InfoTooltip content="Processing load distribution across pNodes. Low CPU usage ensures efficient storage request handling for Xandeum's network." />
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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#7B3FF2]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold tracking-[0.35em] text-[#7B3FF2]">Storage</h3>
            </div>
            <InfoTooltip content="Storage capacity committed to Xandeum's decentralized storage layer. More capacity enables greater scalability for Solana dApps." />
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

        {/* DATA DISTRIBUTION */}
        <DataDistributionChart pagesDistribution={pagesDistribution} isLight={isLight} />
      </div>

    </div>
    )
}

export const ChartsSection = memo(ChartsSectionComponent);
ChartsSection.displayName = "ChartsSection";
