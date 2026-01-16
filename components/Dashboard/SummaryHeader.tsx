"use client";

import { useState } from "react";
import { Radio, ShieldCheck, Network, LucideIcon, AlertCircle, Check, AlertTriangle, Users } from "lucide-react";
import { hexToRgba, getKpiColors, getStatusColors } from "@/lib/utils";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { SystemAlertsAnalyticsModal } from "./SystemAlertsAnalyticsModal";
import { NetworkBadge } from "@/components/common/NetworkBadge";
import { FlipCard } from "@/components/common/FlipCard";

type OperatorsMetrics = {
  uniqueManagers: number;
  multiNodeOperators: number;
  topOperator: {
    pubkey: string;
    nodeCount: number;
    nodes: any[];
    totalStorage: number;
    avgStorage: number;
  } | null;
  singleNodeOperators: number;
  operators: Array<{
    pubkey: string;
    nodeCount: number;
    nodes: any[];
    totalStorage: number;
    avgStorage: number;
  }>;
};

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
  isLight: boolean;
  mainnetPublic?: number;
  mainnetPrivate?: number;
  mainnetCount?: number;
  devnetPublic?: number;
  devnetPrivate?: number;
  devnetCount?: number;
  operatorsMetrics: OperatorsMetrics;
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
  isLight,
  mainnetPublic = 0,
  mainnetPrivate = 0,
  mainnetCount = 0,
  devnetPublic = 0,
  devnetPrivate = 0,
  devnetCount = 0,
  operatorsMetrics,
}: SummaryHeaderProps) => {
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const UptimeIcon = networkUptimeStats.Icon;
  const kpiColors = getKpiColors();
  const statusColors = getStatusColors();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Public Nodes - FlipCard */}
      <FlipCard
        icon={Radio}
        iconColor={kpiColors.public}
        title="Public Nodes"
        mainValue={publicCount}
        subtitle="Public storage network"
        isLight={isLight}
        hexToRgba={hexToRgba}
        backContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-medium">MAINNET</span>
              </span>
              <span className="font-bold text-text-main text-xl">{mainnetPublic}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="font-medium">DEVNET</span>
              </span>
              <span className="font-bold text-text-main text-xl">{devnetPublic}</span>
            </div>
            {mainnetCount > 0 && (
              <div className="pt-2 text-xs text-text-faint">
                {((mainnetPublic / mainnetCount) * 100).toFixed(0)}% of MAINNET nodes are public
              </div>
            )}
          </div>
        }
      />

      {/* Private Nodes - FlipCard */}
      <FlipCard
        icon={ShieldCheck}
        iconColor={kpiColors.private}
        title="Private Nodes"
        mainValue={privateCount}
        subtitle="Private storage network"
        isLight={isLight}
        hexToRgba={hexToRgba}
        backContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-medium">MAINNET</span>
              </span>
              <span className="font-bold text-text-main text-xl">{mainnetPrivate}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="font-medium">DEVNET</span>
              </span>
              <span className="font-bold text-text-main text-xl">{devnetPrivate}</span>
            </div>
            {mainnetCount > 0 && (
              <div className="pt-2 text-xs text-text-faint">
                {((mainnetPrivate / mainnetCount) * 100).toFixed(0)}% of MAINNET nodes are private
              </div>
            )}
          </div>
        }
      />

      {/* Total Nodes - FlipCard */}
      <FlipCard
        icon={Network}
        iconColor={kpiColors.total}
        title="Total Nodes"
        mainValue={totalNodes}
        subtitle="Total network size"
        isLight={isLight}
        hexToRgba={hexToRgba}
        backContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="font-medium">MAINNET</span>
              </span>
              <span className="font-bold text-text-main text-xl">{mainnetCount}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="font-medium">DEVNET</span>
              </span>
              <span className="font-bold text-text-main text-xl">{devnetCount}</span>
            </div>
            <div className="pt-2 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-faint">Public:</span>
                <span className="font-semibold text-text-main">{publicCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">Private:</span>
                <span className="font-semibold text-text-main">{privateCount}</span>
              </div>
            </div>
          </div>
        }
      />

      {/* Network Operators - FlipCard */}
      <FlipCard
        icon={Users}
        iconColor="#3B82F6"
        title="Network Operators"
        mainValue={operatorsMetrics.uniqueManagers}
        subtitle="Infrastructure managers"
        isLight={isLight}
        hexToRgba={hexToRgba}
        backContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft font-medium">Multi-node</span>
              <span className="font-bold text-text-main text-xl">{operatorsMetrics.multiNodeOperators}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-border-app-soft">
              <span className="text-text-soft font-medium">Single-node</span>
              <span className="font-bold text-text-main text-xl">{operatorsMetrics.singleNodeOperators}</span>
            </div>
            <div className="pt-2 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-faint">Top operator:</span>
                <span className="font-semibold" style={{ color: "#10B981" }}>
                  {operatorsMetrics.topOperator?.nodeCount || 0} nodes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-faint">Avg per manager:</span>
                <span className="font-semibold text-text-main">
                  {(totalNodes / operatorsMetrics.uniqueManagers).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        }
      />

      {/* System Alerts - Moved from Performance & Resources */}
      <div 
        className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/50 hover:scale-[1.02] group"
        onClick={() => setIsAnalyticsModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsAnalyticsModalOpen(true);
          }
        }}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs uppercase tracking-[0.35em] text-text-soft">System Alerts</p>
              <InfoTooltip content="Real-time notifications about node offline status, version lag, or resource exhaustion. Click for detailed analytics." />
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
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
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
        
        {/* Click indicator */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-accent-aqua font-semibold">Click for details →</span>
        </div>
      </div>
      
      {/* Analytics Modal */}
      <SystemAlertsAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        alerts={alerts}
        totalNodes={totalNodes}
        isLight={isLight}
      />
    </div>
  );
};
