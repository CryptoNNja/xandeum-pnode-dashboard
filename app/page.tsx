"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Search, List, LayoutGrid, MapPin, Download, RefreshCw, Settings, Loader2, CheckCircle, ChevronDown, Check, Star, Github, Twitter, Users } from "lucide-react";
import clsx from "clsx";
import EnhancedHero from "@/components/EnhancedHero";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { usePnodeDashboard } from "@/hooks/usePnodeDashboard";
import { useFavorites } from "@/hooks/useFavorites";
import { SummaryHeader } from "@/components/Dashboard/SummaryHeader";
import { DashboardContent } from "@/components/Dashboard/DashboardContent";
import { AlertsHubModal } from "@/components/Dashboard/AlertsHubModal";
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
import ManagerBoardModal from "@/components/Dashboard/ManagerBoardModal";
import { hexToRgba, getKpiColors, getStatusColors } from "@/lib/utils";
import { generatePDFReport } from "@/lib/pdf-export";
import { useToast } from "@/components/common/Toast";
import Joyride from 'react-joyride';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getJoyrideStyles } from '@/lib/joyride-styles';
import { Map3DWidget } from '@/components/Map3DWidget';

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
    staleFilter,
    setStaleFilter,
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
    // Network filter
    networkFilter,
    setNetworkFilter,
  } = usePnodeDashboard(theme);

  const toast = useToast();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAlertHubOpen, setIsAlertHubOpen] = useState(false);
  const [alertHubConfig, setAlertHubConfig] = useState<{
    defaultTab: 'alerts' | 'analytics';
    defaultFilters?: { severity?: 'all' | 'critical' | 'warning' };
  }>({ defaultTab: 'alerts' });
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isGeographicModalOpen, setIsGeographicModalOpen] = useState(false);
  const [isManagerBoardOpen, setIsManagerBoardOpen] = useState(false);
  const [isManagerBoardHovered, setIsManagerBoardHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Initialize currentTime on mount (React purity rule)
  useEffect(() => {
    setCurrentTime(Date.now());
  }, []);
  
  // Network filter is now handled inside the hook

  // Network-specific stats for breakdown display
  // Use polled summary counters when available (cheap "live"), fall back to derived counts from full dataset.
  const mainnetNodes = useMemo(() => pnodes.filter(n => n.network === "MAINNET"), [pnodes]);
  const devnetNodes = useMemo(() => pnodes.filter(n => n.network === "DEVNET"), [pnodes]);

  const mainnetCount = pnodesSummary?.mainnet ?? mainnetNodes.length;
  const devnetCount = pnodesSummary?.devnet ?? devnetNodes.length;

  const mainnetPublic = pnodesSummary?.mainnetPublic ?? mainnetNodes.filter(n => n.node_type === "public").length;
  const mainnetPrivate = pnodesSummary?.mainnetPrivate ?? mainnetNodes.filter(n => n.node_type === "private").length;
  const devnetPublic = pnodesSummary?.devnetPublic ?? devnetNodes.filter(n => n.node_type === "public").length;
  const devnetPrivate = pnodesSummary?.devnetPrivate ?? devnetNodes.filter(n => n.node_type === "private").length;

  // 🆕 Calculate MAINNET registry metrics
  const mainnetOfficialCount = useMemo(() => 
    mainnetNodes.filter(n => n.is_official === true || n.source === 'both' || n.source === 'registry').length,
    [mainnetNodes]
  );
  const mainnetRegistryCoverage = useMemo(() => 
    mainnetCount > 0 ? (mainnetOfficialCount / mainnetCount) * 100 : 0,
    [mainnetOfficialCount, mainnetCount]
  );

  // 🆕 Calculate Network Operators metrics
  const operatorsMetrics = useMemo(() => {
    const operatorMap = new Map<string, { count: number; nodes: typeof pnodes; totalStorage: number }>();
    
    pnodes.forEach(node => {
      if (!node.pubkey) return;
      
      const existing = operatorMap.get(node.pubkey);
      const storage = node.stats?.storage_committed || 0;
      
      if (existing) {
        existing.count++;
        existing.nodes.push(node);
        existing.totalStorage += storage;
      } else {
        operatorMap.set(node.pubkey, {
          count: 1,
          nodes: [node],
          totalStorage: storage
        });
      }
    });

    const operators = Array.from(operatorMap.entries()).map(([pubkey, data]) => ({
      pubkey,
      nodeCount: data.count,
      nodes: data.nodes,
      totalStorage: data.totalStorage,
      avgStorage: data.totalStorage / data.count
    }));

    operators.sort((a, b) => b.nodeCount - a.nodeCount);

    const uniqueManagers = operators.length;
    const multiNodeOperators = operators.filter(op => op.nodeCount >= 2).length;
    const topOperator = operators[0] || null;
    const singleNodeOperators = operators.filter(op => op.nodeCount === 1).length;

    return {
      uniqueManagers,
      multiNodeOperators,
      topOperator,
      singleNodeOperators,
      operators
    };
  }, [pnodes]);

  // Recalculate publicCount and privateCount based on filtered nodes
  const filteredPublicCount = useMemo(() => {
    return filteredAndSortedPNodes.filter(n => n.node_type === "public").length;
  }, [filteredAndSortedPNodes]);

  const filteredPrivateCount = useMemo(() => {
    return filteredAndSortedPNodes.filter(n => n.node_type === "private").length;
  }, [filteredAndSortedPNodes]);
  
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
    pnodes.filter(node => node.ip && selectedNodeIds.has(node.ip)), 
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
  const [is3DMapOpen, setIs3DMapOpen] = useState(false);
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
    setSelectedNodeIds(new Set(paginatedPNodes.filter(node => node.ip).map(node => node.ip!)));
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
    const nodes = pnodes.filter(node => node.ip && selectedNodeIds.has(node.ip));
    setNodesToCompare(nodes);
    setIsCompareModalOpen(true);
  }, [selectedNodeIds, pnodes]);

  const handleCompareFromModal = useCallback((ips: string[]) => {
    const nodes = pnodes.filter(node => node.ip && ips.includes(node.ip));
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

  // "Storage used" as reported by get-stats (field: total_bytes), summed over PUBLIC nodes.
  // This is closer to what the official dashboard appears to display.
  const totalStorageUsedStats = useMemo(() => {
    return pnodes
      .filter((p) => p.node_type === "public")
      .reduce((sum, p) => sum + (p.stats?.total_bytes ?? 0), 0);
  }, [pnodes]);

  // Calculate total pages across all nodes
  const totalPagesCount = useMemo(() => {
    return pnodes
      .filter((p) => p.node_type === "public")
      .reduce((sum, p) => sum + (p.stats?.total_pages ?? 0), 0);
  }, [pnodes]);

  // Calculate network bandwidth (packets per second estimate)
  const networkBandwidth = useMemo(() => {
    // Filter nodes that actually have packet data (RPC responded)
    const nodesWithPackets = pnodes.filter((p) => 
      p.node_type === "public" && 
      ((p.stats?.packets_sent ?? 0) > 0 || (p.stats?.packets_received ?? 0) > 0)
    );
    
    const totalPackets = nodesWithPackets.reduce(
      (sum, p) => sum + (p.stats?.packets_sent ?? 0) + (p.stats?.packets_received ?? 0), 
      0
    );
    
    // Rough estimate: divide by average uptime to get packets/sec
    const avgUptime = nodesWithPackets
      .filter((p) => (p.stats?.uptime ?? 0) > 0)
      .reduce((sum, p, _, arr) => sum + (p.stats?.uptime ?? 0) / arr.length, 0);
    
    return {
      packetsPerSecond: avgUptime > 0 ? totalPackets / avgUptime : 0,
      reportingNodes: nodesWithPackets.length,
      totalActiveNodes: pnodes.filter((p) => p.node_type === "public").length
    };
  }, [pnodes]);

  // Version adoption percentage (already calculated in versionChart)
  const versionAdoptionPercent = useMemo(() => {
    return parseInt(versionChart.latestPercentLabel) || 0;
  }, [versionChart]);


  // Export PDF Report - Full Network
  const exportPdf = useCallback(() => {
    const nodeCount = pnodes.length;
    
    // Show confirmation dialog for large exports (>100 nodes)
    if (nodeCount > 100) {
      const confirmed = window.confirm(
        `⚠️ Large Export Warning\n\n` +
        `You are about to export ${nodeCount} nodes to PDF.\n` +
        `This may take 10-30 seconds and could slow down your browser.\n\n` +
        `Do you want to continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    // Show loading toast
    toast.info(`Generating PDF... (${nodeCount} nodes)`, 30000); // 30s duration for long operations
    
    // Use setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
      try {
        const totalPackets = pnodes.reduce((sum, p) => sum + (p.stats?.packets_sent || 0) + (p.stats?.packets_received || 0), 0);
        const totalStorage = pnodes.reduce((sum, p) => sum + (p.stats?.storage_committed || 0), 0);
        
        const summary = {
          totalNodes: publicCount + privateCount, // ⚠️ Exclude stale nodes
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
        
        // Success toast
        toast.success('PDF exported successfully!');
      } catch (error) {
        console.error('PDF export failed:', error);
        toast.error('PDF export failed. Please try again.');
      }
    }, 100);
  }, [pnodes, publicCount, privateCount, avgCpuUsage, avgRamUsage, toast]);

  // Export PDF Report - Selected Nodes (NEW!)
  const exportSelectedPdf = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    const nodeCount = selectedNodes.length;
    
    // Show confirmation dialog for large exports (>100 nodes)
    if (nodeCount > 100) {
      const confirmed = window.confirm(
        `⚠️ Large Export Warning\n\n` +
        `You are about to export ${nodeCount} selected nodes to PDF.\n` +
        `This may take 10-30 seconds and could slow down your browser.\n\n` +
        `Do you want to continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    // Show loading toast
    toast.info(`Exporting ${nodeCount} selected nodes...`, 30000); // 30s duration for long operations
    
    // Use setTimeout to allow UI to update before heavy processing
    setTimeout(() => {
      try {
        const totalPackets = selectedNodes.reduce((sum, n) => sum + (n.stats?.packets_sent || 0) + (n.stats?.packets_received || 0), 0);
        const totalStorage = selectedNodes.reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);

        const summary = {
          totalNodes: selectedNodes.length,
          publicNodes: selectedNodes.filter(n => n.node_type === 'public').length,
          privateNodes: selectedNodes.filter(n => n.node_type === 'private').length,
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
        
        // Success toast
        toast.success('PDF exported successfully!');
      } catch (error) {
        console.error('PDF export failed:', error);
        toast.error('PDF export failed. Please try again.');
      }
    }, 100);
  }, [selectedNodes, toast]);

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
        styles={getJoyrideStyles(theme)}
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
        warningCount={warningCount}
        onAlertsClick={() => setIsAlertHubOpen(true)}
      />

      {/* ABOUT PNODES - Educational Section */}
      <div className="mt-8">
          <AboutPNodes
          totalStorageCommitted={totalStorageCommitted}
          totalStorageUsedPods={totalStorageUsedPods}
          totalStorageUsedStats={totalStorageUsedStats}
          networkMetadata={networkMetadata}
          countriesCount={countriesCount}
          totalNodes={publicCount + privateCount}
        />
      </div>

      <section className="max-w-7xl mx-auto px-6 space-y-8 w-full mt-8">
        {/* TOP LEVEL KPIs */}
        <SummaryHeader
          publicCount={publicCount}
          privateCount={privateCount}
          totalNodes={publicCount + privateCount}
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
          operatorsMetrics={operatorsMetrics}
        />

        {/* DETAILED KPI CARDS */}
        <KpiCards
          publicCount={publicCount}
          privateCount={privateCount}
          totalNodes={publicCount + privateCount}
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
          onAlertsClick={(tab, filters) => {
            setAlertHubConfig({ defaultTab: tab, defaultFilters: filters });
            setIsAlertHubOpen(true);
          }}
          healthDistribution={healthDistribution}
          cpuDistribution={cpuDistribution}
          storageDistribution={storageDistribution}
          pagesDistribution={pagesDistribution}
          pnodes={pnodes}
          mainnetCount={mainnetCount}
          mainnetOfficialCount={mainnetOfficialCount}
          mainnetRegistryCoverage={mainnetRegistryCoverage}
          operatorsMetrics={operatorsMetrics}
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
            pnodesCount={filteredAndSortedPNodes.length}
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
            staleFilter={staleFilter}
            setStaleFilter={setStaleFilter}
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
          paginatedPNodes={paginatedPNodes}
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          gridPNodes={filteredAndSortedPNodes.slice(0, gridLimit === -1 ? filteredAndSortedPNodes.length : gridLimit)}
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
      <AlertsHubModal
        isOpen={isAlertHubOpen}
        onClose={() => setIsAlertHubOpen(false)}
        alerts={alerts}
        totalNodes={publicCount + privateCount}
        isLight={isLight}
        defaultTab={alertHubConfig.defaultTab}
        defaultFilters={alertHubConfig.defaultFilters}
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
        totalNodes={publicCount + privateCount}
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

      {/* Manager Board Modal */}
      <ManagerBoardModal
        isOpen={isManagerBoardOpen}
        onClose={() => setIsManagerBoardOpen(false)}
      />

      {/* Floating Manager Board Button - Above Calculator */}
      <button
        onClick={() => setIsManagerBoardOpen(true)}
        onMouseEnter={() => setIsManagerBoardHovered(true)}
        onMouseLeave={() => setIsManagerBoardHovered(false)}
        className="fixed bottom-[168px] right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg hover:shadow-2xl transform hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
        aria-label="Open Manager Board"
      >
        <Users className="w-7 h-7 text-white transition-transform duration-300" />
        
        {/* Pulse animation */}
        {!isManagerBoardOpen && (
          <span className="absolute inset-0 rounded-full bg-orange-500 animate-ping opacity-20" />
        )}
      </button>

      {/* Manager Board Tooltip */}
      {isManagerBoardHovered && !isManagerBoardOpen && (
        <div className="fixed bottom-[168px] right-24 z-50 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-right-2 duration-200">
          Manager Board
        </div>
      )}

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
      
      {/* 3D GLOBE WIDGET */}
      <Map3DWidget pnodes={pnodes} />
    </main>
  );
}
