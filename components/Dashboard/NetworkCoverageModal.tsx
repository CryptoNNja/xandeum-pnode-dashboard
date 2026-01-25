"use client";

import { X, Radio, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from "recharts";

type NetworkCoverageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  networkMetadata: {
    networkTotal: number;
    crawledNodes: number;
    staleNodes: number;
    registryOnlyNodes: number;
    gossipOnlyNodes: number;
    bothSourcesNodes: number;
    uncrawledNodes: number;
    activeNodes: number;
    coveragePercent: number;
  };
  networkGrowthRate: number;
  totalNodes: number;
  isLight: boolean;
  networkHistory?: Array<{ date: string; publicNodes?: number; totalNodes?: number; nodes?: number }>;
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
    ? networkHistory.map(entry => ({
        date: entry.date,
        publicNodes: entry.publicNodes ?? entry.nodes ?? 0,
        totalNodes: entry.totalNodes ?? entry.nodes ?? 0,
        privateNodes: (entry.totalNodes ?? entry.nodes ?? 0) - (entry.publicNodes ?? entry.nodes ?? 0)
      }))
    : [
        { date: "Week 1", publicNodes: Math.max(0, totalNodes - 40), totalNodes: Math.max(0, totalNodes - 40), privateNodes: 0 },
        { date: "Week 2", publicNodes: Math.max(0, totalNodes - 30), totalNodes: Math.max(0, totalNodes - 30), privateNodes: 0 },
        { date: "Week 3", publicNodes: Math.max(0, totalNodes - 20), totalNodes: Math.max(0, totalNodes - 20), privateNodes: 0 },
        { date: "Week 4", publicNodes: Math.max(0, totalNodes - 10), totalNodes: Math.max(0, totalNodes - 10), privateNodes: 0 },
        { date: "Now", publicNodes: totalNodes, totalNodes: totalNodes, privateNodes: 0 }
      ];

  // Calculate growth rates for each segment
  const calculateGrowthRate = (values: number[]) => {
    if (values.length < 2) return 0;
    const oldValue = values[0];
    const newValue = values[values.length - 1];
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  };

  const totalGrowthRate = calculateGrowthRate(growthData.map(d => d.totalNodes));
  const publicGrowthRate = calculateGrowthRate(growthData.map(d => d.publicNodes));
  const privateGrowthRate = calculateGrowthRate(growthData.map(d => d.privateNodes));

  // Current values
  const currentTotal = growthData[growthData.length - 1]?.totalNodes || totalNodes;
  const currentPublic = growthData[growthData.length - 1]?.publicNodes || networkMetadata.activeNodes;
  const currentPrivate = currentTotal - currentPublic;

  // Calculate period and format intelligently
  const periodDays = growthData.length > 1 ? growthData.length - 1 : 1;
  const formatPeriod = (days: number) => {
    if (days === 0 || days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 60) return '1 month';
    const months = Math.round(days / 30);
    return `${months} months`;
  };
  const periodLabel = formatPeriod(periodDays);
  const periodShort = periodDays < 30 ? `${periodDays}d` : periodDays < 60 ? '1mo' : `${Math.round(periodDays / 30)}mo`;

  // Daily growth rates (for Growth Analysis text)
  const dailyTotalGrowth = periodDays > 0 ? totalGrowthRate / periodDays : 0;
  const dailyPublicGrowth = periodDays > 0 ? publicGrowthRate / periodDays : 0;

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
                {totalGrowthRate > 0 ? "+" : ""}{totalGrowthRate.toFixed(1)}%
              </p>
              <p className="text-[10px] mt-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                total network
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
                    transform: totalGrowthRate < 0 ? "rotate(180deg)" : "none"
                  }} 
                />
                Network Growth Trend
              </h3>

              {/* Growth Rate Breakdown Cards */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 rounded-lg" style={{
                  background: isLight ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.1)",
                  border: `1px solid ${isLight ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)"}`
                }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Total Nodes
                  </p>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#3B82F6" }}>
                    {currentTotal}
                  </p>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: totalGrowthRate > 0 ? "#10B981" : totalGrowthRate < 0 ? "#EF4444" : "#6B7280" }}>
                    {totalGrowthRate > 0 ? "↗" : totalGrowthRate < 0 ? "↘" : "→"} {totalGrowthRate > 0 ? "+" : ""}{totalGrowthRate.toFixed(1)}%
                  </p>
                  <p className="text-[9px]" style={{ color: isLight ? "#94a3b8" : "#64748b" }}>
                    {periodShort}
                  </p>
                </div>

                <div className="text-center p-3 rounded-lg" style={{
                  background: isLight ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.1)",
                  border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
                }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Public Nodes
                  </p>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#10B981" }}>
                    {currentPublic}
                  </p>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: publicGrowthRate > 0 ? "#10B981" : publicGrowthRate < 0 ? "#EF4444" : "#6B7280" }}>
                    {publicGrowthRate > 0 ? "↗" : publicGrowthRate < 0 ? "↘" : "→"} {publicGrowthRate > 0 ? "+" : ""}{publicGrowthRate.toFixed(1)}%
                  </p>
                  <p className="text-[9px]" style={{ color: isLight ? "#94a3b8" : "#64748b" }}>
                    {periodShort}
                  </p>
                </div>

                <div className="text-center p-3 rounded-lg" style={{
                  background: isLight ? "rgba(139, 92, 246, 0.05)" : "rgba(139, 92, 246, 0.1)",
                  border: `1px solid ${isLight ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.3)"}`
                }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Private Nodes
                  </p>
                  <p className="text-2xl font-bold mb-1" style={{ color: "#8B5CF6" }}>
                    {currentPrivate}
                  </p>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: privateGrowthRate > 0 ? "#10B981" : privateGrowthRate < 0 ? "#EF4444" : "#6B7280" }}>
                    {privateGrowthRate > 0 ? "↗" : privateGrowthRate < 0 ? "↘" : "→"} {privateGrowthRate > 0 ? "+" : ""}{privateGrowthRate.toFixed(1)}%
                  </p>
                  <p className="text-[9px]" style={{ color: isLight ? "#94a3b8" : "#64748b" }}>
                    {periodShort}
                  </p>
                </div>
              </div>

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
                      interval="preserveStartEnd"
                      minTickGap={40}
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
                      formatter={(value: any, name: string) => {
                        if (name === 'publicNodes') return [value, 'Public Nodes'];
                        if (name === 'totalNodes') return [value, 'Total Nodes'];
                        if (name === 'privateNodes') return [value, 'Private Nodes'];
                        return [value, name];
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalNodes" 
                      stroke="#3B82F6" 
                      strokeWidth={2.5}
                      dot={{ fill: "#3B82F6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Total Nodes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="privateNodes" 
                      stroke="#8B5CF6" 
                      strokeWidth={2.5}
                      dot={{ fill: "#8B5CF6", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Private Nodes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="publicNodes" 
                      stroke="#10B981" 
                      strokeWidth={2.5}
                      dot={{ fill: "#10B981", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Public Nodes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                  <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Total Nodes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#8B5CF6" }} />
                  <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Private Nodes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10B981" }} />
                  <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Public Nodes
                  </span>
                </div>
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
              
              {/* ✨ NEW: Detailed Breakdown */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Successfully Crawled
                  </span>
                  <span className="font-semibold" style={{ color: "#10B981" }}>
                    {networkMetadata.crawledNodes} nodes
                  </span>
                </div>
                
                {networkMetadata.registryOnlyNodes > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      Registry Only
                    </span>
                    <span className="font-semibold" style={{ color: "#3B82F6" }}>
                      {networkMetadata.registryOnlyNodes} nodes
                    </span>
                  </div>
                )}
                
                {networkMetadata.gossipOnlyNodes > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      Gossip Only
                    </span>
                    <span className="font-semibold" style={{ color: "#9333EA" }}>
                      {networkMetadata.gossipOnlyNodes} nodes
                    </span>
                  </div>
                )}
                
                {networkMetadata.uncrawledNodes > 0 && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t" style={{ borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" }}>
                    <span className="flex items-center gap-1.5" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      Unreachable
                    </span>
                    <span className="font-semibold" style={{ color: "#F59E0B" }}>
                      {networkMetadata.uncrawledNodes} nodes ({((networkMetadata.uncrawledNodes / networkMetadata.networkTotal) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
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
                {totalGrowthRate > 0 
                  ? `Network expanding at +${dailyTotalGrowth.toFixed(1)}% per day (+${totalGrowthRate.toFixed(1)}% over ${periodLabel}).`
                  : totalGrowthRate < 0
                  ? `Network size decreased by ${Math.abs(totalGrowthRate).toFixed(1)}% over ${periodLabel}.`
                  : "Network size remains stable with minimal changes."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
