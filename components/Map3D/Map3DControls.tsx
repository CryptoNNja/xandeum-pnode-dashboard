'use client';

import { useState } from 'react';
import { Play, Pause, Search, Layers, Zap, X } from 'lucide-react';
import type { Globe3DFilter, Globe3DMode } from '@/lib/types-3d';

type Map3DControlsProps = {
  mode: Globe3DMode;
  onModeChange: (mode: Globe3DMode) => void;
  filter: Globe3DFilter;
  onFilterChange: (filter: Globe3DFilter) => void;
  showArcs: boolean;
  onToggleArcs: () => void;
  onSearch?: (query: string) => void;
  totalNodes: number;
  filteredNodes: number;
};

export function Map3DControls({
  mode,
  onModeChange,
  filter,
  onFilterChange,
  showArcs,
  onToggleArcs,
  onSearch,
  totalNodes,
  filteredNodes,
}: Map3DControlsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  return (
    <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none">
      <div className="flex flex-col gap-3 pointer-events-auto">
        {/* Top Bar - Mode Controls */}
        <div className="flex items-center justify-between gap-3 bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-xl p-3 shadow-lg">
          {/* Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onModeChange(mode === 'cinematic' ? 'free' : 'cinematic')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                mode === 'cinematic'
                  ? 'bg-primary text-bg-dark'
                  : 'bg-bg-hover text-text-primary hover:bg-bg-active'
              }`}
            >
              {mode === 'cinematic' ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span className="text-sm font-medium">Cinematic</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span className="text-sm font-medium">Auto-Rotate</span>
                </>
              )}
            </button>
            
            <button
              onClick={onToggleArcs}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                showArcs
                  ? 'bg-primary text-bg-dark'
                  : 'bg-bg-hover text-text-primary hover:bg-bg-active'
              }`}
              title="Show operator connections"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Arcs</span>
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-hover text-text-primary hover:bg-bg-active transition-all"
            >
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Filters</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search node IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onSearch) {
                    onSearch(searchQuery);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-bg-hover border border-border-app rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Node Count */}
          <div className="text-sm text-text-secondary whitespace-nowrap">
            <span className="font-medium text-primary">{filteredNodes}</span>
            <span className="mx-1">/</span>
            <span>{totalNodes}</span>
            <span className="ml-1">nodes</span>
          </div>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-xl p-4 shadow-lg space-y-4">
            {/* Health Filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Health Status
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All', color: 'bg-bg-hover' },
                  { value: 'healthy', label: 'Healthy', color: 'bg-green-500/20 text-green-400' },
                  { value: 'warning', label: 'Warning', color: 'bg-yellow-500/20 text-yellow-400' },
                  { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400' },
                ].map(({ value, label, color }) => (
                  <button
                    key={value}
                    onClick={() => onFilterChange({ ...filter, health: value as any })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter.health === value
                        ? `${color} ring-2 ring-primary`
                        : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Network Filter */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Network Type
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Nodes' },
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onFilterChange({ ...filter, network: value as any })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter.network === value
                        ? 'bg-primary text-bg-dark'
                        : 'bg-bg-hover text-text-secondary hover:bg-bg-active'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Active Only Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Active Nodes Only
              </label>
              <button
                onClick={() => onFilterChange({ ...filter, activeOnly: !filter.activeOnly })}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  filter.activeOnly ? 'bg-primary' : 'bg-bg-hover'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    filter.activeOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
