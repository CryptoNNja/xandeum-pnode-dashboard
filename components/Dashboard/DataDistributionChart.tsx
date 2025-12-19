"use client"

import React, { memo } from "react";
import { Database } from "lucide-react";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import {
    BarChart,
    Bar,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
    XAxis,
    YAxis,
    Cell,
} from "recharts";
import { CustomTooltip } from "@/components/common/Tooltips";

type DataDistributionChartProps = {
    pagesDistribution: Array<{
        range: string;
        count: number;
        color: string;
    }>;
    isLight: boolean;
};

const DataDistributionChartComponent = ({
    pagesDistribution,
    isLight
}: DataDistributionChartProps) => {
    return (
        <div className="kpi-card border border-border-app rounded-xl p-6 shadow-card-shadow theme-transition">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#EC4899]" strokeWidth={2.5} />
                    <h3 className="text-xs font-semibold tracking-[0.35em] text-[#EC4899]">Data Distribution</h3>
                </div>
                <InfoTooltip content="Distribution of total indexed pages across all active pNodes. Higher page counts indicate more blockchain data indexed by the node." />
            </div>
            <div className="h-[260px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={pagesDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-app)" />
                        <XAxis
                            dataKey="range"
                            stroke="var(--text-soft)"
                            fontSize={11}
                            label={{ value: "Pages Range", position: "insideBottom", offset: -10 }}
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
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {pagesDistribution.map((item, idx) => (
                                <Cell key={idx} fill={item.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export const DataDistributionChart = memo(DataDistributionChartComponent);
DataDistributionChart.displayName = "DataDistributionChart";
