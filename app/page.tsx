"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, List, LayoutGrid, MapPin, Download, RefreshCw, Settings, Loader2, CheckCircle, ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import EnhancedHero from "@/components/EnhancedHero";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { usePnodeDashboard } from "@/hooks/usePnodeDashboard";
import { SummaryHeader } from "@/components/Dashboard/SummaryHeader";
import { ChartsSection } from "@/components/Dashboard/ChartsSection";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import { AlertsModal } from "@/components/Dashboard/AlertsModal";
import { SettingsModal } from "@/components/Dashboard/SettingsModal";
import { KpiCards } from "@/components/Dashboard/KpiCards";
import { Toolbar } from "@/components/Dashboard/Toolbar";
import { AdvancedFilters } from "@/components/Dashboard/AdvancedFilters";
import { hexToRgba, getKpiColors, getStatusColors } from "@/lib/utils";

const TOOLTIP_STYLES = `
  .recharts-tooltip-wrapper { outline: none !important; }
  .recharts-default-tooltip { 
    background-color: var(--bg-card) !important; 
    border: 1px solid var(--border-app) !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    color: var(--text-main) !important;
  }
`;

export default function Page() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const {
    pnodes,
    loading,
    refreshing,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortKey,
    sortDirection,
    nodeFilter,
    setNodeFilter,
    isAdvancedFilterOpen,
    setIsAdvancedFilterOpen,
    selectedVersions,
    setSelectedVersions,
    selectedHealthStatuses,
    setSelectedHealthStatuses,
    minCpu,
    setMinCpu,
    minStorage,
    setMinStorage,
    resetFilters,
    availableVersions,
    autoRefreshOption,
    setAutoRefreshOption,
    lastUpdate,
    healthFilter,
    setHealthFilter,
    networkHealthInsights,
    networkUptimeStats,
    storageCapacityStats,
    storageBarColors,
    avgCpuUsage,
    avgRamUsage,
    cpuDistribution,
    storageDistribution,
    versionChart,
    alerts,
    criticalCount,
    warningCount,
    handleSort,
    refreshData,
    publicCount,
    privateCount,
    filteredAndSortedPNodes,
    quickResultsCount,
    exportData,
    exportCsv,
    exportExcel
  } = usePnodeDashboard(theme);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  const getTimeAgo = useCallback(() => {
    if (!lastUpdate) return "";
    const seconds = Math.floor((currentTime - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [currentTime, lastUpdate]);

  if (loading) {
    return <SkeletonLoader />;
  }

  const kpiColors = getKpiColors();
  const statusColors = getStatusColors();

  return (
    <main className="min-h-screen bg-bg-app text-text-main pb-20 theme-transition flex flex-col space-y-8">
      <style>{TOOLTIP_STYLES}</style>

      <EnhancedHero
        criticalCount={criticalCount}
        onAlertsClick={() => setIsAlertOpen(true)}
      />

      <section className="max-w-7xl mx-auto px-6 space-y-8 w-full">
        {/* TOP LEVEL KPIs */}
        <SummaryHeader
          publicCount={publicCount}
          privateCount={privateCount}
          totalNodes={pnodes.length}
          networkHealthInsights={networkHealthInsights}
          networkUptimeStats={networkUptimeStats}
        />

        {/* DETAILED KPI CARDS */}
        <KpiCards
          publicCount={publicCount}
          privateCount={privateCount}
          totalNodes={pnodes.length}
          networkHealthInsights={networkHealthInsights}
          UptimeIcon={networkUptimeStats.Icon}
          networkUptimeStats={networkUptimeStats}
          storageCapacityStats={storageCapacityStats}
          storageBarColors={storageBarColors}
          avgCpuUsage={avgCpuUsage}
          avgRamUsage={avgRamUsage}
          alerts={alerts}
          criticalCount={criticalCount}
          warningCount={warningCount}
          KPI_COLORS={kpiColors}
          STATUS_COLORS={statusColors}
          hexToRgba={hexToRgba}
        />

        {/* CHARTS SECTION */}
        <ChartsSection
          cpuDistribution={cpuDistribution}
          storageDistribution={storageDistribution}
          versionChart={versionChart}
          latestVersionPercentage={versionChart.latestPercentLabel ? parseInt(versionChart.latestPercentLabel) : 0}
          isLight={isLight}
          pnodes={pnodes}
        />

        {/* TOOLBAR */}
        <div className="space-y-4">
          <Toolbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            viewMode={viewMode}
            setViewMode={setViewMode}
            nodeFilter={nodeFilter}
            setNodeFilter={setNodeFilter}
            onRefresh={refreshData}
            refreshing={refreshing}
            onSettingsClick={() => setIsSettingsOpen(true)}
            onExportData={exportData}
            onExportCsv={exportCsv}
            onExportExcel={exportExcel}
            isAdvancedFilterOpen={isAdvancedFilterOpen}
            setIsAdvancedFilterOpen={setIsAdvancedFilterOpen}
            lastUpdateText={getTimeAgo()}
            pnodesCount={pnodes.length}
            publicCount={publicCount}
            privateCount={privateCount}
            resetFilters={resetFilters}
            selectedVersions={selectedVersions}
            selectedHealthStatuses={selectedHealthStatuses}
            minCpu={minCpu}
            minStorage={minStorage}
          />

          <AdvancedFilters
            isOpen={isAdvancedFilterOpen}
            onClose={() => setIsAdvancedFilterOpen(false)}
            availableVersions={availableVersions}
            selectedVersions={selectedVersions}
            setSelectedVersions={setSelectedVersions}
            selectedHealthStatuses={selectedHealthStatuses}
            setSelectedHealthStatuses={setSelectedHealthStatuses}
            minCpu={minCpu}
            setMinCpu={setMinCpu}
            minStorage={minStorage}
            setMinStorage={setMinStorage}
            onReset={resetFilters}
            resultsCount={quickResultsCount}
          />
        </div>

        {/* MAIN CONTENT */}
        <DashboardContent
          viewMode={viewMode}
          filteredAndSortedPNodes={filteredAndSortedPNodes}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading}
          isLight={isLight}
        />
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border-app bg-bg-bg p-8 mt-auto w-full theme-transition">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-text-faint text-sm mb-1">
              Built for <span className="text-accent-aqua font-semibold">Xandeum</span> • Superteam Earn Bounty
            </p>
            <p className="text-text-soft text-xs">Official pNode Analytics Dashboard v1.0</p>
          </div>
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-border-app bg-bg-card shadow-sm">
            <div className="w-8 h-8 rounded-full bg-accent-aqua/10 flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-accent-aqua">NX</span>
            </div>
            <p className="text-xs text-text-soft">
              Coded with <span className="text-red-400">❤️</span> by <span className="font-semibold text-text-main">Ninja0x</span>
            </p>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AlertsModal
        isOpen={isAlertOpen}
        onClose={() => setIsAlertOpen(false)}
        alerts={alerts}
        isLight={isLight}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        autoRefreshOption={autoRefreshOption}
        setAutoRefreshOption={setAutoRefreshOption}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isLight={isLight}
      />

      {/* SEARCH MODAL */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-bg-app border border-border-app rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border-app flex items-center justify-between">
              <h2 className="text-lg font-bold">Search Nodes</h2>
              <button onClick={() => setIsSearchOpen(false)} className="text-text-faint hover:text-text-main">
                <ChevronDown className="rotate-90 w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-soft" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Filter by IP, version, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-bg-bg rounded-xl border border-border-app outline-none focus:border-accent theme-transition"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
