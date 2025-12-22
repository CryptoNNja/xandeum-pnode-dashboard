"use client";

import React, { memo, useMemo } from "react";
import { X, TrendingUp, TrendingDown, Minus, Download, Star } from "lucide-react";
import clsx from "clsx";
import { PNode } from "@/lib/types";
import { formatBytesAdaptive } from "@/lib/utils";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CompareNodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: (PNode & { _score?: number; _healthStatus?: string })[];
  isLight?: boolean;
  onAddToFavorites?: (ips: string[]) => void;
}

const CompareNodesModalComponent = ({
  isOpen,
  onClose,
  nodes,
  isLight = false,
  onAddToFavorites,
}: CompareNodesModalProps) => {
  if (!isOpen) return null;

  // Calculate network averages for comparison
  const networkAvg = useMemo(() => ({
    cpu: 20, // Placeholder - should come from global stats
    ram: 50,
    storage: 500,
    uptime: 600,
    score: 75,
  }), []);

  // Prepare radar chart data
  const radarData = useMemo(() => {
    const metrics = ['CPU', 'RAM', 'Storage', 'Uptime', 'Score'];
    
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      
      nodes.forEach((node, index) => {
        let value = 0;
        
        switch (metric) {
          case 'CPU':
            value = Math.min(100, node.stats?.cpu_percent ?? 0);
            break;
          case 'RAM':
            const ramTotal = node.stats?.ram_total ?? 1;
            value = Math.min(100, ((node.stats?.ram_used ?? 0) / ramTotal) * 100);
            break;
          case 'Storage':
            const storageCommitted = node.stats?.storage_committed ?? 1;
            value = Math.min(100, ((node.stats?.storage_used ?? 0) / storageCommitted) * 100);
            break;
          case 'Uptime':
            const uptimeHours = (node.stats?.uptime ?? 0) / 3600;
            value = Math.min(100, (uptimeHours / 720) * 100); // Normalize to 30 days
            break;
          case 'Score':
            value = node._score ?? 0;
            break;
        }
        
        dataPoint[`Node ${index + 1}`] = value;
      });
      
      return dataPoint;
    });
  }, [nodes]);

  const colors = ['#00D4AA', '#7B3FF2', '#FFD700', '#3B82F6'];

  // Calculate deltas vs network average
  const calculateDelta = (value: number, avg: number): { delta: number; percent: number; icon: any; color: string } => {
    const delta = value - avg;
    const percent = avg > 0 ? (delta / avg) * 100 : 0;
    
    if (Math.abs(percent) < 5) {
      return { delta, percent, icon: Minus, color: 'text-gray-500' };
    } else if (delta > 0) {
      return { delta, percent, icon: TrendingUp, color: 'text-green-500' };
    } else {
      return { delta, percent, icon: TrendingDown, color: 'text-red-500' };
    }
  };

  const exportComparison = () => {
    const data = nodes.map(node => ({
      ip: node.ip,
      score: node._score,
      status: node._healthStatus,
      cpu: node.stats?.cpu_percent,
      ram_used: node.stats?.ram_used,
      ram_total: node.stats?.ram_total,
      storage_committed: node.stats?.storage_committed,
      uptime: node.stats?.uptime,
    }));

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `node-comparison-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={clsx(
          "w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl animate-scale-up",
          isLight ? "bg-white border-black/10" : "bg-bg-card border-border-app"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={clsx("sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-xl", isLight ? "bg-white/95 border-black/10" : "bg-bg-card/95 border-border-app")}>
          <div>
            <h2 className="text-2xl font-black text-text-main">Compare Nodes</h2>
            <p className="text-sm text-text-soft mt-1">Side-by-side performance analysis</p>
          </div>
          <button
            onClick={onClose}
            className={clsx(
              "p-2 rounded-lg transition-all hover:scale-110",
              isLight ? "hover:bg-black/5" : "hover:bg-white/5"
            )}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Radar Chart */}
          <div className={clsx("p-6 rounded-xl border", isLight ? "bg-gray-50 border-black/5" : "bg-bg-bg2 border-border-app")}>
            <h3 className="text-lg font-bold mb-4 text-text-main">Performance Overview</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={isLight ? "#00000020" : "#ffffff20"} />
                <PolarAngleAxis 
                  dataKey="metric" 
                  tick={{ fill: isLight ? "#000000" : "#ffffff", fontSize: 12, fontWeight: 600 }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  tick={{ fill: isLight ? "#00000080" : "#ffffff80", fontSize: 10 }}
                />
                {nodes.map((_, index) => (
                  <Radar
                    key={index}
                    name={`Node ${index + 1}`}
                    dataKey={`Node ${index + 1}`}
                    stroke={colors[index]}
                    fill={colors[index]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isLight ? '#ffffff' : '#1a1a1a',
                    border: `1px solid ${isLight ? '#00000020' : '#ffffff20'}`,
                    borderRadius: '8px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Nodes Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {nodes.map((node, index) => (
              <div
                key={node.ip}
                className={clsx(
                  "p-4 rounded-xl border-2 transition-all",
                  isLight ? "bg-white border-black/10" : "bg-bg-bg2 border-border-app"
                )}
                style={{ borderColor: colors[index] + '40' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-text-soft">Node {index + 1}</p>
                    <p className="text-sm font-mono font-bold text-text-main">{node.ip}</p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-lg"
                    style={{ 
                      backgroundColor: colors[index] + '20',
                      color: colors[index],
                      border: `2px solid ${colors[index]}40`
                    }}
                  >
                    {node._score ?? 0}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-soft">Status</span>
                    <span className="font-semibold" style={{ color: colors[index] }}>
                      {node._healthStatus ?? 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-soft">CPU</span>
                    <span className="font-semibold text-text-main">
                      {(node.stats?.cpu_percent ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-soft">RAM</span>
                    <span className="font-semibold text-text-main">
                      {formatBytesAdaptive(node.stats?.ram_used ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-soft">Storage</span>
                    <span className="font-semibold text-text-main">
                      {formatBytesAdaptive(node.stats?.storage_committed ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-soft">Uptime</span>
                    <span className="font-semibold text-text-main">
                      {Math.floor((node.stats?.uptime ?? 0) / 3600)}h
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Insights */}
          <div className={clsx("p-6 rounded-xl border", isLight ? "bg-blue-50 border-blue-200" : "bg-blue-900/10 border-blue-700/30")}>
            <h3 className="text-lg font-bold mb-3 text-text-main flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Key Insights
            </h3>
            <ul className="space-y-2 text-sm text-text-soft">
              <li>• Best performer: <span className="font-semibold text-text-main">{nodes.reduce((best, node) => (node._score ?? 0) > (best._score ?? 0) ? node : best).ip}</span> ({nodes.reduce((best, node) => (node._score ?? 0) > (best._score ?? 0) ? node : best)._score}/100)</li>
              <li>• Lowest CPU usage: <span className="font-semibold text-text-main">{nodes.reduce((best, node) => (node.stats?.cpu_percent ?? 100) < (best.stats?.cpu_percent ?? 100) ? node : best).ip}</span></li>
              <li>• Highest storage capacity: <span className="font-semibold text-text-main">{nodes.reduce((best, node) => (node.stats?.storage_committed ?? 0) > (best.stats?.storage_committed ?? 0) ? node : best).ip}</span></li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            {onAddToFavorites && (
              <button
                onClick={() => onAddToFavorites(nodes.map(n => n.ip))}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                  "hover:scale-105 active:scale-95",
                  isLight
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                    : "bg-yellow-900/20 text-yellow-400 border border-yellow-700/30 hover:bg-yellow-900/30"
                )}
              >
                <Star className="w-4 h-4" />
                Add All to Favorites
              </button>
            )}
            <button
              onClick={exportComparison}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all",
                "hover:scale-105 active:scale-95",
                isLight
                  ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  : "bg-green-900/20 text-green-400 border border-green-700/30 hover:bg-green-900/30"
              )}
            >
              <Download className="w-4 h-4" />
              Export Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CompareNodesModal = memo(CompareNodesModalComponent);
CompareNodesModal.displayName = "CompareNodesModal";
