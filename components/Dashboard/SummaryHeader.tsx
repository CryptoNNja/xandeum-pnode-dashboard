"use client";

import { Radio, ShieldCheck, Network, LucideIcon, AlertCircle, Check, AlertTriangle } from "lucide-react";
import { hexToRgba, getKpiColors, getStatusColors } from "@/lib/utils";
import { InfoTooltip } from "@/components/common/InfoTooltip";

type SummaryHeaderProps = {
  publicCount: number;
  privateCount: number;
  totalNodes: number;
  networkHealthInsights: {
    score: number;
    deltaYesterday: number | null;
    deltaLastWeek: number | null;
    color: string;
    trendIcon: string;
    trendColor: string;
    svgWidth: number;
    svgHeight: number;
    sparklinePoints: string;
    sparklineAreaPoints: string;
    sparklineFill: string;
  };
  networkUptimeStats: {
    badge: string;
    color: string;
    Icon: LucideIcon;
    percent: number;
    publicOnline: number;
    publicTotal: number;
  };
  alerts: any[];
  criticalCount: number;
  warningCount: number;
};

export const SummaryHeader = ({
  publicCount,
  privateCount,
  totalNodes,
  networkHealthInsights,
  networkUptimeStats,
  alerts,
  criticalCount,
  warningCount,
}: SummaryHeaderProps) => {
  const UptimeIcon = networkUptimeStats.Icon;
  const kpiColors = getKpiColors();
  const statusColors = getStatusColors();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Public Nodes */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                Public Nodes
              </p>
              <InfoTooltip content="Active pNodes reachable via pRPC, providing public storage and gossip services." />
            </div>
            <p className="text-4xl font-bold text-text-main mt-2">
              {publicCount}
            </p>
            <p className="text-sm text-text-soft mt-2">Public storage network</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(kpiColors.public, 0.12) }}
          >
            <Radio
              className="w-5 h-5"
              strokeWidth={2.2}
              style={{ color: kpiColors.public }}
            />
          </div>
        </div>
      </div>

      {/* Private Nodes */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                Private Nodes
              </p>
              <InfoTooltip content="Gossip-only nodes that participate in the network state but do not expose public services." />
            </div>
            <p className="text-4xl font-bold text-text-main mt-2">
              {privateCount}
            </p>
            <p className="text-sm text-text-soft mt-2">Private storage network</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(kpiColors.private, 0.12) }}
          >
            <ShieldCheck
              className="w-5 h-5"
              strokeWidth={2.2}
              style={{ color: kpiColors.private }}
            />
          </div>
        </div>
      </div>

      {/* Total Nodes */}
      <div className="kpi-card relative overflow-hidden p-6">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-text-soft">
                Total Nodes
              </p>
              <InfoTooltip content="Grand total of all nodes detected in the Xandeum network (Public + Private)." />
            </div>
            <p className="text-4xl font-bold text-text-main mt-2">
              {totalNodes}
            </p>
            <p className="text-sm text-text-soft mt-2">Total network size</p>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: hexToRgba(kpiColors.total, 0.12) }}
          >
            <Network
              className="w-5 h-5"
              strokeWidth={2.2}
              style={{ color: kpiColors.total }}
            />
          </div>
        </div>
      </div>

      {/* System Alerts - Moved from Performance & Resources */}
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
                style={{ color: alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts }}
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
            style={{ background: hexToRgba(kpiColors.alerts, 0.12) }}
          >
            <AlertCircle className="w-5 h-5" strokeWidth={2.3} style={{ color: kpiColors.alerts }} />
          </div>
        </div>

        {alerts.length === 0 ? (
          <p className="text-sm mt-6 flex items-center gap-2" style={{ color: kpiColors.alertOk }}>
            <Check className="w-4 h-4" strokeWidth={2.2} />
            All systems normal
          </p>
        ) : (
          <div className="mt-6 space-y-2 text-sm text-text-main">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: statusColors.critical }}>
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span className="text-xs uppercase tracking-wide text-text-soft">Critical</span>
              </div>
              <span className="font-semibold" style={{ color: statusColors.critical }}>
                {criticalCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2" style={{ color: statusColors.warning }}>
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2.2} />
                <span className="text-xs uppercase tracking-wide text-text-soft">Warning</span>
              </div>
              <span className="font-semibold" style={{ color: statusColors.warning }}>
                {warningCount}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
