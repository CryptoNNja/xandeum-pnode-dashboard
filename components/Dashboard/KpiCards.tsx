
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
import { InfoTooltip } from "@/components/common/InfoTooltip";

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
                  <InfoTooltip content="Average memory consumption. Sufficient RAM is vital for pNodes to handle high transaction throughput." />
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
        </div>
    )
}
