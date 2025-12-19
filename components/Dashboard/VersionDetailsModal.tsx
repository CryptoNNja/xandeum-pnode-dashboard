"use client";

import { X } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { PNode } from "@/lib/types";

type VersionDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  versionChart: {
    entries: Array<{ id: string; label: string; count: number; percentage: number; color: string }>;
    latestPercentLabel: string;
    message: string;
  };
  pnodes: PNode[];
  isLight: boolean;
  onFilterByVersion?: (version: string) => void;
};

export const VersionDetailsModal = ({
  isOpen,
  onClose,
  versionChart,
  pnodes,
  isLight,
  onFilterByVersion,
}: VersionDetailsModalProps) => {
  if (!isOpen) return null;

  const bgColor = isLight ? "rgba(255, 255, 255, 0.98)" : "rgba(5, 8, 22, 0.98)";
  const cardBg = isLight ? "#f8fafc" : "#101734";
  const textMain = isLight ? "#0f172a" : "#f1f5f9";
  const textSoft = isLight ? "#64748b" : "#94a3b8";
  const borderColor = isLight ? "#e2e8f0" : "#1e293b";

  // Custom label for the pie chart
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl pointer-events-auto"
          style={{
            backgroundColor: bgColor,
            borderColor: borderColor,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b" style={{ backgroundColor: bgColor, borderColor: borderColor }}>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: textMain }}>
                Network Version Distribution
              </h2>
              <p className="text-sm mt-1" style={{ color: textSoft }}>
                Detailed breakdown of client versions across all nodes
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                backgroundColor: cardBg,
                color: textSoft,
              }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Chart Section */}
            <div className="rounded-xl border p-6" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: textMain }}>
                    Version Distribution Chart
                  </h3>
                  <p className="text-sm mt-1" style={{ color: textSoft }}>
                    Visual representation of version adoption
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: textSoft }}>Latest version</p>
                  <p className="text-2xl font-bold" style={{ color: versionChart.entries[0]?.color || '#10B981' }}>
                    {versionChart.latestPercentLabel}
                  </p>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={versionChart.entries.map(e => ({ name: e.label, value: e.count }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {versionChart.entries.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: "8px",
                        color: textMain,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ color: textSoft }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Version List */}
            <div className="rounded-xl border" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
              <div className="p-4 border-b" style={{ borderColor: borderColor }}>
                <h3 className="text-lg font-semibold" style={{ color: textMain }}>
                  Version Details
                </h3>
                <p className="text-sm mt-1" style={{ color: textSoft }}>
                  Click on a version to filter dashboard by that version
                </p>
              </div>

              <div className="divide-y" style={{ borderColor: borderColor }}>
                {versionChart.entries.map((version, index) => {
                  const nodeCount = version.count;
                  const percentage = `${version.percentage.toFixed(1)}%`;

                  return (
                    <button
                      key={version.id}
                      onClick={() => {
                        if (onFilterByVersion) {
                          onFilterByVersion(version.label);
                          onClose();
                        }
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-opacity-50 transition-all group"
                      style={{
                        backgroundColor: "transparent",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Color indicator */}
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: version.color }}
                        />

                        {/* Version name */}
                        <div className="text-left">
                          <p className="font-mono font-semibold" style={{ color: textMain }}>
                            {version.label}
                          </p>
                          <p className="text-xs" style={{ color: textSoft }}>
                            {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Progress bar */}
                        <div className="w-32 h-2 rounded-full overflow-hidden" style={{ backgroundColor: borderColor }}>
                          <div
                            className="h-full transition-all"
                            style={{
                              width: percentage,
                              backgroundColor: version.color,
                            }}
                          />
                        </div>

                        {/* Percentage */}
                        <p className="text-lg font-bold w-16 text-right" style={{ color: textMain }}>
                          {percentage}
                        </p>

                        {/* Hover indicator */}
                        {onFilterByVersion && (
                          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: textSoft }}>
                            Filter →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: cardBg }}>
              <p className="text-sm" style={{ color: textSoft }}>
                Total nodes analyzed: <span className="font-semibold" style={{ color: textMain }}>{pnodes.length}</span>
              </p>
              <p className="text-sm" style={{ color: textSoft }}>
                Latest version adoption: <span className="font-semibold" style={{ color: versionChart.entries[0]?.color || '#10B981' }}>{versionChart.latestPercentLabel}%</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
