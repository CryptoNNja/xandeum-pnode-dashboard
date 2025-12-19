
"use client"

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
    type LucideIcon,
  } from "lucide-react";
import { InfoTooltip } from "@/components/common/InfoTooltip";

import type { NetworkParticipationMetrics } from "@/lib/blockchain-metrics";

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
    isLight: boolean;
    countriesCount: number;
    totalPagesCount: number;
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
    isLight,
    countriesCount,
    totalPagesCount
}: KpiCardsProps) => {
    // Use real props instead of hardcoded test data
    const alerts = _alerts;
    const criticalCount = _criticalCount;
    const warningCount = _warningCount;
    const networkHealthInsights = _networkHealthInsights;
    const storageCapacityStats = _storageCapacityStats;
    const avgCpuUsage = _avgCpuUsage;
    const avgRamUsage = _avgRamUsage;

    const formatUtilizationPercent = (percent: number) => {
      if (!Number.isFinite(percent) || percent <= 0) return "0%";
      if (percent < 0.01) return `${percent.toFixed(4)}%`;
      if (percent < 1) return `${percent.toFixed(2)}%`;
      if (percent < 10) return `${percent.toFixed(2)}%`;
      if (percent < 100) return `${percent.toFixed(1)}%`;
      return "100%";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Storage Capacity */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Storage Capacity</p>
                  <InfoTooltip content="Total storage space committed by pNodes to the Xandeum network. 'Utilized' shows actual data stored." />
                </div>
                <p className="text-sm text-text-faint">Total available storage</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-bold text-text-main">
                    {storageCapacityStats.formattedUsed}
                  </span>
                  <span className="text-sm text-text-soft font-semibold">
                    / {storageCapacityStats.formattedTotal}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(storageBarColors.accent, 0.12) }}
              >
                <HardDrive className="w-5 h-5" strokeWidth={2.3} style={{ color: storageBarColors.accent }} />
              </div>
            </div>
            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{ background: "var(--progress-track)", borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${storageCapacityStats.percent}%`,
                    background: storageBarColors.fill,
                    transition: "width 500ms ease",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>{formatUtilizationPercent(storageCapacityStats.percent)} utilized</span>
                <span>
                  {storageCapacityStats.formattedAvailable} {storageCapacityStats.availabilityLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Avg CPU Usage */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Avg CPU Usage</p>
                  <InfoTooltip content="Average processing load across all active public pNodes. High load may impact node responsiveness." />
                </div>
                <p className="text-sm text-text-faint">Across public p-nodes</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-4xl font-bold text-text-main">
                    {avgCpuUsage.percent.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(KPI_COLORS.cpu, 0.12) }}
              >
                <Cpu className="w-5 h-5" strokeWidth={2.3} style={{ color: KPI_COLORS.cpu }} />
              </div>
            </div>
            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{ background: "var(--progress-track)", borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, avgCpuUsage.percent)}%`,
                    background: KPI_COLORS.cpu,
                    transition: "width 500ms ease",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>Avg load</span>
                <span>{avgCpuUsage.percent.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {avgCpuUsage.nodeCount > 0
                  ? `Across ${avgCpuUsage.nodeCount} active nodes`
                  : "Awaiting active telemetry"}
              </p>
            </div>
          </div>

          {/* Avg RAM Usage */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Avg RAM Usage</p>
                  <InfoTooltip content="Average memory consumption across pNodes. Adequate RAM enables efficient data caching for Xandeum's storage layer operations." />
                </div>
                <p className="text-sm text-text-faint">Average memory load</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-3xl font-bold text-text-main">
                    {avgRamUsage.formattedUsed}
                  </span>
                  <span className="text-sm text-text-soft font-semibold">
                    / {avgRamUsage.formattedTotal}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(KPI_COLORS.ram, 0.12) }}
              >
                <MemoryStick className="w-5 h-5" strokeWidth={2.3} style={{ color: KPI_COLORS.ram }} />
              </div>
            </div>
            <div className="mt-6">
              <div
                className="w-full h-2 rounded-full overflow-hidden border"
                style={{ background: "var(--progress-track)", borderColor: "var(--border-default)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${avgRamUsage.ratio}%`,
                    background: KPI_COLORS.ram,
                    transition: "width 500ms ease",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                <span>Avg footprint</span>
                <span>{avgRamUsage.ratio.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-text-faint mt-4">
                {avgRamUsage.nodeCount > 0
                  ? `${avgRamUsage.nodeCount} nodes reporting`
                  : "Awaiting active telemetry"}
              </p>
            </div>
          </div>

          {/* Alerts Card */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">System Alerts</p>
                  <InfoTooltip content="Real-time notifications about node offline status, version lag, or resource exhaustion." />
                </div>
                <p className="text-sm text-text-faint">Critical & warnings</p>
                <div className="flex items-baseline gap-2 mt-4">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: alerts.length === 0 ? KPI_COLORS.alertOk : KPI_COLORS.alerts }}
                  >
                    {alerts.length}
                  </p>
                  <span className="text-sm font-mono text-text-soft">
                    {alerts.length === 1 ? "alert" : "alerts"}
                  </span>
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(KPI_COLORS.alerts, 0.12) }}
              >
                <AlertCircle className="w-5 h-5" strokeWidth={2.3} style={{ color: KPI_COLORS.alerts }} />
              </div>
            </div>

            {alerts.length === 0 ? (
              <p className="text-sm mt-6 flex items-center gap-2" style={{ color: KPI_COLORS.alertOk }}>
                <Check className="w-4 h-4" strokeWidth={2.2} />
                All systems normal
              </p>
            ) : (
              <div className="mt-6 space-y-2 text-sm text-text-main">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ color: STATUS_COLORS.critical }}>
                    <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span className="text-xs uppercase tracking-wide text-text-soft">Critical</span>
                  </div>
                  <span className="font-semibold" style={{ color: STATUS_COLORS.critical }}>
                    {criticalCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ color: STATUS_COLORS.warning }}>
                    <AlertCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
                    <span className="text-xs uppercase tracking-wide text-text-soft">Warning</span>
                  </div>
                  <span className="font-semibold" style={{ color: STATUS_COLORS.warning }}>
                    {warningCount}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Active Streams Card */}
          <div className="kpi-card relative overflow-hidden p-6">
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
                    style={{ color: activeStreamsTotal > 0 ? "#10B981" : "#6B7280" }}
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
                style={{ background: hexToRgba("#10B981", 0.12) }}
              >
                <Activity className="w-5 h-5" strokeWidth={2.3} style={{ color: "#10B981" }} />
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
          </div>

          {/* Network Participation Card */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                    Network Participation
                  </p>
                  <InfoTooltip content="Shows how many pNodes are earning rewards in Xandeum's credit system this cycle. This may differ from discovered nodes as not all nodes participate in rewards." />
                </div>
                <p className="text-sm text-text-faint">Credit system participants</p>

                {networkParticipation ? (
                  <>
                    <div className="flex items-baseline gap-2 mt-4">
                      <span 
                        className="text-4xl font-bold tracking-tight"
                        style={{ 
                          color: networkParticipation.participationRate >= 85 
                            ? "#10B981" 
                            : networkParticipation.participationRate >= 70 
                            ? "#F59E0B" 
                            : "#EF4444" 
                        }}
                      >
                        {networkParticipation.podsEarning}
                      </span>
                      <span className="text-lg text-text-soft font-semibold">
                        / {networkParticipation.totalPods}
                      </span>
                      <span className="text-sm text-text-faint ml-1">nodes</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-bold tracking-tight text-text-faint">—</span>
                  </div>
                )}
              </div>

              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ 
                  background: hexToRgba(
                    networkParticipation && networkParticipation.participationRate >= 85 ? "#10B981" : 
                    networkParticipation && networkParticipation.participationRate >= 70 ? "#F59E0B" : "#EF4444", 
                    0.12
                  ) 
                }}
              >
                <Trophy 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ 
                    color: networkParticipation && networkParticipation.participationRate >= 85 ? "#10B981" : 
                           networkParticipation && networkParticipation.participationRate >= 70 ? "#F59E0B" : "#EF4444" 
                  }} 
                />
              </div>
            </div>

            {networkParticipation ? (
              <>
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
                        width: `${networkParticipation.participationRate}%`,
                        background: networkParticipation.participationRate >= 85
                          ? "linear-gradient(90deg, #7B3FF2 0%, #14F195 100%)"
                          : networkParticipation.participationRate >= 70
                          ? "linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)"
                          : "linear-gradient(90deg, #EF4444 0%, #F87171 100%)",
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-soft mt-2">
                    <span>{networkParticipation.participationRate.toFixed(1)}% earning</span>
                    <span className="font-medium">
                      {networkParticipation.totalPods > 0 ? `${networkParticipation.totalPods} in rewards system` : "No data"}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  {networkParticipation.podsInactive === 0 ? (
                    <p 
                      className="text-sm font-medium flex items-center gap-2"
                      style={{ color: "#10B981" }}
                    >
                      <span className="text-base">✓</span>
                      All nodes earning rewards
                    </p>
                  ) : (
                    <p 
                      className="text-sm font-medium"
                      style={{ 
                        color: networkParticipation.participationRate >= 70 ? "#F59E0B" : "#EF4444" 
                      }}
                    >
                      {networkParticipation.podsInactive === 1 
                        ? "1 node inactive this cycle"
                        : `${networkParticipation.podsInactive} nodes inactive this cycle`
                      }
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-6">
                <p className="text-sm text-text-faint">Loading participation data...</p>
              </div>
            )}
          </div>

          {/* Geographic Distribution Card */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Geographic Spread</p>
                  <InfoTooltip content="Number of countries/regions hosting pNodes. Greater geographic diversity improves network resilience and reduces latency for global users." />
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
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ 
                  background: hexToRgba(
                    countriesCount >= 20 ? "#10B981" : 
                    countriesCount >= 10 ? "#3B82F6" : 
                    countriesCount >= 5 ? "#F59E0B" : "#EF4444", 
                    0.12
                  ) 
                }}
              >
                <Globe 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ 
                    color: countriesCount >= 20 ? "#10B981" : 
                           countriesCount >= 10 ? "#3B82F6" : 
                           countriesCount >= 5 ? "#F59E0B" : "#EF4444" 
                  }} 
                />
              </div>
            </div>

            <div className="mt-6">
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
          </div>

          {/* Total Pages Card */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Total Pages</p>
                  <InfoTooltip content="Total number of data pages stored across all pNodes. Each page represents a unit of data in Xandeum's distributed storage layer." />
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
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba("#3B82F6", 0.12) }}
              >
                <FileText 
                  className="w-5 h-5" 
                  strokeWidth={2.3} 
                  style={{ color: "#3B82F6" }} 
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
          </div>
        </div>
    )
}
