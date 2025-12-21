"use client";

import { X, Database } from "lucide-react";
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

type DataDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pagesDistribution: Array<{
    range: string;
    count: number;
    color: string;
  }>;
  totalPagesCount: number;
  isLight: boolean;
};

export const DataDistributionModal = ({
  isOpen,
  onClose,
  pagesDistribution,
  totalPagesCount,
  isLight
}: DataDistributionModalProps) => {
  if (!isOpen) return null;

  // Calculate stats
  const totalNodes = pagesDistribution.reduce((sum, item) => sum + item.count, 0);
  const avgPagesPerNode = totalNodes > 0 ? totalPagesCount / totalNodes : 0;

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
              ? "linear-gradient(135deg, rgba(236, 72, 153, 0.03) 0%, rgba(244, 114, 182, 0.03) 100%)"
              : "linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(244, 114, 182, 0.05) 100%)",
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
                background: "rgba(123, 63, 242, 0.15)",
              }}
            >
              <Database className="w-6 h-6" style={{ color: "#7B3FF2" }} strokeWidth={2.3} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                Data Distribution
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Indexed pages across active pNodes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 px-8 py-6 border-b"
          style={{ borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)" }}
        >
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
          <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(236, 72, 153, 0.05)" : "rgba(236, 72, 153, 0.1)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Active Nodes
            </p>
            <p className="text-2xl font-bold" style={{ color: "#EC4899" }}>
              {totalNodes}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ background: isLight ? "rgba(15, 23, 42, 0.03)" : "rgba(255, 255, 255, 0.03)" }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Avg per Node
            </p>
            <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              {avgPagesPerNode >= 1000
                ? `${(avgPagesPerNode / 1000).toFixed(1)}K`
                : avgPagesPerNode.toFixed(0)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="px-8 py-8 overflow-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pagesDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
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
                    value: "Pages Range", 
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
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {pagesDistribution.map((item, idx) => (
                    <Cell key={idx} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info Note */}
          <div className="mt-6 px-4 py-3 rounded-lg" 
            style={{ 
              background: isLight ? "rgba(236, 72, 153, 0.05)" : "rgba(236, 72, 153, 0.1)",
              border: `1px solid ${isLight ? "rgba(236, 72, 153, 0.2)" : "rgba(236, 72, 153, 0.3)"}`
            }}
          >
            <p className="text-xs text-center" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Distribution of <strong style={{ color: "#EC4899" }}>total indexed pages</strong> across all active pNodes. 
              Higher page counts indicate more blockchain data indexed by the node in Xandeum's storage layer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
