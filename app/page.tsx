"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Search, List, LayoutGrid, MapPin, Download, RefreshCw, Settings, Loader2, CheckCircle, ChevronDown, Check, Star, Github, Twitter } from "lucide-react";
import clsx from "clsx";
import EnhancedHero from "@/components/EnhancedHero";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { usePnodeDashboard } from "@/hooks/usePnodeDashboard";
import { useFavorites } from "@/hooks/useFavorites";
import { SummaryHeader } from "@/components/Dashboard/SummaryHeader";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import { AlertsModal } from "@/components/Dashboard/AlertsModal";
import { VersionDetailsModal } from "@/components/Dashboard/VersionDetailsModal";
import { GeographicDistributionModal } from "@/components/Dashboard/GeographicDistributionModal";
import { KpiCards } from "@/components/Dashboard/KpiCards";
import { Toolbar } from "@/components/Dashboard/Toolbar";
import { AdvancedFilters } from "@/components/Dashboard/AdvancedFilters";
import { AboutPNodes } from "@/components/Dashboard/AboutPNodes";
import { SelectionActionBar } from "@/components/SelectionActionBar";
import { CompareNodesModal } from "@/components/Dashboard/CompareNodesModal";
import { FavoritesModal } from "@/components/Dashboard/FavoritesModal";
import { NetworkToggle } from "@/components/Dashboard/NetworkToggle"; // 🆕
import { hexToRgba, getKpiColors, getStatusColors } from "@/lib/utils";
import { generatePDFReport } from "@/lib/pdf-export";
import { useToast } from "@/components/common/Toast";
import Joyride from 'react-joyride';
import { useOnboarding } from '@/hooks/useOnboarding';

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

  // Onboarding tour
  const { run, steps, stepIndex, handleJoyrideCallback, resetTour } = useOnboarding();

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
    maxStorageBytes,
    sliderToBytes,
    resetFilters,
    availableVersions,
    autoRefreshOption,
    setAutoRefreshOption,
    lastUpdate,
    pnodesSummary,
    healthFilter,
    setHealthFilter,
    networkHealthInsights,
    networkSyncMetrics,
    networkParticipation,
    networkMetadata,
    networkUptimeStats,
    storageCapacityStats,
    storageBarColors,
    avgCpuUsage,
    avgRamUsage,
    cpuDistribution,
    storageDistribution,
    pagesDistribution,
    versionChart,
    healthDistribution,
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
    exportExcel,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedPNodes,
    // Grid View
    gridPNodes,
    gridLimit,
    setGridLimit,
  } = usePnodeDashboard(theme);

  const toast = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isGeographicModalOpen, setIsGeographicModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // 🆕 Network filter state (MAINNET/DEVNET/ALL)
  const [networkFilter, setNetworkFilter] = useState<"MAINNET" | "DEVNET" | "all">("all");
  
  // 🆕 Apply network filter to pnodes
  const networkFilteredPNodes = useMemo(() => {
    if (networkFilter === "all") return filteredAndSortedPNodes;
    return filteredAndSortedPNodes.filter(node => node.network === networkFilter);
  }, [filteredAndSortedPNodes, networkFilter]);

  // Network-specific stats for breakdown display
  // Use polled summary counters when available (cheap "live"), fall back to derived counts from full dataset.
  const mainnetNodes = useMemo(() => pnodes.filter(n => n.network === "MAINNET"), [pnodes]);
  const devnetNodes = useMemo(() => pnodes.filter(n => n.network === "DEVNET"), [pnodes]);

  const mainnetCount = pnodesSummary?.mainnet ?? mainnetNodes.length;
  const devnetCount = pnodesSummary?.devnet ?? devnetNodes.length;

  const mainnetPublic = pnodesSummary?.mainnetPublic ?? mainnetNodes.filter(n => n.status === "active").length;
  const mainnetPrivate = pnodesSummary?.mainnetPrivate ?? mainnetNodes.filter(n => n.status !== "active").length;
  const devnetPublic = pnodesSummary?.devnetPublic ?? devnetNodes.filter(n => n.status === "active").length;
  const devnetPrivate = pnodesSummary?.devnetPrivate ?? devnetNodes.filter(n => n.status !== "active").length;

  // Recalculate publicCount and privateCount based on active network filter
  const filteredPublicCount = useMemo(() => {
    return networkFilteredPNodes.filter(n => n.status === "active").length;
  }, [networkFilteredPNodes]);

  const filteredPrivateCount = useMemo(() => {
    return networkFilteredPNodes.filter(n => n.status !== "active").length;
  }, [networkFilteredPNodes]);
  
  const mainnetStorage = useMemo(() => 
    mainnetNodes.reduce((sum, n) => sum + (n.stats?.storage_committed ?? 0), 0),
    [mainnetNodes]
  );
  
  const devnetStorage = useMemo(() => 
    devnetNodes.reduce((sum, n) => sum + (n.stats?.storage_committed ?? 0), 0),
    [devnetNodes]
  );
  
  // Selection state for multi-node operations
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
  const selectedNodes = useMemo(() => 
    pnodes.filter(node => selectedNodeIds.has(node.ip)), 
    [pnodes, selectedNodeIds]
  );

  // Favorites management
  const {
    favorites,
    favoriteIds,
    toggleFavorite,
    addMultipleFavorites,
    removeFavorite,
    clearFavorites,
    exportFavorites,
    importFavorites,
  } = useFavorites();

  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [nodesToCompare, setNodesToCompare] = useState<typeof pnodes>([]);

  // Selection handlers
  const handleToggleSelection = useCallback((nodeIp: string) => {
    setSelectedNodeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeIp)) {
        newSet.delete(nodeIp);
      } else {
        newSet.add(nodeIp);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedNodeIds(new Set(paginatedPNodes.map(node => node.ip)));
  }, [paginatedPNodes]);

  const handleClearSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
  }, []);

  // Favorites handlers
  const handleToggleFavorite = useCallback((nodeIp: string) => {
    const isAdded = toggleFavorite(nodeIp);
    toast.success(isAdded ? `Added ${nodeIp} to favorites` : `Removed ${nodeIp} from favorites`);
  }, [toggleFavorite, toast]);

  const handleAddSelectedToFavorites = useCallback(() => {
    const ipsToAdd = Array.from(selectedNodeIds);
    addMultipleFavorites(ipsToAdd);
    toast.success(`Added ${ipsToAdd.length} node${ipsToAdd.length > 1 ? 's' : ''} to favorites`);
  }, [selectedNodeIds, addMultipleFavorites, toast]);

  const handleCompareSelected = useCallback(() => {
    const nodes = pnodes.filter(node => selectedNodeIds.has(node.ip));
    setNodesToCompare(nodes);
    setIsCompareModalOpen(true);
  }, [selectedNodeIds, pnodes]);

  const handleCompareFromModal = useCallback((ips: string[]) => {
    const nodes = pnodes.filter(node => ips.includes(node.ip));
    setNodesToCompare(nodes);
    setIsCompareModalOpen(true);
  }, [pnodes]);

  const handleExportFavorites = useCallback(() => {
    const jsonStr = exportFavorites();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pnode-favorites-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Favorites exported successfully');
  }, [exportFavorites, toast]);

  const handleClearAllFavorites = useCallback(() => {
    if (confirm(`Are you sure you want to remove all ${favorites.length} favorites?`)) {
      clearFavorites();
      toast.success('All favorites cleared');
    }
  }, [favorites.length, clearFavorites, toast]);

  // Growth metrics from historical data
  const [networkGrowthRate, setNetworkGrowthRate] = useState(0);
  const [storageGrowthRate, setStorageGrowthRate] = useState(0);
  const [networkHistory, setNetworkHistory] = useState<Array<{ date: string; nodes: number }>>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Fetch growth metrics on mount
  useEffect(() => {
    async function fetchGrowthMetrics() {
      try {
        const response = await fetch("/api/growth-metrics", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setNetworkGrowthRate(data.networkGrowthRate || 0);
          setStorageGrowthRate(data.storageGrowthRate || 0);
        }
      } catch (error) {
        console.error("Error fetching growth metrics:", error);
      }
    }
    fetchGrowthMetrics();
  }, []);

  // Fetch network history for the growth chart
  useEffect(() => {
    async function fetchNetworkHistory() {
      try {
        const response = await fetch("/api/network-history", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.hasData && data.history) {
            setNetworkHistory(data.history);
          }
        }
      } catch (error) {
        console.error("Error fetching network history:", error);
      }
    }
    fetchNetworkHistory();
  }, []);

  const getTimeAgo = useCallback(() => {
    if (!lastUpdate) return "";
    const seconds = Math.floor((currentTime - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [currentTime, lastUpdate]);

  // Calculate unique countries from ALL pnodes with location data (public + private)
  const countriesCount = useMemo(() => {
    const countries = new Set<string>();
    pnodes.forEach((p) => {
      // Include both public and private nodes for geographic diversity
      if (p.country && p.country !== "Unknown") {
        // Normalize country names
        const normalizedCountry = p.country === "The Netherlands" ? "Netherlands" : p.country;
        countries.add(normalizedCountry);
      }
    });
    return countries.size;
  }, [pnodes]);

  const countriesWithCodes = useMemo(() => {
    const countriesMap = new Map<string, string>();
    pnodes.forEach((p) => {
      if (p.country && p.country !== "Unknown" && p.country_code) {
        countriesMap.set(p.country, p.country_code.toUpperCase());
      }
    });
    return Array.from(countriesMap, ([name, code]) => ({ name, code }));
  }, [pnodes]);

  // pnodes is already deduplicated by pubkey in usePnodeDashboard hook
  // Calculate total storage committed (from ALL nodes, not just active)
  // Use storage_committed which comes from get-pods-with-stats API
  const totalStorageCommitted = useMemo(() => {
    return pnodes.reduce((sum, p) => sum + (p.stats?.storage_committed ?? 0), 0);
  }, [pnodes]);

  // Calculate total storage used (from ALL nodes with storage_used data)
  // Use storage_used from get-pods-with-stats API
  // "Storage used" as reported by get-pods-with-stats (field: storage_used).
  // In practice this is currently very small (MBs) on the network.
  const totalStorageUsedPods = useMemo(() => {
    return pnodes.reduce((sum, p) => sum + (p.stats?.storage_used ?? 0), 0);
  }, [pnodes]);

  // "Storage used" as reported by get-stats (field: total_bytes), summed over ACTIVE nodes.
  // This is closer to what the official dashboard appears to display.
  const totalStorageUsedStats = useMemo(() => {
    return pnodes
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + (p.stats?.total_bytes ?? 0), 0);
  }, [pnodes]);

  // Calculate total pages across all nodes
  const totalPagesCount = useMemo(() => {
    return pnodes
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + (p.stats?.total_pages ?? 0), 0);
  }, [pnodes]);

  // Calculate network bandwidth (packets per second estimate)
  const networkBandwidth = useMemo(() => {
    const totalPackets = pnodes
      .filter((p) => p.status === "active")
      .reduce((sum, p) => sum + (p.stats?.packets_sent ?? 0) + (p.stats?.packets_received ?? 0), 0);
    
    // Rough estimate: divide by average uptime to get packets/sec
    const avgUptime = pnodes
      .filter((p) => p.status === "active" && (p.stats?.uptime ?? 0) > 0)
      .reduce((sum, p, _, arr) => sum + (p.stats?.uptime ?? 0) / arr.length, 0);
    
    return avgUptime > 0 ? totalPackets / avgUptime : 0;
  }, [pnodes]);

  // Version adoption percentage (already calculated in versionChart)
  const versionAdoptionPercent = useMemo(() => {
    return parseInt(versionChart.latestPercentLabel) || 0;
  }, [versionChart]);


  // Export PDF Report - Full Network
  const exportPdf = useCallback(() => {
    const totalPackets = pnodes.reduce((sum, p) => sum + (p.stats?.packets_sent || 0) + (p.stats?.packets_received || 0), 0);
    const totalStorage = pnodes.reduce((sum, p) => sum + (p.stats?.storage_committed || 0), 0);
    
    const summary = {
      totalNodes: pnodes.length,
      publicNodes: publicCount,
      privateNodes: privateCount,
      avgCPU: avgCpuUsage.percent,
      avgRAM: avgRamUsage.ratio * 100, // Convert ratio to percentage
      avgUptime: pnodes.reduce((sum, p) => sum + (p.stats?.uptime || 0), 0) / pnodes.length,
      healthyNodes: pnodes.filter(p => ((p as any)._score || 0) >= 70).length,
      networkThroughput: totalPackets,
      totalStorage: totalStorage,
    };

    generatePDFReport({
      nodes: pnodes,
      summary,
    });
  }, [pnodes, publicCount, privateCount, avgCpuUsage, avgRamUsage]);

  // Export PDF Report - Selected Nodes (NEW!)
  const exportSelectedPdf = useCallback(() => {
    if (selectedNodes.length === 0) return;

    const totalPackets = selectedNodes.reduce((sum, n) => sum + (n.stats?.packets_sent || 0) + (n.stats?.packets_received || 0), 0);
    const totalStorage = selectedNodes.reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);

    const summary = {
      totalNodes: selectedNodes.length,
      publicNodes: selectedNodes.filter(n => n.status === 'active').length,
      privateNodes: selectedNodes.filter(n => n.status !== 'active').length,
      avgCPU: selectedNodes.reduce((sum, n) => sum + (n.stats?.cpu_percent || 0), 0) / selectedNodes.length,
      avgRAM: selectedNodes.reduce((sum, n) => {
        const usage = n.stats?.ram_used && n.stats?.ram_total 
          ? (n.stats.ram_used / n.stats.ram_total) * 100 
          : 0;
        return sum + usage;
      }, 0) / selectedNodes.length,
      avgUptime: selectedNodes.reduce((sum, n) => sum + (n.stats?.uptime || 0), 0) / selectedNodes.length,
      healthyNodes: selectedNodes.filter(n => ((n as any)._score || 0) >= 70).length,
      networkThroughput: totalPackets,
      totalStorage: totalStorage,
    };

    generatePDFReport({
      nodes: selectedNodes,
      summary,
      isCustomSelection: true,
    });
  }, [selectedNodes]);

  if (loading) {
    return <SkeletonLoader />;
  }

  const kpiColors = getKpiColors();
  const statusColors = getStatusColors();

  return (
    <main className="min-h-screen bg-bg-app text-text-main pb-20 theme-transition flex flex-col">
      <style>{TOOLTIP_STYLES}</style>

      {/* Onboarding Tour */}
      <Joyride
        steps={steps}
        run={run}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        scrollToFirstStep={true}
        scrollOffset={120}
        disableScrolling={false}
        disableOverlayClose={true}
        spotlightClicks={false}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#14f195',
            backgroundColor: theme === 'dark' ? '#1a1f3a' : '#ffffff',
            textColor: theme === 'dark' ? '#f8fafc' : '#0f172a',
            overlayColor: 'rgba(10, 14, 39, 0.85)',
            arrowColor: theme === 'dark' ? '#1a1f3a' : '#ffffff',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: '16px',
            fontSize: '14px',
            padding: '20px',
            border: theme === 'dark' 
              ? '1px solid rgba(100, 116, 139, 0.2)' 
              : '1px solid #e5e7eb',
            boxShadow: theme === 'dark'
              ? '0 20px 45px -25px rgba(2, 4, 24, 0.65), 0 0 40px rgba(20, 241, 149, 0.1)'
              : '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltipTitle: {
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '12px',
            lineHeight: '1.4',
          },
          tooltipContent: {
            fontSize: '14px',
            lineHeight: '1.6',
            padding: '0',
          },
          buttonNext: {
            backgroundColor: '#14f195',
            color: '#0a0e27',
            borderRadius: '8px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            boxShadow: '0 0 20px rgba(20, 241, 149, 0.3)',
            transition: 'all 0.3s ease',
          },
          buttonBack: {
            color: '#14f195',
            fontSize: '14px',
            fontWeight: '600',
            marginRight: '12px',
          },
          buttonSkip: {
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: '500',
          },
          spotlight: {
            borderRadius: '12px',
            boxShadow: '0 0 0 9999px rgba(10, 14, 39, 0.85), 0 0 40px rgba(20, 241, 149, 0.2)',
          },
          beaconInner: {
            backgroundColor: '#14f195',
          },
          beaconOuter: {
            backgroundColor: 'rgba(20, 241, 149, 0.3)',
            borderColor: '#14f195',
          },
        }}
        locale={{
          back: '← Back',
          close: 'Close',
          last: 'Finish Tour ✓',
          next: 'Next →',
          skip: 'Skip Tour',
        }}
      />

      <EnhancedHero
        criticalCount={criticalCount}
        onAlertsClick={() => setIsAlertOpen(true)}
      />

      {/* ABOUT PNODES - Educational Section */}
      <div className="mt-8">
          <AboutPNodes
          totalStorageCommitted={totalStorageCommitted}
          totalStorageUsedPods={totalStorageUsedPods}
          totalStorageUsedStats={totalStorageUsedStats}
          networkMetadata={networkMetadata}
          countriesCount={countriesCount}
          totalNodes={pnodes.length}
        />
      </div>

      <section className="max-w-7xl mx-auto px-6 space-y-8 w-full mt-8">
        {/* TOP LEVEL KPIs */}
        <SummaryHeader
          publicCount={publicCount}
          privateCount={privateCount}
          totalNodes={pnodes.length}
          networkHealthInsights={networkHealthInsights}
          networkUptimeStats={networkUptimeStats}
          alerts={alerts}
          criticalCount={criticalCount}
          warningCount={warningCount}
          isLight={isLight}
          mainnetPublic={mainnetPublic}
          mainnetPrivate={mainnetPrivate}
          mainnetCount={mainnetCount}
          devnetPublic={devnetPublic}
          devnetPrivate={devnetPrivate}
          devnetCount={devnetCount}
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
          activeStreamsTotal={pnodes.reduce((sum, p) => sum + (p.stats?.active_streams || 0), 0)}
          activeNodesWithStreams={pnodes.filter(p => (p.stats?.active_streams || 0) > 0).length}
          KPI_COLORS={kpiColors}
          STATUS_COLORS={statusColors}
          hexToRgba={hexToRgba}
          networkParticipation={networkParticipation}
          networkMetadata={networkMetadata}
          isLight={isLight}
          countriesCount={countriesCount}
          countriesWithCodes={countriesWithCodes}
          totalPagesCount={totalPagesCount}
          networkGrowthRate={networkGrowthRate}
          storageGrowthRate={storageGrowthRate}
          networkHistory={networkHistory}
          networkBandwidth={networkBandwidth}
          versionAdoptionPercent={versionAdoptionPercent}
          onVersionClick={() => setIsVersionModalOpen(true)}
          onGeographicClick={() => setIsGeographicModalOpen(true)}
          healthDistribution={healthDistribution}
          cpuDistribution={cpuDistribution}
          storageDistribution={storageDistribution}
          pagesDistribution={pagesDistribution}
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
            onExportData={exportData}
            onExportCsv={exportCsv}
            onExportExcel={exportExcel}
            onExportPdf={exportPdf}
            onExportSelectedPdf={exportSelectedPdf}
            selectedNodesCount={selectedNodeIds.size}
            isAdvancedFilterOpen={isAdvancedFilterOpen}
            setIsAdvancedFilterOpen={setIsAdvancedFilterOpen}
            lastUpdateText={getTimeAgo()}
            pnodesCount={networkFilteredPNodes.length}
            publicCount={filteredPublicCount}
            privateCount={filteredPrivateCount}
            resetFilters={resetFilters}
            selectedVersions={selectedVersions}
            selectedHealthStatuses={selectedHealthStatuses}
            minCpu={minCpu}
            minStorage={minStorage}
            favoritesCount={favorites.length}
            onOpenFavorites={() => setIsFavoritesModalOpen(true)}
            onResetTour={resetTour}
            mainnetCount={mainnetCount}
            devnetCount={devnetCount}
            networkFilter={networkFilter}
            setNetworkFilter={setNetworkFilter}
          />

          <AdvancedFilters
            isOpen={isAdvancedFilterOpen}
            onClose={() => setIsAdvancedFilterOpen(false)}
            versionBuckets={versionChart.entries}
            selectedVersions={selectedVersions}
            setSelectedVersions={setSelectedVersions}
            selectedHealthStatuses={selectedHealthStatuses}
            setSelectedHealthStatuses={setSelectedHealthStatuses}
            minCpu={minCpu}
            setMinCpu={setMinCpu}
            minStorage={minStorage}
            setMinStorage={setMinStorage}
            maxStorageBytes={maxStorageBytes}
            sliderToBytes={sliderToBytes}
            onReset={resetFilters}
            resultsCount={quickResultsCount}
          />
        </div>

        {/* MAIN CONTENT */}
        <DashboardContent
          viewMode={viewMode}
          filteredAndSortedPNodes={networkFilteredPNodes}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          loading={loading}
          isLight={isLight}
          paginatedPNodes={networkFilteredPNodes.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
          currentPage={currentPage}
          totalPages={Math.ceil(networkFilteredPNodes.length / pageSize)}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          gridPNodes={networkFilteredPNodes.slice(0, gridLimit === -1 ? networkFilteredPNodes.length : gridLimit)}
          gridLimit={gridLimit}
          setGridLimit={setGridLimit}
          selectedNodeIds={selectedNodeIds}
          onToggleSelection={handleToggleSelection}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
        />
      </section>

      {/* SELECTION ACTION BAR */}
      <SelectionActionBar
        selectedCount={selectedNodeIds.size}
        onAddToFavorites={handleAddSelectedToFavorites}
        onCompare={handleCompareSelected}
        onExport={exportSelectedPdf}
        onClear={handleClearSelection}
        canCompare={selectedNodeIds.size >= 2 && selectedNodeIds.size <= 4}
        maxCompareNodes={4}
      />

      {/* FOOTER */}
      <footer className="border-t border-border-app bg-bg-bg px-6 py-5 mt-10 w-full theme-transition">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="text-center md:text-left">
            <p className="text-text-faint text-sm mb-1">
              Built for <span className="text-accent-aqua font-semibold">Xandeum</span> • Superteam Earn Bounty
            </p>
            <p className="text-text-soft text-xs">Ronin v1.0 - pNode Analytics Dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Social Icons */}
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/CryptoNNja"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-border-app bg-bg-card flex items-center justify-center transition-all duration-300 hover:border-accent-purple hover:bg-accent-purple/10 hover:scale-110 group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 text-text-soft group-hover:text-accent-purple transition-colors" />
              </a>
              <a
                href="https://x.com/Crypt0xNinja"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-border-app bg-bg-card flex items-center justify-center transition-all duration-300 hover:border-accent-aqua hover:bg-accent-aqua/10 hover:scale-110 group"
                aria-label="Twitter / X"
              >
                <Twitter className="w-5 h-5 text-text-soft group-hover:text-accent-aqua transition-colors" />
              </a>
            </div>

            {/* Author */}
            <a
              href="https://x.com/Crypt0xNinja"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group"
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-110">
                <Image
                  src="/avatar-ninja.png"
                  alt="Ninja0x Avatar"
                  width={36}
                  height={36}
                  className="object-cover"
                />
              </div>
              <p className="text-xs text-text-soft group-hover:text-text-main transition-colors">
                Built with <span className="text-red-400">❤️</span> by <span className="font-semibold text-text-main">Ninja0x</span>
              </p>
            </a>
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

      <VersionDetailsModal
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        versionChart={versionChart}
        pnodes={pnodes}
        isLight={isLight}
        onFilterByVersion={(version) => {
          // Filter dashboard by version
          setSearchTerm(version);
        }}
      />

      <GeographicDistributionModal
        isOpen={isGeographicModalOpen}
        onClose={() => setIsGeographicModalOpen(false)}
        totalNodes={pnodes.length}
        countriesCount={countriesCount}
        isLight={isLight}
      />

      {/* FAVORITES MODAL */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favorites={favorites}
        allNodes={pnodes}
        onRemoveFavorite={removeFavorite}
        onClearAll={handleClearAllFavorites}
        onCompare={handleCompareFromModal}
        onExport={handleExportFavorites}
        onImport={importFavorites}
        isLight={isLight}
      />

      {/* COMPARE NODES MODAL */}
      <CompareNodesModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        nodes={nodesToCompare}
        isLight={isLight}
        onAddToFavorites={(ips) => {
          addMultipleFavorites(ips);
          toast.success(`Added ${ips.length} nodes to favorites`);
        }}
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
