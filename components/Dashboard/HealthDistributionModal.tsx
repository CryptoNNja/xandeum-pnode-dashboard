"use client";

import { X, HeartPulse, Info } from "lucide-react";
import { getStatusColors } from "@/lib/utils";

type HealthDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  healthDistribution: {
    excellent: number;
    good: number;
    warning: number;
    critical: number;
    total: number;
  };
  totalNodes: number;
  isLight: boolean;
};

export const HealthDistributionModal = ({
  isOpen,
  onClose,
  healthDistribution,
  totalNodes,
  isLight
}: HealthDistributionModalProps) => {
  const statusColors = getStatusColors();

  const stats = [
    { label: "EXCELLENT", count: healthDistribution.excellent, color: statusColors.excellent, trend: "stable" },
    { label: "GOOD", count: healthDistribution.good, color: statusColors.good, trend: "stable" },
    { label: "WARNING", count: healthDistribution.warning, color: statusColors.warning, trend: "stable" },
    { label: "CRITICAL", count: healthDistribution.critical, color: statusColors.critical, trend: "stable" },
  ];

  const getPercent = (count: number) => (healthDistribution.total > 0 ? Math.round((count / healthDistribution.total) * 100) : 0);
  const excellentPercent = getPercent(healthDistribution.excellent);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 theme-transition"
      style={{ background: "rgba(0, 0, 0, 0.7)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl theme-transition"
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

          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
              }}
            >
              <HeartPulse className="w-6 h-6" style={{ color: "#10B981" }} strokeWidth={2.3} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Health Distribution
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Distribution based on public node performance scores
              </p>
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div 
          className="px-8 py-4 border-b flex items-center justify-between"
          style={{ borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)" }}
        >
          <div className="text-center flex-1">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Auditing
            </p>
            <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              {healthDistribution.total}
            </p>
            <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Public Nodes
            </p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Excellent Health
            </p>
            <p className="text-2xl font-bold" style={{ color: statusColors.excellent }}>
              {excellentPercent}%
            </p>
            <p className="text-xs" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              of audited nodes
            </p>
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="px-8 py-8 space-y-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {stats.map((item) => {
            const percent = getPercent(item.count);
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black tracking-[0.15em]">
                  <span style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>{item.label}</span>
                  <div className="flex items-center gap-2" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                    <span style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>{item.count}</span>
                    <span>({percent}%)</span>
                    <span style={{ color: isLight ? "#94a3b8" : "#64748b" }}>→</span>
                    <span>{item.trend}</span>
                  </div>
                </div>
                <div 
                  className="h-1.5 w-full rounded-full overflow-hidden border relative"
                  style={{ 
                    background: isLight ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)",
                    borderColor: isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                    style={{ 
                      width: `${percent}%`, 
                      backgroundColor: item.color,
                      boxShadow: `0 0 10px ${item.color}40`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div 
          className="px-8 py-6 border-t flex justify-center"
          style={{ borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)" }}
        >
          <div className="flex items-center gap-2 text-[11px] font-medium italic"
            style={{ color: isLight ? "#64748b" : "#94a3b8" }}
          >
            <Info className="w-3.5 h-3.5 text-accent-aqua" />
            <span>Private nodes participate in the network state but do not provide measurable data for health scoring.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
