"use client";

import { useState } from "react";
import {
  Search,
  Eye,
  List,
  LayoutGrid,
  MapPin,
  Download,
  RefreshCw,
  Settings,
  Loader2,
  CheckCircle,
  ChevronDown,
  Check,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";
import type { PNode } from "@/lib/types";
import { ViewMode, NodeFilter } from "@/hooks/usePnodeDashboard";
import { Tooltip } from "@/components/common/Tooltip";

const TOOLBAR_BUTTON_BASE =
  "relative p-2 rounded-lg hover:bg-white/5 transition-colors";

type ToolbarProps = {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  nodeFilter: NodeFilter;
  setNodeFilter: (filter: NodeFilter) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onSettingsClick: () => void;
  onExportData: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  isAdvancedFilterOpen: boolean;
  setIsAdvancedFilterOpen: (open: boolean) => void;
  lastUpdateText: string;
  pnodesCount: number;
  publicCount: number;
  privateCount: number;
  loading?: boolean;
};

export const Toolbar = ({
  searchTerm,
  setSearchTerm,
  viewMode,
  setViewMode,
  nodeFilter,
  setNodeFilter,
  onRefresh,
  refreshing,
  onSettingsClick,
  onExportData,
  onExportCsv,
  onExportExcel,
  onExportPdf,
  isAdvancedFilterOpen,
  setIsAdvancedFilterOpen,
  lastUpdateText,
  pnodesCount,
  publicCount,
  privateCount,
  loading,
  resetFilters,
  selectedVersions,
  selectedHealthStatuses,
  minCpu,
  minStorage,
}: ToolbarProps & { 
  resetFilters?: () => void;
  selectedVersions?: string[];
  selectedHealthStatuses?: string[];
  minCpu?: number;
  minStorage?: number;
}) => {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const activeFiltersCount = (selectedVersions?.length || 0) + 
                             (selectedHealthStatuses?.length || 0) + 
                             (minCpu ? 1 : 0) + 
                             (minStorage ? 1 : 0);

  return (
    <section className="w-full">
      <div className="w-full bg-bg-card border border-border-app rounded-xl px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between theme-transition">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Button/Input - simplified as just a button that might open a modal in Page, 
              but let's keep the logic consistent with what Page passed */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-bg-bg border border-border-app rounded-lg text-xs text-text-main outline-none focus:border-accent-aqua transition-colors w-40 md:w-64"
            />
          </div>

          <div className="h-6 w-px bg-border-app mx-1 hidden md:block" />

          {/* Filter */}
          <div className="relative">
            <Tooltip content="Filter nodes by visibility">
              <button
                type="button"
                onClick={() => setFilterMenuOpen((prev) => !prev)}
                className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1")}
                aria-label="Filter"
              >
                <Eye className="w-5 h-5 text-text-soft" />
                <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", filterMenuOpen ? "rotate-180" : "rotate-0")} />
              </button>
            </Tooltip>

            {filterMenuOpen && (
              <div className="absolute left-0 mt-3 w-56 rounded-xl border border-border-app bg-bg-card shadow-2xl z-[60] overflow-hidden">
                {(
                  [
                    { key: "all" as const, label: `All (${pnodesCount})` },
                    { key: "public" as const, label: `Public (${publicCount})` },
                    { key: "private" as const, label: `Private (${privateCount})` },
                  ] as const
                ).map((option) => {
                  const isActive = option.key === nodeFilter;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setNodeFilter(option.key);
                        setFilterMenuOpen(false);
                      }}
                      className={clsx(
                        "w-full px-4 py-3 text-sm flex items-center justify-between transition-colors",
                        isActive
                          ? "bg-accent-aqua/15 text-accent-aqua"
                          : "text-text-main hover:bg-bg-bg2"
                      )}
                    >
                      <span>{option.label}</span>
                      {isActive && <Check className="w-4 h-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View modes */}
          <Tooltip content="Table View">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={clsx(
                TOOLBAR_BUTTON_BASE,
                viewMode === "table" ? "text-accent-aqua" : "text-text-soft"
              )}
              style={viewMode === "table" ? { backgroundColor: 'var(--accent-aqua)' + '22' } : undefined}
            >
              <List className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Grid View">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={clsx(
                TOOLBAR_BUTTON_BASE,
                viewMode === "grid" ? "text-accent-aqua" : "text-text-soft"
              )}
              style={viewMode === "grid" ? { backgroundColor: 'var(--accent-aqua)' + '22' } : undefined}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </Tooltip>

          <Tooltip content="Map View">
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={clsx(
                TOOLBAR_BUTTON_BASE,
                viewMode === "map" ? "text-accent-aqua" : "text-text-soft"
              )}
              style={viewMode === "map" ? { backgroundColor: 'var(--accent-aqua)' + '22' } : undefined}
            >
              <MapPin className="w-5 h-5" />
            </button>
          </Tooltip>

          <div className="h-6 w-px bg-border-app mx-1" />

          {/* Export */}
          <div className="relative">
            <Tooltip content="Export data">
              <button
                type="button"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1", pnodesCount === 0 && "opacity-50 pointer-events-none")}
                aria-label="Export"
              >
                <Download className="w-5 h-5 text-text-soft" />
                <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", exportMenuOpen ? "rotate-180" : "rotate-0")} />
              </button>
            </Tooltip>
            {exportMenuOpen && (
              <div className="absolute left-0 mt-3 w-48 rounded-xl border border-border-app bg-bg-card shadow-2xl z-[60] overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onExportData();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportCsv();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                >
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportPdf();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors font-bold text-accent-aqua border-t border-border-app/50"
                >
                  PDF Report
                </button>
              </div>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <Tooltip content={isAdvancedFilterOpen ? "Hide Advanced Filters" : "Show Advanced Filters"}>
            <button
              type="button"
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={clsx(
                TOOLBAR_BUTTON_BASE,
                isAdvancedFilterOpen || activeFiltersCount > 0 ? "text-accent-aqua bg-accent-aqua/10" : "text-text-soft"
              )}
              aria-label="Advanced Filters"
            >
              <div className="relative">
                <SlidersHorizontal className="w-5 h-5" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-aqua text-bg-app text-[9px] font-black rounded-full flex items-center justify-center border-2 border-bg-card">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
            </button>
          </Tooltip>

          {activeFiltersCount > 0 && resetFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 text-[10px] font-bold text-accent-aqua hover:bg-accent-aqua/10 rounded-lg flex items-center gap-1.5 transition-all animate-in fade-in zoom-in duration-300"
            >
              <RotateCcw className="w-3 h-3" />
              Clear
            </button>
          )}

          <div className="h-6 w-px bg-border-app mx-1 hidden md:block" />

          {/* Refresh */}
          <Tooltip content="Refresh data">
            <button
              type="button"
              onClick={onRefresh}
              className={TOOLBAR_BUTTON_BASE}
              aria-label="Refresh"
            >
              <RefreshCw className={clsx("w-5 h-5 text-text-soft", refreshing ? "animate-spin" : "")} />
            </button>
          </Tooltip>

          {/* Settings */}
          <Tooltip content="Dashboard settings">
            <button
              type="button"
              onClick={onSettingsClick}
              className={TOOLBAR_BUTTON_BASE}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 text-text-soft" />
            </button>
          </Tooltip>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2">
          {loading || refreshing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-text-soft" />
              <span className="text-[11px] text-text-soft font-mono">Updating...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-[11px] text-text-soft font-mono">{lastUpdateText || "—"}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
