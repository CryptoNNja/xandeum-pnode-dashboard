"use client";

import { X, Cpu } from "lucide-react";
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

type CpuDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cpuDistribution: any[];
  isLight: boolean;
};

export const CpuDistributionModal = ({
  isOpen,
  onClose,
  cpuDistribution,
  isLight
}: CpuDistributionModalProps) => {
  if (!isOpen) return null;

  // Calculate stats
  const totalNodes = cpuDistribution.reduce((sum, item) => sum + item.count, 0);
  const avgCpu = cpuDistribution.reduce((sum, item) => {
    // Extract mid-point of range for average calculation
    const rangeParts = item.range.split('-');
    const midPoint = rangeParts.length === 2 
      ? (parseInt(rangeParts[0]) + parseInt(rangeParts[1])) / 2 
      : parseInt(rangeParts[0].replace('+', ''));
    return sum + (midPoint * item.count);
  }, 0) / totalNodes;

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
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
              : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 241, 149, 0.05) 100%)",
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
                background: "linear-gradient(135deg, #10B981, #14F195)",
                opacity: 0.15,
              }}
            >
              <Cpu className="w-6 h-6" style={{ color: "#10B981" }} />
            </div>
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}
              >
                CPU Load Distribution
              </h2>
              <p
                className="text-sm"
                style={{ color: isLight ? "#64748b" : "#94a3b8" }}
              >
                Processing load across all public pNodes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 px-8 py-6 border-b"
          style={{ borderColor: isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)" }}
        >
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Total Nodes
            </p>
            <p className="text-2xl font-bold" style={{ color: isLight ? "#0F172A" : "#F8FAFC" }}>
              {totalNodes}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Average CPU
            </p>
            <p className="text-2xl font-bold" style={{ color: "#10B981" }}>
              {avgCpu.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              Status
            </p>
            <p className="text-2xl font-bold" style={{ 
              color: avgCpu < 50 ? "#10B981" : avgCpu < 75 ? "#F59E0B" : "#EF4444" 
            }}>
              {avgCpu < 50 ? "Healthy" : avgCpu < 75 ? "Moderate" : "High"}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="px-8 py-8 overflow-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cpuDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isLight ? "rgba(15, 23, 42, 0.1)" : "rgba(255, 255, 255, 0.1)"} 
                />
                <XAxis 
                  dataKey="range" 
                  style={{ fill: isLight ? "#64748b" : "#94a3b8" }}
                  fontSize={12}
                  label={{ 
                    value: "CPU Usage Range (%)", 
                    position: "insideBottom", 
                    offset: -15,
                    style: { fill: isLight ? "#64748b" : "#94a3b8" }
                  }}
                />
                <YAxis 
                  style={{ fill: isLight ? "#64748b" : "#94a3b8" }}
                  fontSize={12}
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
                  {cpuDistribution.map((item, idx) => (
                    <Cell key={idx} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Info Note */}
          <div className="mt-6 px-4 py-3 rounded-lg" 
            style={{ 
              background: isLight ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.1)",
              border: `1px solid ${isLight ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.3)"}`
            }}
          >
            <p className="text-xs text-center" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
              <strong style={{ color: "#10B981" }}>Low CPU usage</strong> ensures efficient storage request handling for Xandeum's network. 
              Nodes with consistently high CPU may experience performance degradation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
