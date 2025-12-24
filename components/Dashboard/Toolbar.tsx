"use client";

import { useState } from "react";
import {
  Search,
  Eye,
  List,
  LayoutGrid,
  MapPin,
  Download,
  HelpCircle,
  RefreshCw,
  Loader2,
  CheckCircle,
  ChevronDown,
  Check,
  SlidersHorizontal,
  RotateCcw,
  Star,
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
  onExportData: () => void;
  onExportCsv: () => void;
  onExportExcel: () => void;
  onExportPdf?: () => void;
  onExportSelectedPdf?: () => void;
  selectedNodesCount?: number;
  isAdvancedFilterOpen: boolean;
  setIsAdvancedFilterOpen: (open: boolean) => void;
  lastUpdateText: string;
  pnodesCount: number;
  publicCount: number;
  privateCount: number;
  loading?: boolean;
  resetFilters?: () => void;
  selectedVersions?: string[];
  selectedHealthStatuses?: string[];
  minCpu?: number;
  minStorage?: number;
  favoritesCount?: number;
  onOpenFavorites?: () => void;
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
  onExportData,
  onExportCsv,
  onExportExcel,
  onExportPdf,
  onExportSelectedPdf,
  selectedNodesCount = 0,
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
  favoritesCount = 0,
  onOpenFavorites,
  onResetTour,
}: ToolbarProps & {
  onResetTour?: () => void; 
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
          <Tooltip content={
            <div className="text-xs space-y-2 max-w-xs">
              <p className="font-bold text-accent-aqua mb-2">Search by:</p>
              <div className="space-y-1">
                <p>• <span className="text-accent-aqua">IP address</span> (192.168.1, 1.38.164)</p>
                <p>• <span className="text-accent-aqua">Location</span> (India, Paris, FR, US)</p>
                <p>• <span className="text-accent-purple">Version</span> (0.7.1, 0.8.0)</p>
                <p>• <span className="text-accent-purple">Health</span> (excellent, good, warning, critical)</p>
                <p>• <span className="text-green-400">Status</span> (active, private, public, gossip)</p>
                <p>• <span className="text-blue-400">Pubkey</span> (AvJgd...)</p>
              </div>
            </div>
          }>
            <div id="search-button" className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-bg-bg border border-border-app rounded-lg text-xs text-text-main outline-none focus:border-accent-aqua transition-colors w-40 md:w-64"
              />
            </div>
          </Tooltip>

          <div className="h-6 w-px bg-border-app mx-1 hidden md:block" />

          {/* Filter */}
          <div id="filter-button" className="relative">
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
              <div className="absolute left-0 mt-3 w-56 rounded-xl border border-border-app bg-bg-card/95 backdrop-blur-md shadow-2xl z-[60] overflow-hidden">
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
          <div id="view-toggle">
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
          </div>

          <div className="h-6 w-px bg-border-app mx-1" />

          {/* Export */}
          <div id="export-button" className="relative">
            <Tooltip content="Export data">
              <button
                type="button"
                onClick={() => setExportMenuOpen((prev) => !prev)}
                className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1", pnodesCount === 0 && "opacity-50 pointer-events-none")}
                aria-label="Export"
              >
                <div className="relative">
                  <Download className="w-5 h-5 text-text-soft" />
                  {selectedNodesCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-lg shadow-purple-500/50" />
                  )}
                </div>
                <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", exportMenuOpen ? "rotate-180" : "rotate-0")} />
              </button>
            </Tooltip>
            {exportMenuOpen && (
              <div className="absolute left-0 mt-3 w-56 rounded-xl border border-border-app bg-bg-card/98 backdrop-blur-xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {/* PDF Report - Featured option */}
                {onExportPdf && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onExportPdf();
                        setExportMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-text-main hover:bg-accent-purple/10 active:bg-accent-purple/20 transition-all duration-150 flex items-center justify-between group border-b border-border-app-soft"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-200">📄</span>
                        <div className="flex flex-col">
                          <span className="font-semibold group-hover:text-accent-purple transition-colors">PDF Report</span>
                          <span className="text-xs text-text-soft">Full analytics</span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-text-soft group-hover:text-accent-purple group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Selected Nodes PDF Export - Appears when selection active */}
                    {onExportSelectedPdf && selectedNodesCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          onExportSelectedPdf();
                          setExportMenuOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-text-main bg-purple-500/10 hover:bg-purple-500/20 active:bg-purple-500/30 transition-all duration-150 flex items-center justify-between group border-b border-purple-500/20"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg group-hover:scale-110 transition-transform duration-200">✨</span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-purple-600 dark:text-purple-400">Export Selected ({selectedNodesCount})</span>
                            <span className="text-xs text-text-soft">Comparative analysis</span>
                          </div>
                        </div>
                      </button>
                    )}
                    
                    <div className="px-3 py-2">
                      <p className="text-xs text-text-soft uppercase tracking-wider">Data Export</p>
                    </div>
                  </>
                )}
                
                {/* Standard export options */}
                <button
                  type="button"
                  onClick={() => {
                    onExportData();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text-main hover:bg-bg-bg2 active:bg-bg-bg3 transition-all duration-150 flex items-center gap-3 group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform duration-200">📋</span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">JSON</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    onExportCsv();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text-main hover:bg-bg-bg2 active:bg-bg-bg3 transition-all duration-150 flex items-center gap-3 group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform duration-200">📊</span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">CSV</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    onExportExcel();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-text-main hover:bg-bg-bg2 active:bg-bg-bg3 transition-all duration-150 flex items-center gap-3 group"
                >
                  <span className="text-base group-hover:scale-110 transition-transform duration-200">📈</span>
                  <span className="group-hover:translate-x-0.5 transition-transform duration-150">Excel</span>
                </button>
              </div>
            )}
          </div>

          {/* Favorites Button */}
          {onOpenFavorites && (
            <Tooltip content="View Favorites">
              <button
                type="button"
                onClick={onOpenFavorites}
                className={clsx(
                  TOOLBAR_BUTTON_BASE,
                  favoritesCount > 0 ? "text-yellow-500 bg-yellow-500/10" : "text-text-soft"
                )}
                aria-label="Favorites"
              >
                <div className="relative">
                  <Star className={clsx("w-5 h-5", favoritesCount > 0 && "fill-yellow-500")} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-yellow-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-bg-card">
                      {favoritesCount}
                    </span>
                  )}
                </div>
              </button>
            </Tooltip>
          )}

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

          {/* Help / Tour */}
          {onResetTour && (
            <Tooltip content="Show tour guide">
              <button
                id="help-button"
                type="button"
                onClick={onResetTour}
                className={TOOLBAR_BUTTON_BASE}
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5 text-text-soft" />
              </button>
            </Tooltip>
          )}
        </div>

        {/* Results counter & Live status */}
        <div className="flex items-center gap-4">
          {/* Results Counter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-bg rounded-lg border border-border-app">
            <Eye className="w-4 h-4 text-accent-aqua" />
            <span className="text-xs font-bold text-text-main">
              {pnodesCount}
            </span>
            <span className="text-[10px] text-text-soft">nodes</span>
            <div className="w-px h-4 bg-border-app" />
            <span className="text-[10px] text-text-soft">
              <span className="font-semibold text-green-400">{publicCount}</span> public
            </span>
            <span className="text-[10px] text-text-soft">•</span>
            <span className="text-[10px] text-text-soft">
              <span className="font-semibold text-blue-400">{privateCount}</span> private
            </span>
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
      </div>
    </section>
  );
};
