
"use client"

import { useState, useEffect } from "react";
import {
    Radio,
    ShieldCheck,
    Network,
    Cpu,
    MemoryStick,
    AlertCircle,
    Check,
    HardDrive,
    Zap,
    AlertTriangle,
    Activity,
    Trophy,
    Globe,
    FileText,
    TrendingUp,
    Database,
    Wifi,
    CheckCircle2,
    ChevronRight,
    Blocks,
    HeartPulse,
    type LucideIcon,
  } from "lucide-react";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { CollapsibleSection } from "./CollapsibleSection";
import { HealthDistributionModal } from "./HealthDistributionModal";
import { CpuDistributionModal } from "./CpuDistributionModal";
import { StorageAnalyticsModal } from "./StorageAnalyticsModal";
import { DataDistributionModal } from "./DataDistributionModal";
import { NetworkCoverageModal } from "./NetworkCoverageModal";
import TopPerformersChart from "@/components/TopPerformersChart";
import { FlagsCarousel } from "./FlagsCarousel";
import { PacketsAnimation } from "./PacketsAnimation";
import { ActiveStreamsAnimation } from "./ActiveStreamsAnimation";
import { MemoryFlowAnimation } from "./MemoryFlowAnimation";
import { RewardsRainAnimation } from "./RewardsRainAnimation";
import { calculateNodeScore } from "@/lib/scoring";

import type { NetworkParticipationMetrics } from "@/lib/blockchain-metrics";

import type { PNode } from '@/lib/types';

type OperatorsMetrics = {
    uniqueManagers: number;
    multiNodeOperators: number;
    topOperator: {
        pubkey: string;
        nodeCount: number;
        nodes: PNode[];
        totalStorage: number;
        avgStorage: number;
    } | null;
    singleNodeOperators: number;
    operators: Array<{
        pubkey: string;
        nodeCount: number;
        nodes: PNode[];
        totalStorage: number;
        avgStorage: number;
    }>;
};

type KpiCardsProps = {
    publicCount: number;
    privateCount: number;
    totalNodes: number;
    networkHealthInsights: any;
    UptimeIcon: LucideIcon;
    networkUptimeStats: any;
    storageCapacityStats: any;
    storageBarColors: any;
    avgCpuUsage: any;
    avgRamUsage: any;
    alerts: any[];
    criticalCount: number;
    warningCount: number;
    activeStreamsTotal: number;
    activeNodesWithStreams: number;
    KPI_COLORS: any;
    STATUS_COLORS: any;
    hexToRgba: (hex: string, alpha: number) => string;
    networkParticipation: NetworkParticipationMetrics | null;
    networkMetadata: {
        networkTotal: number;
        crawledNodes: number;
        staleNodes: number;
        registryOnlyNodes: number;
        gossipOnlyNodes: number;
        bothSourcesNodes: number;
        uncrawledNodes: number;
        activeNodes: number;
        coveragePercent: number;
        lastUpdated: string | null;
    };
    isLight: boolean;
    countriesCount: number;
    countriesWithCodes: { name: string; code: string }[];
    totalPagesCount: number;
    networkGrowthRate: number;
    storageGrowthRate: number;
    networkHistory: Array<{ date: string; nodes: number }>;
    networkBandwidth: {
      packetsPerSecond: number;
      reportingNodes: number;
      totalActiveNodes: number;
    };
    versionAdoptionPercent: number;
    onVersionClick?: () => void;
    onGeographicClick?: () => void;
    onAlertsClick?: (tab: 'alerts' | 'analytics', filters?: { severity?: 'all' | 'critical' | 'warning' }) => void;
    healthDistribution: {
        excellent: number;
        good: number;
        warning: number;
        critical: number;
        total: number;
    };
    cpuDistribution: any[];
    storageDistribution: any[];
    pagesDistribution: any[];
    pnodes: any[];
    mainnetCount: number;
    mainnetOfficialCount: number;
    mainnetRegistryCoverage: number;
    operatorsMetrics: OperatorsMetrics;
};

export const KpiCards = ({
    publicCount,
    privateCount,
    totalNodes,
    networkHealthInsights: _networkHealthInsights,
    UptimeIcon,
    networkUptimeStats,
    storageCapacityStats: _storageCapacityStats,
    storageBarColors,
    avgCpuUsage: _avgCpuUsage,
    avgRamUsage: _avgRamUsage,
    alerts: _alerts,
    criticalCount: _criticalCount,
    warningCount: _warningCount,
    activeStreamsTotal,
    activeNodesWithStreams,
    KPI_COLORS,
    STATUS_COLORS,
    hexToRgba,
    networkParticipation,
    networkMetadata,
    isLight,
    countriesCount,
    countriesWithCodes,
    totalPagesCount,
    networkGrowthRate,
    storageGrowthRate,
    networkHistory,
    networkBandwidth,
    versionAdoptionPercent,
    onVersionClick,
    onGeographicClick,
    onAlertsClick,
    healthDistribution,
    cpuDistribution,
    storageDistribution,
    pagesDistribution,
    pnodes,
    mainnetCount,
    mainnetOfficialCount,
    mainnetRegistryCoverage,
    operatorsMetrics
}: KpiCardsProps) => {
    // Use real props instead of hardcoded test data
    const alerts = _alerts;
    const criticalCount = _criticalCount;
    const warningCount = _warningCount;
    const networkHealthInsights = _networkHealthInsights;
    const storageCapacityStats = _storageCapacityStats ?? {
      totalCommitted: 0,
      totalUsed: 0,
      available: 0,
      percent: 0,
      formattedUsed: "0 B",
      formattedTotal: "0 B",
      formattedAvailable: "0 B",
      availabilityLabel: "available",
    };
    const avgCpuUsage = _avgCpuUsage;
    const avgRamUsage = _avgRamUsage;

    // State for modals
    const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
    const [isCpuModalOpen, setIsCpuModalOpen] = useState(false);
    const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isNetworkCoverageModalOpen, setIsNetworkCoverageModalOpen] = useState(false);
    const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);

    // State for credits data
    const [creditsData, setCreditsData] = useState<{ pod_id: string; credits: number }[]>([]);

    // Fetch credits on mount
    useEffect(() => {
      const fetchCredits = async () => {
        try {
          const response = await fetch('/api/pods-credits');
          if (response.ok) {
            const data = await response.json();
            setCreditsData(data.topEarners || []);
          }
        } catch (error) {
          console.error('Failed to fetch credits:', error);
        }
      };
      
      fetchCredits();
      const interval = setInterval(fetchCredits, 300000); // Refresh every 5 min
      return () => clearInterval(interval);
    }, []);

    // Carousel for champion rotation with transition state
    const [activeChampionIndex, setActiveChampionIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const championCategories = ['performance', 'storage', 'uptime', 'credits', 'operators'] as const;
    
    useEffect(() => {
      const interval = setInterval(() => {
        setIsTransitioning(true);
        
        setTimeout(() => {
          setActiveChampionIndex((prev) => (prev + 1) % championCategories.length);
          setIsTransitioning(false);
        }, 300); // Half of transition duration
      }, 4000); // Rotate every 4 seconds
      
      return () => clearInterval(interval);
    }, []);

    const formatUtilizationPercent = (percent: number) => {
      if (!Number.isFinite(percent) || percent <= 0) return "0%";
      if (percent < 0.01) return `${percent.toFixed(4)}%`;
      if (percent < 1) return `${percent.toFixed(2)}%`;
      if (percent < 10) return `${percent.toFixed(2)}%`;
      if (percent < 100) return `${percent.toFixed(1)}%`;
      return "100%";
    };

    return (
        <div className="space-y-6">
          {/* Section 1: NETWORK STATUS */}
          <CollapsibleSection
            id="network-status-section"
            title="NETWORK STATUS"
            icon={<Network className="w-5 h-5" strokeWidth={2.5} />}
            description="Core metrics and network composition"
            defaultOpen={false}
            accentColor="#3B82F6"
          >
          {/* Network Participation Card */}
          <div className="kpi-card relative overflow-hidden p-6 flex flex-col">
            <div className="flex items-start justify-between gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                    Network Participation
                  </p>
                  <InfoTooltip content="Credit rewards across all networks (MAINNET + DEVNET) and official MAINNET registry coverage." />
                </div>
                <p className="text-sm text-text-faint">Credit rewards & Registry coverage</p>
              </div>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: hexToRgba("#3B82F6", 0.12) }}
              >
                <Trophy 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ color: "#3B82F6" }} 
                />
              </div>
            </div>

            {/* Dual Metrics Display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Left: Credits System */}
              <div className="relative p-4 rounded-lg border" style={{ 
                background: isLight 
                  ? "linear-gradient(135deg, rgba(123, 63, 242, 0.03) 0%, rgba(20, 241, 149, 0.03) 100%)"
                  : "linear-gradient(135deg, rgba(123, 63, 242, 0.08) 0%, rgba(20, 241, 149, 0.08) 100%)",
                borderColor: "var(--border-default)"
              }}>
                <p className="text-xs uppercase tracking-wider text-text-soft mb-2">Credit Rewards</p>
                {networkParticipation ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold tracking-tight" style={{ color: "#7B3FF2" }}>
                        {networkParticipation.podsEarning}
                      </span>
                      <span className="text-sm text-text-soft font-semibold">
                        / {networkParticipation.totalPods}
                      </span>
                    </div>
                    <p className="text-xs text-text-faint mt-1">
                      {networkParticipation.participationRate.toFixed(1)}% earning
                    </p>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-text-faint">—</span>
                )}
              </div>

              {/* Right: MAINNET Registry */}
              <div className="relative p-4 rounded-lg border" style={{ 
                background: isLight 
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(16, 185, 129, 0.03) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)",
                borderColor: "var(--border-default)"
              }}>
                <p className="text-xs uppercase tracking-wider text-text-soft mb-2">Mainnet Registry</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight" style={{ color: "#3B82F6" }}>
                    {mainnetCount}
                  </span>
                  <span className="text-sm text-text-soft font-semibold">nodes</span>
                </div>
                <p className="text-xs text-text-faint mt-1">
                  {mainnetOfficialCount} official ({mainnetRegistryCoverage.toFixed(0)}%)
                </p>
              </div>
            </div>

            {networkParticipation ? (
              <>
                {/* Dual Progress Bars */}
                <div className="space-y-4 mb-5">
                  {/* Credits Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-text-soft mb-1.5">
                      <span>Credit Rewards</span>
                      <span className="font-medium">{networkParticipation.participationRate.toFixed(1)}%</span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden border"
                      style={{ 
                        background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)", 
                        borderColor: "var(--border-default)" 
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${networkParticipation.participationRate}%`,
                          background: "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Registry Coverage Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-text-soft mb-1.5">
                      <span>Registry Coverage</span>
                      <span className="font-medium">{mainnetRegistryCoverage.toFixed(1)}%</span>
                    </div>
                    <div
                      className="w-full h-2 rounded-full overflow-hidden border"
                      style={{ 
                        background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)", 
                        borderColor: "var(--border-default)" 
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${mainnetRegistryCoverage}%`,
                          background: "linear-gradient(90deg, #3B82F6 0%, #10B981 100%)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-text-soft">Official MAINNET</span>
                    <span className="font-semibold"><span style={{ color: "#06B6D4" }}>{mainnetOfficialCount}</span> verified</span>
                  </div>
                  {networkParticipation.podsInactive > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-soft">Inactive pods</span>
                      <span className="font-semibold" style={{ color: "#F59E0B" }}>{networkParticipation.podsInactive}</span>
                    </div>
                  )}
                  {(totalNodes - networkParticipation.totalPods) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-soft">Not yet eligible</span>
                      <span className="font-semibold" style={{ color: "#EF4444" }}>{totalNodes - networkParticipation.totalPods}</span>
                    </div>
                  )}
                </div>

                {/* Rewards Visualization Zone */}
                <div className="mt-auto pt-3 border-t border-border-app-soft">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-[0.25em] text-text-soft/70">
                      Reward Distribution
                    </p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: networkParticipation.participationRate >= 85
                            ? "#F59E0B"
                            : networkParticipation.participationRate >= 70
                            ? "#3B82F6"
                            : "#6B7280",
                          boxShadow: networkParticipation.participationRate >= 70
                            ? `0 0 8px ${networkParticipation.participationRate >= 85 ? "#F59E0B" : "#3B82F6"}`
                            : "none",
                          animation: networkParticipation.participationRate >= 85 
                            ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" 
                            : "none"
                        }}
                      />
                      <span className="text-xs font-mono text-text-soft">
                        {networkParticipation.participationRate >= 85
                          ? "EXCELLENT"
                          : networkParticipation.participationRate >= 70
                          ? "GOOD"
                          : "LOW"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Animation Container */}
                  <div 
                    className="relative rounded-lg overflow-hidden border"
                    style={{ 
                      height: "60px",
                      background: isLight 
                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(245, 158, 11, 0.04) 100%)" 
                        : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)",
                      borderColor: "var(--border-default)",
                      backdropFilter: "blur(10px)"
                    }}
                  >
                    <RewardsRainAnimation 
                      participationRate={networkParticipation.participationRate}
                      isActive={networkParticipation.podsEarning > 0}
                      isLight={isLight} 
                    />
                    
                    {/* Overlay gradient for depth */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: isLight
                          ? "radial-gradient(circle at center, transparent 40%, rgba(255,255,255,0.4) 100%)"
                          : "radial-gradient(circle at center, transparent 40%, rgba(15,23,42,0.4) 100%)"
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-text-faint">Loading participation data...</p>
              </div>
            )}
          </div>

          {/* Network Throughput Card */}
          <div className="kpi-card relative overflow-hidden p-6 flex flex-col">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Network Throughput</p>
                  <InfoTooltip content="Total network activity measured in packets per second. Higher throughput indicates active data synchronization across nodes." />
                </div>
                <p className="text-sm text-text-faint">Aggregate bandwidth</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span 
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: "#3B82F6" }}
                  >
                    {networkBandwidth.packetsPerSecond >= 1000000 
                      ? `${(networkBandwidth.packetsPerSecond / 1000000).toFixed(2)}M`
                      : networkBandwidth.packetsPerSecond >= 1000
                      ? `${(networkBandwidth.packetsPerSecond / 1000).toFixed(1)}K`
                      : networkBandwidth.packetsPerSecond.toFixed(0)}
                  </span>
                  <span className="text-sm font-mono text-text-soft">pkt/s</span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba("#3B82F6", 0.12) }}
              >
                <Wifi 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ color: "#3B82F6" }} 
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-soft">Reporting nodes</span>
                <span className="font-semibold text-text-main">
                  {networkBandwidth.reportingNodes} of {networkBandwidth.totalActiveNodes}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-soft">Avg per node</span>
                <span className="font-semibold text-text-main">
                  {networkBandwidth.reportingNodes > 0 
                    ? `${(networkBandwidth.packetsPerSecond / networkBandwidth.reportingNodes).toFixed(0)} pkt/s`
                    : "0 pkt/s"}
                </span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {networkBandwidth.packetsPerSecond > 1000000 
                  ? "High network activity" 
                  : networkBandwidth.packetsPerSecond > 100000
                  ? "Moderate traffic flow" 
                  : networkBandwidth.packetsPerSecond > 10000
                  ? "Light network usage"
                  : "Minimal activity"}
              </p>
            </div>

            {/* Bandwidth Visualization Zone */}
            <div className="mt-auto pt-4 border-t border-border-app-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.25em] text-text-soft/70">
                  Network Traffic
                </p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: networkBandwidth.packetsPerSecond > 0 ? "#3B82F6" : "#6B7280",
                      boxShadow: networkBandwidth.packetsPerSecond > 0 ? "0 0 8px #3B82F6" : "none"
                    }}
                  />
                  <span className="text-xs font-mono text-text-soft">
                    {networkBandwidth.packetsPerSecond > 0 ? "ACTIVE" : "IDLE"}
                  </span>
                </div>
              </div>
              
              {/* Animation Container */}
              <div 
                className="relative rounded-lg overflow-hidden border"
                style={{ 
                  height: "60px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(99, 179, 237, 0.04) 100%)" 
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 179, 237, 0.08) 100%)",
                  borderColor: "var(--border-default)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <PacketsAnimation 
                  throughput={networkBandwidth.packetsPerSecond / 1000} 
                  maxThroughput={1000}
                />
                
                {/* Overlay gradient for depth */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isLight
                      ? "radial-gradient(circle at center, transparent 40%, rgba(255,255,255,0.4) 100%)"
                      : "radial-gradient(circle at center, transparent 40%, rgba(15,23,42,0.4) 100%)"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Avg RAM Usage */}
          <div className="kpi-card relative overflow-hidden p-6 flex flex-col">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Avg RAM Usage</p>
                  <InfoTooltip content="Average memory consumption across pNodes. Adequate RAM enables efficient data caching for Xandeum's storage layer operations." />
                </div>
                <p className="text-sm text-text-faint">Average memory load</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: "#3B82F6" }}
                  >
                    {avgRamUsage.formattedUsed}
                  </span>
                  <span className="text-sm text-text-soft font-semibold">
                    / {avgRamUsage.formattedTotal}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba("#3B82F6", 0.12) }}
              >
                <MemoryStick className="w-5 h-5" strokeWidth={2.3} style={{ color: "#3B82F6" }} />
              </div>
            </div>
            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{ background: "var(--progress-track)", borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${avgRamUsage.ratio}%`,
                    background: "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>Avg footprint</span>
                <span>{avgRamUsage.ratio.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {avgRamUsage.reportingNodes > 0
                  ? `${avgRamUsage.reportingNodes} of ${avgRamUsage.totalActiveNodes} nodes reporting`
                  : `0 of ${avgRamUsage.totalActiveNodes} nodes reporting`}
              </p>
            </div>

            {/* Memory Visualization Zone */}
            <div className="mt-auto pt-4 border-t border-border-app-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.25em] text-text-soft/70">
                  Memory Status
                </p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ 
                      backgroundColor: avgRamUsage.ratio < 60 
                        ? "#3B82F6" 
                        : avgRamUsage.ratio < 80 
                        ? "#F59E0B" 
                        : "#EF4444",
                      boxShadow: `0 0 8px ${
                        avgRamUsage.ratio < 60 
                          ? "#3B82F6" 
                          : avgRamUsage.ratio < 80 
                          ? "#F59E0B" 
                          : "#EF4444"
                      }`,
                      animation: avgRamUsage.ratio > 80 ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none"
                    }}
                  />
                  <span className="text-xs font-mono text-text-soft">
                    {avgRamUsage.ratio < 60 
                      ? "OPTIMAL" 
                      : avgRamUsage.ratio < 80 
                      ? "LOADED" 
                      : "CRITICAL"}
                  </span>
                </div>
              </div>
              
              {/* Animation Container */}
              <div 
                className="relative rounded-lg overflow-hidden border"
                style={{ 
                  height: "60px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(99, 179, 237, 0.04) 100%)" 
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 179, 237, 0.08) 100%)",
                  borderColor: "var(--border-default)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <MemoryFlowAnimation 
                  ramUsagePercent={avgRamUsage.ratio} 
                  isLight={isLight} 
                />
                
                {/* Overlay gradient for depth */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isLight
                      ? "radial-gradient(circle at center, transparent 40%, rgba(255,255,255,0.4) 100%)"
                      : "radial-gradient(circle at center, transparent 40%, rgba(15,23,42,0.4) 100%)"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Active Streams Card */}
          <div className="kpi-card relative overflow-hidden p-6 flex flex-col">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Active Streams</p>
                  <InfoTooltip content="Number of active data streams across all pNodes. Streams represent real-time data synchronization channels in the Xandeum network." />
                </div>
                <p className="text-sm text-text-faint">Network-wide data flow</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: activeStreamsTotal > 0 ? "#3B82F6" : "#6B7280" }}
                  >
                    {activeStreamsTotal}
                  </p>
                  <span className="text-sm font-mono text-text-soft">
                    {activeStreamsTotal === 1 ? "stream" : "streams"}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba("#3B82F6", 0.12) }}
              >
                <Activity className="w-5 h-5" strokeWidth={2.3} style={{ color: "#3B82F6" }} />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-soft">Active nodes</span>
                <span className="font-semibold text-text-main">{activeNodesWithStreams}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-soft">Avg per node</span>
                <span className="font-semibold text-text-main">
                  {activeNodesWithStreams > 0
                    ? (activeStreamsTotal / activeNodesWithStreams).toFixed(1)
                    : "0"}
                </span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {activeStreamsTotal > 0
                  ? `${activeNodesWithStreams} nodes streaming data`
                  : "No active streams detected"}
              </p>
            </div>

            {/* Stream Visualization Zone - Separated at bottom */}
            <div className="mt-auto pt-4 border-t border-border-app-soft">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-[0.25em] text-text-soft/70">
                  Live Stream Activity
                </p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: activeStreamsTotal > 0 ? "#3B82F6" : "#6B7280",
                      boxShadow: activeStreamsTotal > 0 ? "0 0 8px #3B82F6" : "none"
                    }}
                  />
                  <span className="text-xs font-mono text-text-soft">
                    {activeStreamsTotal > 0 ? "ACTIVE" : "IDLE"}
                  </span>
                </div>
              </div>
              
              {/* Animation Container */}
              <div 
                className="relative rounded-lg overflow-hidden border"
                style={{ 
                  height: "60px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(59, 130, 246, 0.04) 0%, rgba(99, 179, 237, 0.04) 100%)" 
                    : "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 179, 237, 0.08) 100%)",
                  borderColor: "var(--border-default)",
                  backdropFilter: "blur(10px)"
                }}
              >
                <ActiveStreamsAnimation 
                  activeStreams={activeStreamsTotal} 
                  isLight={isLight} 
                />
                
                {/* Overlay gradient for depth */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: isLight
                      ? "radial-gradient(circle at center, transparent 40%, rgba(255,255,255,0.4) 100%)"
                      : "radial-gradient(circle at center, transparent 40%, rgba(15,23,42,0.4) 100%)"
                  }}
                />
              </div>
            </div>
          </div>

          </CollapsibleSection>

          {/* Section 2: SYSTEM HEALTH */}
          <CollapsibleSection
            id="system-health-section"
            title="SYSTEM HEALTH"
            icon={<ShieldCheck className="w-5 h-5" strokeWidth={2.5} />}
            description="Performance, reliability, and network status"
            defaultOpen={false}
            accentColor="#10B981"
          >
          {/* Network Coverage Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            style={{ minHeight: "500px", height: "auto" }}
            onClick={() => setIsNetworkCoverageModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsNetworkCoverageModalOpen(true);
              }
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                    Network Coverage
                  </p>
                  <InfoTooltip content="Shows how many pNodes we've successfully crawled vs the total network size discovered via gossip protocol. Higher coverage means more accurate network insights. Click to view coverage and growth details." />
                </div>
                <p className="text-sm text-text-faint">Crawled nodes vs network total</p>

                <div className="flex items-baseline gap-2 mt-4">
                  <span
                    className="text-4xl font-bold tracking-tight"
                    style={{
                      color: networkMetadata.coveragePercent >= 80
                        ? "#10B981"
                        : networkMetadata.coveragePercent >= 60
                        ? "#3B82F6"
                        : networkMetadata.coveragePercent >= 40
                        ? "#F59E0B"
                        : "#EF4444"
                    }}
                  >
                    {networkMetadata.crawledNodes}
                  </span>
                  <span className="text-lg text-text-soft font-semibold">
                    / {networkMetadata.networkTotal}
                  </span>
                  <span className="text-sm text-text-faint ml-1">nodes</span>
                </div>
              </div>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{
                  background: hexToRgba(
                    networkMetadata.coveragePercent >= 80 ? "#10B981" :
                    networkMetadata.coveragePercent >= 60 ? "#3B82F6" :
                    networkMetadata.coveragePercent >= 40 ? "#F59E0B" : "#EF4444",
                    0.12
                  )
                }}
              >
                <Radio
                  className="w-5 h-5"
                  strokeWidth={2.3}
                  style={{
                    color: networkMetadata.coveragePercent >= 80 ? "#10B981" :
                           networkMetadata.coveragePercent >= 60 ? "#3B82F6" :
                           networkMetadata.coveragePercent >= 40 ? "#F59E0B" : "#EF4444"
                  }}
                />
              </div>
            </div>

            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{
                  background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)",
                  borderColor: "var(--border-default)"
                }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${networkMetadata.coveragePercent}%`,
                    background: "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)",
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>{networkMetadata.coveragePercent.toFixed(1)}% discovered</span>
                <span className="font-medium">
                  {networkMetadata.activeNodes} public nodes
                </span>
              </div>
            </div>

            {/* ✨ NEW: Coverage Breakdown */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-soft flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Crawled
                </span>
                <span className="font-semibold text-text-main">
                  {networkMetadata.crawledNodes} nodes
                </span>
              </div>
              
              {networkMetadata.uncrawledNodes > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-text-soft flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Unreachable
                  </span>
                  <span className="font-semibold text-text-faint">
                    {networkMetadata.uncrawledNodes} nodes
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 mb-6">
              <p
                className="text-sm font-medium"
                style={{
                  color: networkMetadata.coveragePercent >= 80 ? "#10B981" :
                         networkMetadata.coveragePercent >= 60 ? "#3B82F6" :
                         networkMetadata.coveragePercent >= 40 ? "#F59E0B" : "#EF4444"
                }}
              >
                {networkMetadata.coveragePercent >= 80
                  ? "Excellent network coverage"
                  : networkMetadata.coveragePercent >= 60
                  ? "Good network coverage"
                  : networkMetadata.coveragePercent >= 40
                  ? "Moderate coverage - discovery ongoing"
                  : "Limited coverage - early discovery phase"
                }
              </p>
            </div>

            {/* ✨ Crawl Status Zone - Consistent with other SYSTEM HEALTH cards */}
            <div className="mt-auto pt-6 pb-16 border-t border-border-app-soft">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs uppercase tracking-[0.25em] text-text-soft/70">
                  Crawler Status
                </p>
                {networkMetadata.lastUpdated && (() => {
                  const lastCrawl = new Date(networkMetadata.lastUpdated);
                  const now = Date.now();
                  const untilNextMs = (lastCrawl.getTime() + 30 * 60 * 1000) - now;
                  const isActive = untilNextMs > 0 && untilNextMs < 30 * 60 * 1000;
                  
                  return (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          backgroundColor: isActive ? "#10B981" : "#6B7280",
                          boxShadow: isActive ? "0 0 8px #10B981" : "none",
                          animation: isActive ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none"
                        }}
                      />
                      <span className="text-xs font-mono text-text-soft">
                        {isActive ? "ACTIVE" : "IDLE"}
                      </span>
                    </div>
                  );
                })()}
              </div>
              
              {/* Crawl Timing Info Container */}
              <div 
                className="relative rounded-lg overflow-hidden border p-3"
                style={{ 
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%)" 
                    : "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)",
                  borderColor: "var(--border-default)",
                }}
              >
                {networkMetadata.lastUpdated ? (() => {
                  const lastCrawl = new Date(networkMetadata.lastUpdated);
                  const now = Date.now();
                  const diffMs = now - lastCrawl.getTime();
                  const diffMin = Math.floor(diffMs / 60000);
                  const diffHr = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);
                  
                  const lastCrawlText = diffMin < 1 ? 'Just now' :
                                        diffMin < 60 ? `${diffMin}min ago` :
                                        diffHr < 24 ? `${diffHr}h ago` :
                                        `${diffDays}d ago`;
                  
                  // Next crawl in 30 minutes
                  const nextCrawl = new Date(lastCrawl.getTime() + 30 * 60 * 1000);
                  const untilNextMs = nextCrawl.getTime() - now;
                  const untilNextMin = Math.max(0, Math.floor(untilNextMs / 60000));
                  
                  const nextCrawlText = untilNextMin === 0 ? 'now' : `in ${untilNextMin}min`;
                  
                  return (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-text-soft">
                        <Activity className="w-3 h-3" style={{ color: "#10B981" }} />
                        <span>Last: <span className="font-semibold text-text-main">{lastCrawlText}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-text-soft">
                        <Zap className="w-3 h-3" style={{ color: "#3B82F6" }} />
                        <span>Next: <span className="font-semibold text-text-main">{nextCrawlText}</span></span>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="text-xs text-text-faint text-center">Awaiting crawler data...</p>
                )}
              </div>
            </div>

            {/* Click indicator - BOTTOM RIGHT like other SYSTEM HEALTH cards */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Network Health Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={() => setIsHealthModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsHealthModalOpen(true);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                    Network Health
                  </p>
                  <InfoTooltip content="Overall network reliability score. A healthy pNode network ensures Xandeum can scale Solana's state without bottlenecks. Click to view detailed health distribution." />
                </div>
                <p className="text-sm text-text-faint">Overall network score</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: hexToRgba("#10B981", 0.12) }}
              >
                <HeartPulse
                  className="w-5 h-5"
                  strokeWidth={2.3}
                  style={{ color: "#10B981" }}
                />
              </div>
            </div>
            <div className="flex items-end justify-between gap-6 mt-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: "#10B981" }}
                  >
                    {networkHealthInsights.score}
                  </p>
                  <span className="text-lg text-text-soft font-semibold">/100</span>
                </div>
                <div className="mt-4 flex flex-col gap-1">
                   <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-text-soft">
                    <span
                      className="flex items-center gap-2 font-semibold"
                      style={{ color: networkHealthInsights.trendColor }}
                    >
                      <span>{networkHealthInsights.trendIcon}</span>
                      <span className="font-mono">
                        {networkHealthInsights.deltaYesterday !== null
                          ? (networkHealthInsights.deltaYesterday > 0
                            ? `+${networkHealthInsights.deltaYesterday}`
                            : networkHealthInsights.deltaYesterday)
                          : "—"}
                      </span>
                    </span>
                    <span>vs yesterday</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-text-soft">
                    <span
                      className="flex items-center gap-2 font-semibold"
                      style={{ color: networkHealthInsights.trendColorWeek }}
                    >
                      <span>{networkHealthInsights.trendIconWeek}</span>
                      <span className="font-mono">
                        {networkHealthInsights.deltaLastWeek !== null
                          ? (networkHealthInsights.deltaLastWeek > 0
                            ? `+${networkHealthInsights.deltaLastWeek}`
                            : networkHealthInsights.deltaLastWeek)
                          : "—"}
                      </span>
                    </span>
                    <span>vs last week</span>
                  </div>
                </div>
              </div>
              <svg
                width={networkHealthInsights.svgWidth}
                height={networkHealthInsights.svgHeight}
                viewBox={`0 0 ${networkHealthInsights.svgWidth} ${networkHealthInsights.svgHeight}`}
                className="shrink-0"
              >
                <polygon
                  fill="#10B981"
                  points={networkHealthInsights.sparklineAreaPoints}
                  opacity={0.25}
                />
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={networkHealthInsights.sparklinePoints}
                />
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-soft">
              <span className="inline-flex items-center gap-2 px-2 py-2 rounded-full border border-border-app-soft">
                <UptimeIcon
                  className="w-3.5 h-3.5"
                  strokeWidth={2.2}
                  style={{ color: "#10B981" }}
                />
                <span
                  className="font-semibold"
                  style={{ color: "#10B981" }}
                >
                  {networkUptimeStats.badge}
                </span>
              </span>
              <span className="font-mono text-text-main">
                {networkUptimeStats.percent.toFixed(1)}%
              </span>
              <span>
                {networkUptimeStats.publicOnline}/{networkUptimeStats.publicTotal}{" "}
                public online
              </span>
            </div>

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Avg CPU Usage Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={() => setIsCpuModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsCpuModalOpen(true);
              }
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Avg CPU Usage</p>
                  <InfoTooltip content="Average processing load across all active public pNodes. High load may impact node responsiveness. Click to view detailed distribution." />
                </div>
                <p className="text-sm text-text-faint">Across public p-nodes</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-bold text-text-main">
                    {avgCpuUsage.percent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: hexToRgba("#10B981", 0.12) }}
              >
                <Cpu className="w-5 h-5" strokeWidth={2.3} style={{ color: "#10B981" }} />
              </div>
            </div>
            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{ background: "var(--progress-track)", borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, avgCpuUsage.percent)}%`,
                    background: "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>Avg load</span>
                <span>{avgCpuUsage.percent.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {avgCpuUsage.reportingNodes > 0
                  ? `${avgCpuUsage.reportingNodes} of ${avgCpuUsage.totalActiveNodes} nodes reporting`
                  : `0 of ${avgCpuUsage.totalActiveNodes} nodes reporting`}
              </p>
            </div>

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Version Adoption Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={onVersionClick}
            role="button"
            tabIndex={0}
            aria-label="View version details"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onVersionClick?.();
              }
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Version Adoption</p>
                    <InfoTooltip content="Percentage of nodes running the latest software version. Click card to see detailed version breakdown." />
                  </div>
                </div>
                <p className="text-sm text-text-faint">Latest version coverage</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span 
                    className="text-4xl font-bold tracking-tight"
                    style={{ 
                      color: versionAdoptionPercent >= 80 
                        ? "#10B981" 
                        : versionAdoptionPercent >= 60 
                        ? "#3B82F6" 
                        : versionAdoptionPercent >= 40 
                        ? "#F59E0B" 
                        : "#EF4444" 
                    }}
                  >
                    {versionAdoptionPercent}%
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: hexToRgba("#10B981", 0.12) }}
              >
                <CheckCircle2 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ color: "#10B981" }} 
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-soft">Total nodes</span>
                <span className="font-semibold text-text-main">{totalNodes}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-soft">On latest</span>
                <span 
                  className="font-semibold"
                  style={{ 
                    color: versionAdoptionPercent >= 80 ? "#10B981" : 
                           versionAdoptionPercent >= 60 ? "#3B82F6" : 
                           versionAdoptionPercent >= 40 ? "#F59E0B" : "#EF4444" 
                  }}
                >
                  {Math.round(totalNodes * versionAdoptionPercent / 100)}
                </span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {versionAdoptionPercent >= 80 
                  ? "Excellent version compliance" 
                  : versionAdoptionPercent >= 60 
                  ? "Good adoption rate" 
                  : versionAdoptionPercent >= 40
                  ? "Fragmented versions"
                  : "Critical: outdated network"}
              </p>
            </div>

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          </CollapsibleSection>

          {/* Section 3: DATA INSIGHTS */}
          <CollapsibleSection
            id="data-insights-section"
            title="DATA INSIGHTS"
            icon={<Database className="w-5 h-5" strokeWidth={2.5} />}
            description="Storage, distribution, and performance analytics"
            defaultOpen={false}
            accentColor="#7B3FF2"
          >
          {/* Storage Capacity Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={() => setIsStorageModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsStorageModalOpen(true);
              }
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Storage Capacity</p>
                  <InfoTooltip content="Total storage space committed by pNodes to the Xandeum network. 'Utilized' shows actual data stored. Click to view distribution and growth analytics." />
                </div>
                <p className="text-sm text-text-faint">Total available storage</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-bold text-text-main">
                    {storageCapacityStats.formattedUsed ?? "—"}
                  </span>
                  <span className="text-sm text-text-soft font-semibold">
                    / {storageCapacityStats.formattedTotal ?? "—"}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: hexToRgba("#7B3FF2", 0.12) }}
              >
                <HardDrive className="w-5 h-5" strokeWidth={2.3} style={{ color: "#7B3FF2" }} />
              </div>
            </div>
            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{ background: "var(--progress-track)", borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Number.isFinite(storageCapacityStats.percent) ? storageCapacityStats.percent : 0}%`,
                    background: "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>{formatUtilizationPercent(storageCapacityStats.percent ?? 0)} utilized</span>
                <span>
                  {storageCapacityStats.formattedAvailable ?? "—"} {storageCapacityStats.availabilityLabel ?? "available"}
                </span>
              </div>
            </div>

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Total Pages Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={() => setIsDataModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsDataModalOpen(true);
              }
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Total Pages</p>
                  <InfoTooltip content="Total number of data pages stored across all pNodes. Each page represents a unit of data in Xandeum's distributed storage layer. Click to view distribution." />
                </div>
                <p className="text-sm text-text-faint">Network-wide storage units</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span 
                    className="text-4xl font-bold tracking-tight text-text-main"
                  >
                    {totalPagesCount >= 1000000 
                      ? `${(totalPagesCount / 1000000).toFixed(2)}M`
                      : totalPagesCount >= 1000
                      ? `${(totalPagesCount / 1000).toFixed(1)}K`
                      : totalPagesCount.toLocaleString()}
                  </span>
                  <span className="text-sm font-mono text-text-soft">
                    {totalPagesCount === 1 ? "page" : "pages"}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: hexToRgba("#7B3FF2", 0.12) }}
              >
                <FileText 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ color: "#7B3FF2" }} 
                />
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-soft">Active nodes</span>
                <span className="font-semibold text-text-main">{publicCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-soft">Avg pages/node</span>
                <span className="font-semibold text-text-main">
                  {publicCount > 0 
                    ? (totalPagesCount / publicCount >= 1000
                      ? `${(totalPagesCount / publicCount / 1000).toFixed(1)}K`
                      : (totalPagesCount / publicCount).toFixed(0))
                    : "0"}
                </span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {totalPagesCount >= 10000000 
                  ? "Massive network adoption" 
                  : totalPagesCount >= 1000000 
                  ? "High network utilization" 
                  : totalPagesCount >= 100000
                  ? "Growing storage adoption" 
                  : totalPagesCount >= 10000
                  ? "Active deployment phase"
                  : "Early stage deployment"}
              </p>
            </div>

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Geographic Spread Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={onGeographicClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onGeographicClick?.();
              }
            }}
          >
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Geographic Spread</p>
                  <InfoTooltip content="Number of countries/regions hosting pNodes. Greater geographic diversity improves network resilience and reduces latency for global users. Click to view detailed distribution." />
                </div>
                <p className="text-sm text-text-faint">Network decentralization</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span 
                    className="text-4xl font-bold tracking-tight"
                    style={{ 
                      color: countriesCount >= 20 
                        ? "#10B981" 
                        : countriesCount >= 10 
                        ? "#3B82F6" 
                        : countriesCount >= 5 
                        ? "#F59E0B" 
                        : "#EF4444" 
                    }}
                  >
                    {countriesCount}
                  </span>
                  <span className="text-sm font-mono text-text-soft">
                    {countriesCount === 1 ? "country" : "countries"}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0"
                style={{ background: hexToRgba("#7B3FF2", 0.12) }}
              >
                <Globe 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ color: "#7B3FF2" }} 
                />
              </div>
            </div>

            {/* Flags Carousel */}
            <div className="mt-4">
              <FlagsCarousel countries={countriesWithCodes} maxVisible={8} />
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-soft">Total nodes</span>
                <span className="font-semibold text-text-main">{totalNodes}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-text-soft">Avg nodes/region</span>
                <span className="font-semibold text-text-main">
                  {countriesCount > 0 ? (totalNodes / countriesCount).toFixed(1) : "0"}
                </span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {countriesCount >= 20
                  ? "Excellent global diversity" 
                  : countriesCount >= 10 
                  ? "Strong geographic spread" 
                  : countriesCount >= 5 
                  ? "Moderate regional distribution" 
                  : "Limited geographic spread"}
              </p>
            </div>

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          {/* Top Performers Card */}
          <div 
            className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-accent-primary/10 hover:border-accent-primary/50 hover:scale-[1.02] group"
            onClick={() => setShowFullLeaderboard(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowFullLeaderboard(true);
              }
            }}
          >
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Top Performers</p>
                  <InfoTooltip content="Network champions across all categories. The overall champion leads in performance score. Click to view full leaderboard rankings." />
                </div>
                <p className="text-sm text-text-faint">Category champions</p>
              </div>
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: hexToRgba("#7B3FF2", 0.12) }}
              >
                <Trophy className="w-5 h-5" style={{ color: '#7B3FF2' }} strokeWidth={2.3} />
              </div>
            </div>
                
            {pnodes.length > 0 ? (
              (() => {
                // Calculate scores and sort nodes
                const scoredNodes = pnodes
                  .map(node => ({ node, score: calculateNodeScore(node) }))
                  .sort((a, b) => b.score - a.score);
                
                const champion = scoredNodes[0];
                
                // Get category leaders
                const storageLeader = [...pnodes].sort((a, b) => (b.stats?.storage_committed || 0) - (a.stats?.storage_committed || 0))[0];
                const uptimeLeader = [...pnodes].sort((a, b) => (b.stats?.uptime || 0) - (a.stats?.uptime || 0))[0];
                
                // Get credits leader from API data
                let creditsLeader = null;
                let creditsAmount = 0;
                if (creditsData.length > 0) {
                  const topCredit = creditsData[0];
                  // Try to match by pubkey first, then by pod_id substring in IP
                  creditsLeader = pnodes.find(n => n.pubkey === topCredit.pod_id) || null;
                  creditsAmount = topCredit.credits;
                  
                  // If no match, try to find by IP containing pod_id
                  if (!creditsLeader && topCredit.pod_id) {
                    creditsLeader = pnodes.find(n => n.ip?.includes(topCredit.pod_id.slice(0, 8))) || null;
                  }
                }
                
                // Format storage for display
                const formatStorageCompact = (bytes?: number) => {
                  if (!bytes || bytes <= 0) return '0 TB';
                  const tb = bytes / 1e12;
                  if (tb >= 1) return `${tb.toFixed(1)} TB`;
                  const gb = bytes / 1e9;
                  return `${gb.toFixed(0)} GB`;
                };
                
                // Format uptime
                const formatUptimeCompact = (seconds?: number) => {
                  if (!seconds || seconds <= 0) return '0d';
                  const days = Math.floor(seconds / 86400);
                  const hours = Math.floor((seconds % 86400) / 3600);
                  if (days > 0) return `${days}d ${hours}h`;
                  return `${hours}h`;
                };
                
                // Get current champion based on carousel
                const currentCategory = championCategories[activeChampionIndex];
                const getCurrentChampionData = () => {
                  switch (currentCategory) {
                    case 'performance':
                      return {
                        icon: '🏆',
                        label: 'Performance Champion',
                        color: '#FFD700',
                        ip: champion.node.ip,
                        value: champion.score,
                        unit: 'score',
                        status: champion.node.status,
                        showElite: champion.score >= 80,
                      };
                    case 'storage':
                      return {
                        icon: '💾',
                        label: 'Storage Champion',
                        color: '#8B5CF6',
                        ip: storageLeader?.ip,
                        value: formatStorageCompact(storageLeader?.stats?.storage_committed),
                        unit: 'committed',
                        status: storageLeader?.status,
                        showElite: false,
                      };
                    case 'uptime':
                      return {
                        icon: '⚡',
                        label: 'Uptime Champion',
                        color: '#10B981',
                        ip: uptimeLeader?.ip,
                        value: formatUptimeCompact(uptimeLeader?.stats?.uptime),
                        unit: 'online',
                        status: uptimeLeader?.status,
                        showElite: false,
                      };
                    case 'credits':
                      return {
                        icon: '💰',
                        label: 'Credits Champion',
                        color: '#F97316',
                        ip: creditsLeader?.ip || (creditsData.length > 0 ? `${creditsData[0].pod_id.slice(0, 4)}...${creditsData[0].pod_id.slice(-4)}` : 'N/A'),
                        value: creditsAmount > 0 ? creditsAmount.toLocaleString() : (creditsData.length > 0 ? creditsData[0].credits.toLocaleString() : '0'),
                        unit: 'earned',
                        status: creditsLeader?.status || 'active',
                        showElite: false,
                      };
                    case 'operators':
                      return {
                        icon: '👥',
                        label: 'Network Operator',
                        color: '#3B82F6',
                        ip: operatorsMetrics.topOperator 
                          ? `${operatorsMetrics.topOperator.pubkey.slice(0, 8)}...${operatorsMetrics.topOperator.pubkey.slice(-4)}`
                          : 'N/A',
                        value: operatorsMetrics.topOperator?.nodeCount || 0,
                        unit: `node${operatorsMetrics.topOperator?.nodeCount !== 1 ? 's' : ''}`,
                        status: operatorsMetrics.topOperator?.nodes[0]?.status || 'active',
                        showElite: (operatorsMetrics.topOperator?.nodeCount || 0) >= 5,
                      };
                  }
                };
                
                const currentChampion = getCurrentChampionData();
                
                return (
                  <>
                    {/* Dynamic Champion - Hero Section with Carousel */}
                    <div 
                      className="mb-4 p-4 rounded-xl"
                      style={{ 
                        background: isLight 
                          ? `linear-gradient(135deg, ${currentChampion.color}14 0%, ${currentChampion.color}05 100%)`
                          : `linear-gradient(135deg, ${currentChampion.color}20 0%, ${currentChampion.color}08 100%)`,
                        border: '1px solid',
                        borderColor: `${currentChampion.color}33`,
                        minHeight: '120px',
                        opacity: isTransitioning ? 0 : 1,
                        transform: isTransitioning ? 'translateX(20px) scale(0.98)' : 'translateX(0) scale(1)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.6s ease, border-color 0.6s ease'
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2" style={{ minHeight: '28px' }}>
                        <span className="text-lg">{currentChampion.icon}</span>
                        <span className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: currentChampion.color }}>
                          {currentChampion.label}
                        </span>
                        {currentChampion.showElite ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${currentChampion.color}33`, color: currentChampion.color }}>
                            Elite
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold opacity-0 pointer-events-none" style={{ background: `${currentChampion.color}33`, color: currentChampion.color }}>
                            Elite
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: currentChampion.status === 'active' ? '#10B981' : '#6B7280' }}
                          />
                          <span className="font-mono text-lg font-bold text-text-main truncate" title={currentChampion.ip}>
                            {currentChampion.ip || 'N/A'}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold" style={{ color: currentChampion.color }}>
                            {currentChampion.value}
                          </div>
                          <div className="text-xs text-text-soft">{currentChampion.unit}</div>
                        </div>
                      </div>
                      
                      {/* Progress indicator */}
                      <div className="flex items-center justify-center gap-1.5 mt-3">
                        {championCategories.map((_, index) => (
                          <div
                            key={index}
                            className="h-1 rounded-full transition-all duration-300"
                            style={{
                              width: index === activeChampionIndex ? '24px' : '8px',
                              backgroundColor: index === activeChampionIndex ? currentChampion.color : isLight ? 'rgba(15, 23, 42, 0.2)' : 'rgba(255, 255, 255, 0.2)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-text-faint">No nodes available</p>
                <p className="text-xs text-text-soft mt-1">Champions will appear once nodes are connected</p>
              </div>
            )}

            {/* Click indicator */}
            <div className="absolute bottom-4 right-4 opacity-30 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
              <ChevronRight className="w-5 h-5 text-accent-primary" strokeWidth={2.5} />
            </div>
          </div>

          </CollapsibleSection>

          {/* Health Distribution Modal */}
          <HealthDistributionModal
            isOpen={isHealthModalOpen}
            onClose={() => setIsHealthModalOpen(false)}
            healthDistribution={healthDistribution}
            totalNodes={totalNodes}
            isLight={isLight}
          />

          {/* CPU Distribution Modal */}
          <CpuDistributionModal
            isOpen={isCpuModalOpen}
            onClose={() => setIsCpuModalOpen(false)}
            cpuDistribution={cpuDistribution}
            isLight={isLight}
          />

          {/* Storage Analytics Modal */}
          <StorageAnalyticsModal
            isOpen={isStorageModalOpen}
            onClose={() => setIsStorageModalOpen(false)}
            storageDistribution={storageDistribution}
            storageGrowthRate={storageGrowthRate}
            totalPagesCount={totalPagesCount}
            isLight={isLight}
          />

          {/* Data Distribution Modal */}
          <DataDistributionModal
            isOpen={isDataModalOpen}
            onClose={() => setIsDataModalOpen(false)}
            pagesDistribution={pagesDistribution}
            totalPagesCount={totalPagesCount}
            isLight={isLight}
          />

          {/* Network Coverage Modal */}
          <NetworkCoverageModal
            isOpen={isNetworkCoverageModalOpen}
            onClose={() => setIsNetworkCoverageModalOpen(false)}
            networkMetadata={networkMetadata}
            networkGrowthRate={networkGrowthRate}
            totalNodes={totalNodes}
            isLight={isLight}
            networkHistory={networkHistory}
          />

          {/* Full Leaderboard - Direct modal from TopPerformersChart */}
          {showFullLeaderboard && (
            <TopPerformersChart 
              nodes={pnodes} 
              hideHeader={false} 
              openModalDirectly={true}
              onCloseModal={() => setShowFullLeaderboard(false)}
            />
          )}
        </div>
    )
}
