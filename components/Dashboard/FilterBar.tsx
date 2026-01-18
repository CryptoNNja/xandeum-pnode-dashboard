"use client";

import { Search, X, Filter } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import type { AlertFilters, AlertSeverity, AlertType } from "@/types/alerts";

type FilterBarProps = {
  filters: AlertFilters;
  onFiltersChange: (filters: AlertFilters) => void;
  onReset: () => void;
  isLight: boolean;
  totalResults: number;
  totalAlerts: number;
  allAlerts: any[]; // All alerts used for type counts
};

const ALL_ALERT_TYPES = [
  'Low Storage',
  'Stale Node',
  'High CPU',
  'High RAM',
  'Offline Node',
  'Storage Critical',
  'Storage Filling',
  'Recent Restart',
  'Node Crash Detected',
  'Node Crash',
  'Stale Data',
];

const SEVERITIES: { value: 'all' | AlertSeverity; label: string; color?: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical', color: 'text-red-500' },
  { value: 'warning', label: 'Warning', color: 'text-orange-500' },
];

export const FilterBar = ({
  filters,
  onFiltersChange,
  onReset,
  isLight,
  totalResults,
  totalAlerts,
  allAlerts,
}: FilterBarProps) => {
  const [searchInput, setSearchInput] = useState(filters.searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, searchTerm: searchInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  const hasActiveFilters = filters.searchTerm || filters.severity !== 'all' || filters.type !== 'all';

  // Count alerts by type
  const alertTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_ALERT_TYPES.forEach(type => {
      counts[type] = allAlerts.filter(a => a.type === type).length;
    });
    return counts;
  }, [allAlerts]);

  // Separate available types vs empty types
  const availableTypes = ALL_ALERT_TYPES.filter(type => alertTypeCounts[type] > 0);
  const emptyTypes = ALL_ALERT_TYPES.filter(type => alertTypeCounts[type] === 0);

  return (
    <div className="space-y-4">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
          <input
            type="text"
            placeholder="Search by IP, type, or message..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={clsx(
              "w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-all",
              "bg-bg-card text-text-main border-border-app",
              "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
              "placeholder:text-text-faint"
            )}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-main transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Severity Filter */}
        <select
          value={filters.severity}
          onChange={(e) => onFiltersChange({ ...filters, severity: e.target.value as AlertFilters['severity'] })}
          className={clsx(
            "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
            isLight 
              ? "bg-white text-gray-900 border-gray-300" 
              : "bg-[#1a1f3a] text-white border-white/20",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
            "hover:border-accent/50"
          )}
        >
          {SEVERITIES.map(sev => (
            <option 
              key={sev.value} 
              value={sev.value}
              className={isLight ? "bg-white text-gray-900" : "bg-[#1a1f3a] text-white"}
            >
              {sev.label}
            </option>
          ))}
        </select>

        {/* Type Filter - Grouped by availability */}
        <select
          value={filters.type}
          onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as AlertFilters['type'] })}
          className={clsx(
            "px-4 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
            isLight 
              ? "bg-white text-gray-900 border-gray-300" 
              : "bg-[#1a1f3a] text-white border-white/20",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
            "hover:border-accent/50"
          )}
        >
          <option value="all" className={isLight ? "bg-white text-gray-900" : "bg-[#1a1f3a] text-white"}>
            All Types
          </option>
          
          {/* Available Types Group */}
          {availableTypes.length > 0 && (
            <optgroup 
              label={`📊 Available (${availableTypes.length})`}
              className={isLight ? "bg-white text-gray-900" : "bg-[#1a1f3a] text-white"}
            >
              {availableTypes.map(type => (
                <option 
                  key={type} 
                  value={type}
                  className={isLight ? "bg-white text-gray-900" : "bg-[#1a1f3a] text-white"}
                >
                  {type} ({alertTypeCounts[type]})
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Empty Types Group */}
          {emptyTypes.length > 0 && (
            <optgroup 
              label={`💤 No Alerts (${emptyTypes.length})`}
              className={isLight ? "bg-white text-gray-400" : "bg-[#1a1f3a] text-gray-500"}
            >
              {emptyTypes.map(type => (
                <option 
                  key={type} 
                  value={type}
                  disabled
                  className={clsx(
                    "italic",
                    isLight ? "bg-white text-gray-400" : "bg-[#1a1f3a] text-gray-500"
                  )}
                >
                  {type} (0)
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Active Filters Summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-text-soft">
            Showing <span className="font-bold text-text-main">{totalResults}</span> of{' '}
            <span className="font-bold text-text-main">{totalAlerts}</span> alerts
          </p>
          
          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              {filters.severity !== 'all' && (
                <span className={clsx(
                  "text-xs px-2 py-1 rounded-full font-medium",
                  filters.severity === 'critical' 
                    ? "bg-red-500/20 text-red-500" 
                    : "bg-orange-500/20 text-orange-500"
                )}>
                  {filters.severity === 'critical' ? 'Critical' : 'Warning'}
                </span>
              )}
              {filters.type !== 'all' && (
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-500/20 text-blue-500">
                  {filters.type}
                </span>
              )}
              {filters.searchTerm && (
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-500/20 text-purple-500">
                  Search: "{filters.searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className={clsx(
              "text-xs px-3 py-1.5 rounded-lg font-medium transition-all",
              "bg-bg-hover text-text-main border border-border-app",
              "hover:bg-accent/10 hover:border-accent hover:text-accent"
            )}
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
