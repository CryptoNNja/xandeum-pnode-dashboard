'use client';

import { Play, Pause, Search, SlidersHorizontal, TrendingUp, Activity, Database, Zap, Eye, EyeOff, Radio, CloudOff, Network } from 'lucide-react';
import type { Globe3DFilter, Globe3DMode } from '@/lib/types-3d';

type Map3DSidebarProps = {
  mode: Globe3DMode;
  onModeChange: (mode: Globe3DMode) => void;
  filter: Globe3DFilter;
  onFilterChange: (filter: Globe3DFilter) => void;
  showArcs: boolean;
  onToggleArcs: () => void;
  onSearch?: (query: string) => void;
  stats: {
    totalNodes: number;
    healthyNodes: number;
    warningNodes: number;
    criticalNodes: number;
    avgHealth: number;
    totalStorage: number;
    activeStreams: number;
  };
  visualSettings: {
    showHeight: boolean;
    showGlow: boolean;
    showLabels: boolean;
  };
  onVisualSettingsChange: (settings: any) => void;
};

export function Map3DSidebar({
  mode,
  onModeChange,
  filter,
  onFilterChange,
  showArcs,
  onToggleArcs,
  onSearch,
  stats,
  visualSettings,
  onVisualSettingsChange,
}: Map3DSidebarProps) {
  return (
    <div className="fixed left-6 top-20 bottom-6 z-20 w-80 bg-bg-card/95 backdrop-blur-xl border border-border-app rounded-2xl shadow-2xl flex flex-col max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="p-4 border-b border-border-app bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          3D Controls
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          Network visualization settings
        </p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Network Stats */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Network Health
          </div>

          <div className="bg-bg-hover/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {stats.avgHealth.toFixed(0)}
              </span>
              <span className="text-xs text-text-secondary">/100</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-green-500">{stats.healthyNodes}</div>
                <div className="text-text-tertiary text-[10px]">Healthy</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-500">{stats.warningNodes}</div>
                <div className="text-text-tertiary text-[10px]">Warning</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-500">{stats.criticalNodes}</div>
                <div className="text-text-tertiary text-[10px]">Critical</div>
              </div>
            </div>

            <div className="pt-2 border-t border-border-app space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Storage
                </span>
                <span className="font-medium text-text-primary">
                  {(stats.totalStorage / 1024).toFixed(1)} TB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Active Streams
                </span>
                <span className="font-medium text-text-primary">{stats.activeStreams}</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Mode - Removed cinematic */}

        {/* Node Types Filter */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Node Types
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 bg-bg-hover/50 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-text-primary font-medium">Active</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 font-bold">
                  {stats.healthyNodes}
                </span>
              </div>
              <input
                type="checkbox"
                checked={true} // Always true for now, will be controlled later
                readOnly
                className="w-4 h-4 rounded border-border-app text-green-500 focus:ring-2 focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-bg-hover/50 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-xs text-text-primary font-medium">Gossip Only</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500 font-bold">
                  {stats.warningNodes}
                </span>
              </div>
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 rounded border-border-app text-yellow-500 focus:ring-2 focus:ring-yellow-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-bg-hover/50 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group">
              <div className="flex items-center gap-2">
                <CloudOff className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-text-primary font-medium">Stale</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-500 font-bold">
                  {stats.criticalNodes}
                </span>
              </div>
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 rounded border-border-app text-gray-500 focus:ring-2 focus:ring-gray-500"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 bg-bg-hover/50 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors group">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-text-primary font-medium">Registry</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500 font-bold">
                  {Math.max(0, stats.totalNodes - stats.healthyNodes - stats.warningNodes - stats.criticalNodes)}
                </span>
              </div>
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 rounded border-border-app text-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="text-[10px] text-text-tertiary text-center pt-2">
            Showing all node types • Complete network view
          </div>
        </div>

        {/* Health Filter */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Filter by Health
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'all', label: 'All Nodes', count: stats.totalNodes },
              { value: 'healthy', label: 'Healthy', count: stats.healthyNodes, color: 'text-green-500' },
              { value: 'warning', label: 'Warning', count: stats.warningNodes, color: 'text-yellow-500' },
              { value: 'critical', label: 'Critical', count: stats.criticalNodes, color: 'text-red-500' },
            ].map(({ value, label, count, color }) => (
              <button
                key={value}
                onClick={() => onFilterChange({ ...filter, health: value as any })}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter.health === value
                    ? 'bg-blue-500 text-white shadow-lg ring-2 ring-blue-500/50'
                    : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                  }`}
              >
                <div>{label}</div>
                <div className={`text-[10px] font-bold ${filter.health === value ? 'text-white/80' : color || 'text-text-tertiary'}`}>
                  {count}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Network Type */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Network Type
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'public', label: 'Public' },
              { value: 'private', label: 'Private' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onFilterChange({ ...filter, network: value as any })}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filter.network === value
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Settings - Simplified */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" />
            Visual Options
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-2.5 bg-bg-hover/50 rounded-lg cursor-pointer hover:bg-bg-hover transition-colors">
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-xs text-text-primary font-medium">Operator Networks</span>
              </div>
              <input
                type="checkbox"
                checked={showArcs}
                onChange={onToggleArcs}
                className="w-4 h-4 rounded border-border-app text-cyan-500 focus:ring-2 focus:ring-cyan-500"
              />
            </label>

            <div className="text-[10px] text-text-tertiary pl-2">
              {showArcs ? '✓ Showing arcs between nodes with same operator' : 'Toggle to visualize multi-node operators'}
            </div>
          </div>
        </div>

        {/* Active Only Toggle */}
        <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-text-primary">Active Nodes Only</span>
            <button
              onClick={() => onFilterChange({ ...filter, activeOnly: !filter.activeOnly })}
              className={`relative w-11 h-6 rounded-full transition-colors ${filter.activeOnly ? 'bg-blue-500' : 'bg-bg-hover'
                }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${filter.activeOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </label>
        </div>

      </div>

      {/* Footer - Search */}
      <div className="p-4 border-t border-border-app bg-bg-hover/30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search node IP..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearch) {
                onSearch((e.target as HTMLInputElement).value);
              }
            }}
            className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border-app rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
