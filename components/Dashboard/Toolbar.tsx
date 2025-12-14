
"use client";

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
} from "lucide-react";
import clsx from "clsx";
import type { PNode } from "@/lib/types";
import { ViewMode, NodeFilter, AutoRefreshOption } from "@/hooks/usePnodeDashboard";

const TOOLBAR_BUTTON_BASE =
  "relative group p-2 rounded-lg hover:bg-white/5 transition-colors";

const ToolbarTooltip = ({ label }: { label: string }) => (
  <span
    className="pointer-events-none absolute left-1/2 top-full mt-2 w-max max-w-[260px] -translate-x-1/2 whitespace-nowrap rounded-lg border border-border-app bg-bg-card px-3 py-2 text-[11px] text-text-main opacity-0 shadow-2xl translate-y-1 scale-[0.98] transition duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:scale-100"
    role="tooltip"
  >
    {label}
  </span>
);


type ToolbarProps = {
    pnodes: PNode[];
    publicCount: number;
    privateCount: number;
    nodeFilter: NodeFilter;
    setNodeFilter: (filter: NodeFilter) => void;
    filterMenuOpen: boolean;
    setFilterMenuOpen: (isOpen: boolean) => void;

    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    scrollToContent: () => void;

    exportMenuOpen: boolean;
    setExportMenuOpen: (isOpen: boolean) => void;
    exportData: () => void;
    exportCsv: () => void;
    exportExcel: () => void;

    refreshing: boolean;
    refreshData: () => void;
    
    isSearchOpen: boolean;
    setIsSearchOpen: (isOpen: boolean) => void;

    setIsSettingsOpen: (isOpen: boolean) => void;

    loading: boolean;
    getTimeAgo: () => string;
};

export const Toolbar = ({
    pnodes,
    publicCount,
    privateCount,
    nodeFilter,
    setNodeFilter,
    filterMenuOpen,
    setFilterMenuOpen,
    viewMode,
    setViewMode,
    scrollToContent,
    exportMenuOpen,
    setExportMenuOpen,
    exportData,
    exportCsv,
    exportExcel,
    refreshing,
    refreshData,
    setIsSearchOpen,
    setIsSettingsOpen,
    loading,
    getTimeAgo
}: ToolbarProps) => {
  return (
    <section className="max-w-7xl mx-auto px-6">
      <div className="w-full bg-bg-card border border-border-app rounded-xl px-6 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between theme-transition">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className={TOOLBAR_BUTTON_BASE}
            aria-label="Search"
          >
            <Search className="w-5 h-5 text-text-soft" />
            <ToolbarTooltip label="Search nodes (IP, version, status)" />
          </button>

          {/* Filter */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterMenuOpen((prev) => !prev)}
              className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1")}
              aria-label="Filter"
            >
              <Eye className="w-5 h-5 text-text-soft" />
              <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", filterMenuOpen ? "rotate-180" : "rotate-0")} />
              <ToolbarTooltip label="Filter nodes by visibility" />
            </button>

            {filterMenuOpen && (
              <div className="absolute left-0 mt-3 w-56 rounded-xl border border-border-app bg-bg-card shadow-2xl z-40 overflow-hidden">
                {(
                  [
                    { key: "all" as const, label: `All (${pnodes.length})` },
                    { key: "public" as const, label: `Public (${publicCount})` },
                    { key: "private" as const, label: `Private (${privateCount})` },
                  ] satisfies Array<{ key: NodeFilter; label: string }>
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
          <button
            type="button"
            onClick={() => {
              setFilterMenuOpen(false);
              setExportMenuOpen(false);
              setViewMode("table");
              scrollToContent();
            }}
            className={clsx(
              TOOLBAR_BUTTON_BASE,
              viewMode === "table" ? "bg-cyan-500/20 text-cyan-400" : "text-text-soft"
            )}
            aria-label="Table View"
            aria-pressed={viewMode === "table"}
          >
            <List className="w-5 h-5" />
            <ToolbarTooltip label="Table View" />
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMenuOpen(false);
              setExportMenuOpen(false);
              setViewMode("grid");
              scrollToContent();
            }}
            className={clsx(
              TOOLBAR_BUTTON_BASE,
              viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-text-soft"
            )}
            aria-label="Grid View"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="w-5 h-5" />
            <ToolbarTooltip label="Grid View" />
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMenuOpen(false);
              setExportMenuOpen(false);
              setViewMode("map");
              scrollToContent();
            }}
            className={clsx(
              TOOLBAR_BUTTON_BASE,
              viewMode === "map" ? "bg-cyan-500/20 text-cyan-400" : "text-text-soft"
            )}
            aria-label="Map View"
            aria-pressed={viewMode === "map"}
          >
            <MapPin className="w-5 h-5" />
            <ToolbarTooltip label="Map View" />
          </button>

          <div className="h-6 w-px bg-border-app mx-1" />

          {/* Export */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportMenuOpen((prev) => !prev)}
              className={clsx(TOOLBAR_BUTTON_BASE, "flex items-center gap-1", pnodes.length === 0 && "opacity-50 pointer-events-none")}
              aria-label="Export"
            >
              <Download className="w-5 h-5 text-text-soft" />
              <ChevronDown className={clsx("w-4 h-4 text-text-soft transition-transform", exportMenuOpen ? "rotate-180" : "rotate-0")} />
              <ToolbarTooltip label="Export data" />
            </button>
            {exportMenuOpen && (
              <div className="absolute left-0 mt-3 w-48 rounded-xl border border-border-app bg-bg-card shadow-2xl z-40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    exportData();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                >
                  JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportCsv();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                >
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportExcel();
                    setExportMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-sm text-text-main hover:bg-bg-bg2 transition-colors"
                >
                  Excel
                </button>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={refreshData}
            className={TOOLBAR_BUTTON_BASE}
            aria-label="Refresh"
          >
            <RefreshCw className={clsx("w-5 h-5 text-text-soft", refreshing ? "animate-spin" : "")} />
            <ToolbarTooltip label="Refresh data" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => {
              setFilterMenuOpen(false);
              setExportMenuOpen(false);
              setIsSettingsOpen(true);
            }}
            className={TOOLBAR_BUTTON_BASE}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-text-soft" />
            <ToolbarTooltip label="Dashboard settings" />
          </button>
        </div>

        {/* Live status */}
        <div className="flex items-center gap-2">
          {loading || refreshing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-text-soft" />
              <span className="text-xs text-text-soft font-mono">Updating...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-xs text-text-soft font-mono">{getTimeAgo() || "—"}</span>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
