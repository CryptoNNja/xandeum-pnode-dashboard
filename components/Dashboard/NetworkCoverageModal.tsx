"use client";

import { X, Radio, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";

type NetworkCoverageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  networkMetadata: {
    networkTotal: number;
    crawledNodes: number;
    activeNodes: number;
    coveragePercent: number;
  };
  networkGrowthRate: number;
  totalNodes: number;
  isLight: boolean;
  networkHistory?: Array<{ date: string; nodes: number }>;
};

export const NetworkCoverageModal = ({
  isOpen,
  onClose,
  networkMetadata,
  networkGrowthRate,
  totalNodes,
  isLight,
  networkHistory
}: NetworkCoverageModalProps) => {
  if (!isOpen) return null;

  const coverageColor = networkMetadata.coveragePercent >= 80 ? "#10B981" :
                        networkMetadata.coveragePercent >= 60 ? "#3B82F6" :
                        networkMetadata.coveragePercent >= 40 ? "#F59E0B" : "#EF4444";

  const growthColor = networkGrowthRate > 0 ? "#10B981" : 
                      networkGrowthRate < 0 ? "#EF4444" : "#6B7280";

  // Use real historical data if available, otherwise use mock data as fallback
  const growthData = networkHistory && networkHistory.length > 0
    ? networkHistory
    : [
        { date: "Week 1", nodes: Math.max(0, totalNodes - 40) },
        { date: "Week 2", nodes: Math.max(0, totalNodes - 30) },
        { date: "Week 3", nodes: Math.max(0, totalNodes - 20) },
        { date: "Week 4", nodes: Math.max(0, totalNodes - 10) },
        { date: "Now", nodes: totalNodes }
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-transition"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl border shadow-2xl theme-transition flex flex-col"
        style={{
          background: isLight ? "#ffffff" : "#0F172A",
          borderColor: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="relative px-6 py-4 border-b flex-shrink-0"
          style={{
            borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)",
            background: isLight
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 241, 149, 0.05) 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isLight ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.15)",
              color: isLight ? "#64748b" : "#94a3b8",
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
              }}
            >
              <Radio className="w-5 h-5" style={{ color: "#10B981" }} strokeWidth={3} />
            </div>
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Network Growth & Expansion
              </h2>
              <p
                className="text-xs"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Node discovery and network size trends
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 rounded-xl" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 241, 149, 0.08) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Network Total
              </p>
              <p className="text-3xl font-bold" style={{ color: "#10B981" }}>
                {networkMetadata.networkTotal}
              </p>
              <p className="text-[10px] mt-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                via gossip
              </p>
            </div>

            <div className="text-center p-4 rounded-xl" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 241, 149, 0.08) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Crawled Nodes
              </p>
              <p className="text-3xl font-bold" style={{ color: coverageColor }}>
                {networkMetadata.crawledNodes}
              </p>
              <p className="text-[10px] mt-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                {networkMetadata.coveragePercent.toFixed(1)}% coverage
              </p>
            </div>

            <div className="text-center p-4 rounded-xl" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 241, 149, 0.08) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Growth Rate
              </p>
              <p className="text-3xl font-bold" style={{ color: growthColor }}>
                {networkGrowthRate > 0 ? "+" : ""}{networkGrowthRate.toFixed(1)}%
              </p>
              <p className="text-[10px] mt-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                recent trend
              </p>
            </div>

            <div className="text-center p-4 rounded-xl" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 241, 149, 0.08) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <p className="text-xs uppercase tracking-wider mb-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Trend Status
              </p>
              <p className="text-3xl font-bold" style={{ color: growthColor }}>
                {networkGrowthRate > 5 ? "🚀" : 
                 networkGrowthRate > 0 ? "📈" : 
                 networkGrowthRate < -5 ? "📉" : "➡️"}
              </p>
              <p className="text-[10px] mt-1" style={{ color: growthColor }}>
                {networkGrowthRate > 5 ? "Rapid" : 
                 networkGrowthRate > 0 ? "Growing" : 
                 networkGrowthRate < -5 ? "Declining" : "Stable"}
              </p>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="mb-6">
            <div className="rounded-xl p-5" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 241, 149, 0.05) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                <TrendingUp 
                  className="w-5 h-5" 
                  style={{ 
                    color: "#10B981",
                    transform: networkGrowthRate < 0 ? "rotate(180deg)" : "none"
                  }} 
                />
                Network Growth Trend
              </h3>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke={isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"} 
                    />
                    <XAxis 
                      dataKey="date" 
                      stroke={isLight ? "#64748b" : "#94a3b8"}
                      fontSize={11}
                    />
                    <YAxis 
                      stroke={isLight ? "#64748b" : "#94a3b8"}
                      fontSize={11}
                    />
                    <Tooltip
                      contentStyle={{
                        background: isLight ? "#ffffff" : "#1e293b",
                        border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.5)"}`,
                        borderRadius: "8px",
                        color: isLight ? "#0F172A" : "#F8FAFC",
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nodes" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: "#10B981", r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Growth Insights */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 241, 149, 0.08) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4" style={{ color: "#10B981" }} />
                <h4 className="text-sm font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                  Discovery Status
                </h4>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: coverageColor }}>
                {networkMetadata.coveragePercent >= 80
                  ? "Excellent network coverage"
                  : networkMetadata.coveragePercent >= 60
                  ? "Good network coverage"
                  : networkMetadata.coveragePercent >= 40
                  ? "Moderate coverage - discovery ongoing"
                  : "Limited coverage - early discovery phase"
                }
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Successfully crawled {networkMetadata.coveragePercent.toFixed(1)}% of the network via gossip protocol.
              </p>
            </div>

            <div className="p-4 rounded-xl" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(20, 241, 149, 0.05) 100%)"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(20, 241, 149, 0.08) 100%)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: growthColor }} />
                <h4 className="text-sm font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                  Growth Analysis
                </h4>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: growthColor }}>
                {networkGrowthRate > 10 
                  ? "Strong network adoption" 
                  : networkGrowthRate > 0 
                  ? "Healthy growth trajectory" 
                  : networkGrowthRate < -5
                  ? "Network contraction detected"
                  : "Stable network size"}
              </p>
              <p className="text-[11px] leading-relaxed" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                {networkGrowthRate > 0 
                  ? `Network expanding at ${networkGrowthRate.toFixed(1)}% based on recent snapshots.`
                  : networkGrowthRate < 0
                  ? `Network size decreased by ${Math.abs(networkGrowthRate).toFixed(1)}%.`
                  : "Network size remains stable with minimal changes."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
