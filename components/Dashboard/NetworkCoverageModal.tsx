"use client";

import { X, Radio, TrendingUp } from "lucide-react";

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
};

export const NetworkCoverageModal = ({
  isOpen,
  onClose,
  networkMetadata,
  networkGrowthRate,
  totalNodes,
  isLight
}: NetworkCoverageModalProps) => {
  if (!isOpen) return null;

  const coverageColor = networkMetadata.coveragePercent >= 80 ? "#10B981" :
                        networkMetadata.coveragePercent >= 60 ? "#3B82F6" :
                        networkMetadata.coveragePercent >= 40 ? "#F59E0B" : "#EF4444";

  const growthColor = networkGrowthRate > 0 ? "#10B981" : 
                      networkGrowthRate < 0 ? "#EF4444" : "#6B7280";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-transition"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl theme-transition"
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
              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)",
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

          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #10B981)",
                opacity: 0.15,
              }}
            >
              <Radio className="w-6 h-6" style={{ color: coverageColor }} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Network Coverage & Growth
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Discovery insights and expansion metrics
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-8 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Coverage Section */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              <Radio className="w-5 h-5" style={{ color: coverageColor }} />
              Network Coverage
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Network Total
                </p>
                <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                  {networkMetadata.networkTotal}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ 
                background: isLight ? `${coverageColor}10` : `${coverageColor}20`
              }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Crawled
                </p>
                <p className="text-2xl font-bold" style={{ color: coverageColor }}>
                  {networkMetadata.crawledNodes}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Active
                </p>
                <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                  {networkMetadata.activeNodes}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    Discovery Progress
                  </span>
                  <span className="text-lg font-bold" style={{ color: coverageColor }}>
                    {networkMetadata.coveragePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)" }}>
                  <div 
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${networkMetadata.coveragePercent}%`,
                      background: `linear-gradient(90deg, ${coverageColor}, ${coverageColor}CC)`
                    }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg" style={{ 
                background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"}`
              }}>
                <p className="text-sm font-semibold mb-1" style={{ color: coverageColor }}>
                  {networkMetadata.coveragePercent >= 80
                    ? "Excellent network coverage"
                    : networkMetadata.coveragePercent >= 60
                    ? "Good network coverage"
                    : networkMetadata.coveragePercent >= 40
                    ? "Moderate coverage - discovery ongoing"
                    : "Limited coverage - early discovery phase"
                  }
                </p>
                <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Successfully crawled {networkMetadata.coveragePercent.toFixed(1)}% of the network via gossip protocol. 
                  Higher coverage means more accurate network insights.
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t mb-8" style={{ borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)" }} />

          {/* Growth Section */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              <TrendingUp 
                className="w-5 h-5" 
                style={{ 
                  color: growthColor,
                  transform: networkGrowthRate < 0 ? "rotate(180deg)" : "none"
                }} 
              />
              Network Growth
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Current Nodes
                </p>
                <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
                  {totalNodes}
                </p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ 
                background: isLight ? `${growthColor}10` : `${growthColor}20`
              }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Growth Rate
                </p>
                <p className="text-2xl font-bold" style={{ color: growthColor }}>
                  {networkGrowthRate > 0 ? "+" : ""}{networkGrowthRate.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Trend
                </p>
                <p className="text-2xl font-bold" style={{ color: growthColor }}>
                  {networkGrowthRate > 5 ? "Rapid" : 
                   networkGrowthRate > 0 ? "Growing" : 
                   networkGrowthRate < -5 ? "Declining" : 
                   "Stable"}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ 
              background: isLight ? `${growthColor}08` : `${growthColor}15`,
              border: `1px solid ${growthColor}40`
            }}>
              <p className="text-sm font-semibold mb-1" style={{ color: growthColor }}>
                {networkGrowthRate > 10 
                  ? "Strong network adoption" 
                  : networkGrowthRate > 0 
                  ? "Healthy growth trajectory" 
                  : networkGrowthRate < -5
                  ? "Network contraction detected"
                  : "Stable network size"}
              </p>
              <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                {networkGrowthRate > 0 
                  ? `Network is expanding at ${networkGrowthRate.toFixed(1)}% based on recent snapshots.`
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
