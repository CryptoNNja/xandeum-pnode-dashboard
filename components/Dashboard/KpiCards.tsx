
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
    type LucideIcon,
  } from "lucide-react";

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
    KPI_COLORS: any;
    STATUS_COLORS: any;
    hexToRgba: (hex: string, alpha: number) => string;
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
    KPI_COLORS,
    STATUS_COLORS,
    hexToRgba
}: KpiCardsProps) => {
    // Use real props instead of hardcoded test data
    const alerts = _alerts;
    const criticalCount = _criticalCount;
    const warningCount = _warningCount;
    const networkHealthInsights = _networkHealthInsights;
    const storageCapacityStats = _storageCapacityStats;
    const avgCpuUsage = _avgCpuUsage;
    const avgRamUsage = _avgRamUsage;

    return (
        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Public Nodes */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Public Nodes</p>
                <p className="text-4xl font-bold text-text-main mt-2">{publicCount}</p>
                <p className="text-sm text-text-soft mt-2">Public storage network</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(KPI_COLORS.public, 0.12) }}
              >
                <Radio className="w-5 h-5" strokeWidth={2.2} style={{ color: KPI_COLORS.public }} />
              </div>
            </div>
          </div>

          {/* Private Nodes */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Private Nodes</p>
                <p className="text-4xl font-bold text-text-main mt-2">{privateCount}</p>
                <p className="text-sm text-text-soft mt-2">Private storage network</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(KPI_COLORS.private, 0.12) }}
              >
                <ShieldCheck className="w-5 h-5" strokeWidth={2.2} style={{ color: KPI_COLORS.private }} />
              </div>
            </div>
          </div>

          {/* Total Nodes */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Total Nodes</p>
                <p className="text-4xl font-bold text-text-main mt-2">{totalNodes}</p>
                <p className="text-sm text-text-soft mt-2">Total network size</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(KPI_COLORS.total, 0.12) }}
              >
                <Network className="w-5 h-5" strokeWidth={2.2} style={{ color: KPI_COLORS.total }} />
              </div>
            </div>
          </div>

          {/* Network Health */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Network Health</p>
                <p className="text-sm text-text-faint">Overall network score</p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: hexToRgba(networkHealthInsights.color, 0.12) }}
              >
                <ShieldCheck className="w-5 h-5" strokeWidth={2.3} style={{ color: networkHealthInsights.color }} />
              </div>
            </div>
            <div className="flex items-end justify-between gap-6 mt-6">
              <div>
                <div className="flex items-baseline gap-2">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ color: networkHealthInsights.color }}
                  >
                    {networkHealthInsights.score}
                  </p>
                  <span className="text-lg text-text-soft font-semibold">/100</span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs uppercase tracking-widest text-text-soft">
                  <span
                    className="flex items-center gap-2 font-semibold"
                    style={{ color: networkHealthInsights.trendColor }}
                  >
                    <span>{networkHealthInsights.trendIcon}</span>
                    <span className="font-mono">
                      {networkHealthInsights.delta > 0
                        ? `+${networkHealthInsights.delta}`
                        : networkHealthInsights.delta}
                    </span>
                  </span>
                  <span>vs yesterday</span>
                  <span>vs last refresh</span>
                </div>
              </div>
              <svg
                width={networkHealthInsights.svgWidth}
                height={networkHealthInsights.svgHeight}
                viewBox={`0 0 ${networkHealthInsights.svgWidth} ${networkHealthInsights.svgHeight}`}
                className="shrink-0"
              >
                <polygon
                  fill={networkHealthInsights.sparklineFill}
                  points={networkHealthInsights.sparklineAreaPoints}
                  opacity={0.25}
                />
                <polyline
                  fill="none"
                  stroke={networkHealthInsights.color}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={networkHealthInsights.sparklinePoints}
                />
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-text-soft">
              <span className="inline-flex items-center gap-2 px-2 py-2 rounded-full border border-border-app-soft">
                <UptimeIcon className="w-3.5 h-3.5" strokeWidth={2.2} style={{ color: networkUptimeStats.color }} />
                <span className="font-semibold" style={{ color: networkUptimeStats.color }}>
                  {networkUptimeStats.badge}
                </span>
              </span>
              <span className="font-mono text-text-main">
                {networkUptimeStats.percent.toFixed(1)}%
              </span>
              <span>
                {networkUptimeStats.publicOnline}/{networkUptimeStats.publicTotal} public online
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Storage Capacity */}
          <div className="kpi-card relative overflow-hidden p-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Storage Capacity</p>
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
                <span>{storageCapacityStats.percent.toFixed(0)}% utilized</span>
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
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Avg CPU Usage</p>
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
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">Avg RAM Usage</p>
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
                <p className="text-xs uppercase tracking-[0.35em] text-text-soft">System Alerts</p>
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
        </div>
      </div>
    )
}
