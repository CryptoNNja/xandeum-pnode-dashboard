"use client";

import { X, Activity, Database, Wifi, AlertTriangle } from "lucide-react";

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
  totalNodes: number; // DEPRECATED
  isLight: boolean;
  networkHistory?: Array<{ date: string; publicNodes?: number; totalNodes?: number; nodes?: number }>;
};

export const NetworkCoverageModal = ({
  isOpen,
  onClose,
  networkMetadata,
  networkGrowthRate,
  isLight,
}: NetworkCoverageModalProps) => {
  if (!isOpen) return null;

  const coverageColor = networkMetadata.coveragePercent >= 80 ? "#10B981" :
                        networkMetadata.coveragePercent >= 60 ? "#3B82F6" :
                        networkMetadata.coveragePercent >= 40 ? "#F59E0B" : "#EF4444";

  const churnRate = networkMetadata.networkTotal > 0 
    ? (networkMetadata.staleNodes / networkMetadata.networkTotal) * 100 
    : 0;

  const coverageStatus = networkMetadata.coveragePercent >= 80 ? "Excellent" :
                         networkMetadata.coveragePercent >= 60 ? "Good" :
                         networkMetadata.coveragePercent >= 40 ? "Moderate" : "Limited";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden"
        style={{
          background: isLight ? "#ffffff" : "#0F172A",
          borderColor: isLight ? "rgba(15, 23, 42, 0.15)" : "rgba(255, 255, 255, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Compact */}
        <div
          className="px-6 py-4 border-b"
          style={{
            borderColor: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)",
            background: isLight
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.08) 100%)",
          }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)",
              color: isLight ? "#64748b" : "#94a3b8",
            }}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${coverageColor}22 0%, ${coverageColor}11 100%)`,
                border: `1.5px solid ${coverageColor}44`,
              }}
            >
              <Activity className="w-6 h-6" style={{ color: coverageColor }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                Network Coverage Analysis
              </h2>
              <p className="text-sm" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Historical discovery vs active crawl status
              </p>
            </div>
          </div>
        </div>

        {/* Content - Compact Grid Layout */}
        <div className="p-6">
          {/* Top KPI Cards - 3 Column Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Total Discovered */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)",
                border: `1px solid ${isLight ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)"}`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Database className="w-4 h-4" style={{ color: "#3B82F6" }} />
                <p className="text-xs uppercase font-semibold tracking-wide" style={{ color: "#3B82F6" }}>
                  Discovered
                </p>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: "#3B82F6" }}>
                {networkMetadata.networkTotal}
              </p>
              <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Total nodes (historical)
              </p>
            </div>

            {/* Active Crawled */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%)",
                border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wifi className="w-4 h-4" style={{ color: "#10B981" }} />
                <p className="text-xs uppercase font-semibold tracking-wide" style={{ color: "#10B981" }}>
                  Active
                </p>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: "#10B981" }}>
                {networkMetadata.crawledNodes}
              </p>
              <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Currently crawled
              </p>
            </div>

            {/* Stale/Unreachable */}
            <div
              className="p-4 rounded-xl text-center"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)"
                  : "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)",
                border: `1px solid ${isLight ? "rgba(245, 158, 11, 0.2)" : "rgba(245, 158, 11, 0.3)"}`,
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "#F59E0B" }} />
                <p className="text-xs uppercase font-semibold tracking-wide" style={{ color: "#F59E0B" }}>
                  Stale
                </p>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: "#F59E0B" }}>
                {networkMetadata.staleNodes}
              </p>
              <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                Unreachable ({churnRate.toFixed(1)}% churn)
              </p>
            </div>
          </div>

          {/* Coverage Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                Network Coverage
              </p>
              <p className="text-sm font-bold" style={{ color: coverageColor }}>
                {networkMetadata.coveragePercent.toFixed(1)}% • {coverageStatus}
              </p>
            </div>
            <div
              className="h-3 rounded-full overflow-hidden"
              style={{ background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)" }}
            >
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${networkMetadata.coveragePercent}%`,
                  background: `linear-gradient(90deg, ${coverageColor} 0%, ${coverageColor}dd 100%)`,
                  boxShadow: `0 0 12px ${coverageColor}44`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1 text-xs" style={{ color: isLight ? "#94a3b8" : "#64748b" }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Detailed Breakdown - 2 Column Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Discovery Breakdown */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)",
                border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.25)"}`,
              }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                <Activity className="w-4 h-4" style={{ color: "#10B981" }} />
                Node Status
              </h3>

              <div className="space-y-2.5">
                {/* Active Nodes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
                    <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      Active & Crawled
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#10B981" }}>
                    {networkMetadata.crawledNodes}
                  </span>
                </div>

                {/* Stale Nodes */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#F59E0B" }} />
                    <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                      Stale / Offline
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#F59E0B" }}>
                    {networkMetadata.staleNodes}
                  </span>
                </div>

                {/* Registry Only */}
                {networkMetadata.registryOnlyNodes > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#3B82F6" }} />
                      <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                        Registry Only
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#3B82F6" }}>
                      {networkMetadata.registryOnlyNodes}
                    </span>
                  </div>
                )}

                {/* Gossip Only */}
                {networkMetadata.gossipOnlyNodes > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#8B5CF6" }} />
                      <span className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                        Gossip Only
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#8B5CF6" }}>
                      {networkMetadata.gossipOnlyNodes}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Coverage Insights */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: isLight
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)",
                border: `1px solid ${isLight ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.25)"}`,
              }}
            >
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                <Database className="w-4 h-4" style={{ color: "#3B82F6" }} />
                Network Health
              </h3>

              <div className="space-y-3">
                {/* Coverage Status */}
                <div>
                  <p className="text-xs mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Coverage Status
                  </p>
                  <p className="text-lg font-bold" style={{ color: coverageColor }}>
                    {coverageStatus} ({networkMetadata.coveragePercent.toFixed(1)}%)
                  </p>
                </div>

                {/* Churn Rate */}
                <div>
                  <p className="text-xs mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Network Churn
                  </p>
                  <p className="text-lg font-bold" style={{ color: churnRate > 10 ? "#EF4444" : churnRate > 5 ? "#F59E0B" : "#10B981" }}>
                    {churnRate.toFixed(1)}%
                  </p>
                </div>

                {/* Active Public Nodes */}
                <div>
                  <p className="text-xs mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Public Nodes Active
                  </p>
                  <p className="text-lg font-bold" style={{ color: "#8B5CF6" }}>
                    {networkMetadata.activeNodes}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Footer */}
          <div
            className="mt-6 p-4 rounded-xl text-center"
            style={{
              background: isLight
                ? `linear-gradient(135deg, ${coverageColor}08 0%, ${coverageColor}04 100%)`
                : `linear-gradient(135deg, ${coverageColor}15 0%, ${coverageColor}08 100%)`,
              border: `1px solid ${coverageColor}33`,
            }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: coverageColor }}>
              {networkMetadata.coveragePercent >= 80
                ? `🎉 Excellent! Successfully maintaining ${networkMetadata.coveragePercent.toFixed(1)}% connectivity to discovered nodes.`
                : networkMetadata.coveragePercent >= 60
                ? `✅ Good coverage. ${networkMetadata.staleNodes} nodes temporarily unreachable.`
                : networkMetadata.coveragePercent >= 40
                ? `⚠️ Moderate coverage. ${networkMetadata.staleNodes} nodes need attention.`
                : `🚨 Limited coverage. ${networkMetadata.staleNodes} nodes offline - investigation recommended.`
              }
            </p>
            <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Crawler maintains connectivity to {networkMetadata.crawledNodes} out of {networkMetadata.networkTotal} historically discovered nodes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
