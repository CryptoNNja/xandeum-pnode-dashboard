"use client";

import { X, HardDrive, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { CustomTooltip } from "@/components/common/Tooltips";

type StorageAnalyticsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  storageDistribution: any[];
  storageGrowthRate: number;
  totalPagesCount: number;
  isLight: boolean;
};

export const StorageAnalyticsModal = ({
  isOpen,
  onClose,
  storageDistribution,
  storageGrowthRate,
  totalPagesCount,
  isLight
}: StorageAnalyticsModalProps) => {
  const [activeTab, setActiveTab] = useState<'distribution' | 'growth'>('distribution');

  if (!isOpen) return null;

  // Calculate stats
  const totalNodes = storageDistribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-transition"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl theme-transition"
        style={{
          background: isLight ? "#ffffff" : "#0F172A",
          borderColor: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-8 py-6 border-b"
          style={{
            borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)",
            background: isLight
              ? "linear-gradient(135deg, rgba(123, 63, 242, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
              : "linear-gradient(135deg, rgba(123, 63, 242, 0.08) 0%, rgba(20, 241, 149, 0.05) 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg transition-colors"
            style={{
              background: isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)",
              color: isLight ? "#64748b" : "#94a3b8",
            }}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7B3FF2, #14F195)",
                opacity: 0.15,
              }}
            >
              <HardDrive className="w-6 h-6" style={{ color: "#7B3FF2" }} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Storage Analytics
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Capacity distribution and growth insights
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('distribution')}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === 'distribution' 
                  ? (isLight ? "rgba(123, 63, 242, 0.1)" : "rgba(123, 63, 242, 0.2)")
                  : "transparent",
                color: activeTab === 'distribution' ? "#7B3FF2" : (isLight ? "#64748b" : "#94a3b8"),
                border: `1px solid ${activeTab === 'distribution' ? "#7B3FF2" : (isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)")}`,
              }}
            >
              Distribution
            </button>
            <button
              onClick={() => setActiveTab('growth')}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === 'growth' 
                  ? (isLight ? "rgba(123, 63, 242, 0.1)" : "rgba(123, 63, 242, 0.2)")
                  : "transparent",
                color: activeTab === 'growth' ? "#7B3FF2" : (isLight ? "#64748b" : "#94a3b8"),
                border: `1px solid ${activeTab === 'growth' ? "#7B3FF2" : (isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)")}`,
              }}
            >
              Growth Rate
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeTab === 'distribution' ? (
            // Distribution Tab
            <div className="px-8 py-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Total Nodes
                  </p>
                  <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                    {totalNodes}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(123, 63, 242, 0.05)" : "rgba(123, 63, 242, 0.1)" }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Distribution
                  </p>
                  <p className="text-2xl font-bold" style={{ color: "#7B3FF2" }}>
                    Varied
                  </p>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={storageDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"} 
                    />
                    <XAxis 
                      dataKey="range" 
                      style={{ fill: isLight ? "#64748b" : "#94a3b8" }}
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      label={{ 
                        value: "Storage Capacity", 
                        position: "insideBottom", 
                        offset: -5,
                        style: { fill: isLight ? "#64748b" : "#94a3b8" }
                      }}
                    />
                    <YAxis 
                      style={{ fill: isLight ? "#64748b" : "#94a3b8" }}
                      fontSize={11}
                      label={{ 
                        value: "Number of Nodes", 
                        angle: -90, 
                        position: "insideLeft",
                        style: { fill: isLight ? "#64748b" : "#94a3b8" }
                      }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: isLight ? "rgba(15,23,42,0.04)" : "rgba(255,255,255,0.08)" }}
                    />
                    <Bar dataKey="count" fill="#7B3FF2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 px-4 py-3 rounded-lg" 
                style={{ 
                  background: isLight ? "rgba(123, 63, 242, 0.05)" : "rgba(123, 63, 242, 0.1)",
                  border: `1px solid ${isLight ? "rgba(123, 63, 242, 0.2)" : "rgba(123, 63, 242, 0.3)"}`
                }}
              >
                <p className="text-xs text-center" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  <strong style={{ color: "#7B3FF2" }}>Storage capacity committed</strong> to Xandeum's decentralized storage layer. 
                  More capacity enables greater scalability for Solana dApps.
                </p>
              </div>
            </div>
          ) : (
            // Growth Tab
            <div className="px-8 py-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Total Pages
                  </p>
                  <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                    {totalPagesCount >= 1000000 
                      ? `${(totalPagesCount / 1000000).toFixed(2)}M`
                      : totalPagesCount >= 1000
                      ? `${(totalPagesCount / 1000).toFixed(1)}K`
                      : totalPagesCount.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ 
                  background: storageGrowthRate > 0 
                    ? (isLight ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.1)")
                    : (isLight ? "rgba(239, 68, 68, 0.05)" : "rgba(239, 68, 68, 0.1)")
                }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Growth Rate
                  </p>
                  <p className="text-2xl font-bold" style={{ 
                    color: storageGrowthRate > 0 ? "#10B981" : storageGrowthRate < 0 ? "#EF4444" : "#6B7280"
                  }}>
                    {storageGrowthRate > 0 ? "+" : ""}{storageGrowthRate.toFixed(1)}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Trend
                  </p>
                  <p className="text-2xl font-bold" style={{ 
                    color: storageGrowthRate > 0 ? "#10B981" : storageGrowthRate < 0 ? "#EF4444" : "#6B7280"
                  }}>
                    {storageGrowthRate > 10 ? "Rapid" : 
                     storageGrowthRate > 0 ? "Growing" : 
                     storageGrowthRate < -5 ? "Declining" : 
                     "Steady"}
                  </p>
                </div>
              </div>

              {/* Visual representation */}
              <div className="space-y-6">
                <div className="p-6 rounded-xl" style={{ 
                  background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"}`
                }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                      Storage Usage Trend
                    </span>
                    <TrendingUp 
                      className="w-5 h-5" 
                      style={{ 
                        color: storageGrowthRate > 0 ? "#10B981" : "#EF4444",
                        transform: storageGrowthRate < 0 ? "rotate(180deg)" : "none"
                      }} 
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                        <span>Data Growth</span>
                        <span className="font-semibold">{storageGrowthRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)" }}>
                        <div 
                          className="h-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min(100, Math.abs(storageGrowthRate) * 5)}%`,
                            background: storageGrowthRate > 0 
                              ? "linear-gradient(90deg, #10B981 0%, #14F195 100%)"
                              : "linear-gradient(90deg, #EF4444 0%, #F87171 100%)"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{ 
                    background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"}`
                  }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      USAGE TREND
                    </p>
                    <p className="text-sm font-semibold" style={{ 
                      color: storageGrowthRate > 0 ? "#10B981" : storageGrowthRate < 0 ? "#EF4444" : "#6B7280"
                    }}>
                      {storageGrowthRate > 10 ? "Accelerating" : 
                       storageGrowthRate > 0 ? "Increasing" : 
                       storageGrowthRate < -5 ? "Decreasing" : 
                       "Steady"}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ 
                    background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"}`
                  }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      NETWORK STATUS
                    </p>
                    <p className="text-sm font-semibold" style={{ 
                      color: storageGrowthRate > 0 ? "#10B981" : "#6B7280"
                    }}>
                      {storageGrowthRate > 15 
                        ? "Rapid adoption" 
                        : storageGrowthRate > 0 
                        ? "Active usage" 
                        : storageGrowthRate < -5
                        ? "Pruning detected"
                        : "Stable"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 px-4 py-3 rounded-lg" 
                style={{ 
                  background: storageGrowthRate > 0 
                    ? (isLight ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.1)")
                    : (isLight ? "rgba(107, 114, 128, 0.05)" : "rgba(107, 114, 128, 0.1)"),
                  border: `1px solid ${storageGrowthRate > 0 
                    ? (isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)")
                    : (isLight ? "rgba(107, 114, 128, 0.2)" : "rgba(107, 114, 128, 0.3)")}`
                }}
              >
                <p className="text-xs text-center" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Percentage increase in total pages stored based on recent historical snapshots. 
                  Indicates <strong style={{ color: storageGrowthRate > 0 ? "#10B981" : "#6B7280" }}>actual network utilization</strong> and data growth trends.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
