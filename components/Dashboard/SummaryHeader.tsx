"use client";

import { useState } from "react";
import { Radio, ShieldCheck, Network, LucideIcon, AlertCircle, Check, AlertTriangle, Users } from "lucide-react";
import { hexToRgba, getKpiColors, getStatusColors } from "@/lib/utils";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { SystemAlertsAnalyticsModal } from "./SystemAlertsAnalyticsModal";
import { NetworkBadge } from "@/components/common/NetworkBadge";
import { FlipCard } from "@/components/common/FlipCard";

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
        showSparkline={true}
        sparklineData={[]} // TODO: Pass real historical data once collected
        backContent={
          <div className="space-y-2.5">
            {/* MAINNET Section */}
            <div className="relative p-2.5 rounded-lg" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)",
              border: '1px solid',
              borderColor: hexToRgba("#10B981", 0.2)
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Mainnet</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#10B981" }}>{mainnetPublic}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-border-default overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: publicCount > 0 ? `${(mainnetPublic / publicCount) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: "#10B981" }}>
                  {publicCount > 0 ? ((mainnetPublic / publicCount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            {/* DEVNET Section */}
            <div className="relative p-2.5 rounded-lg" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(245, 158, 11, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)",
              border: '1px solid',
              borderColor: hexToRgba("#F59E0B", 0.2)
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Devnet</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{devnetPublic}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-border-default overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                    style={{ width: publicCount > 0 ? `${(devnetPublic / publicCount) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                  {publicCount > 0 ? ((devnetPublic / publicCount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
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
        showSparkline={true}
        sparklineData={[]} // TODO: Pass real historical data once collected
        backContent={
          <div className="space-y-2.5">
            {/* MAINNET Section */}
            <div className="relative p-2.5 rounded-lg" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)",
              border: '1px solid',
              borderColor: hexToRgba("#10B981", 0.2)
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Mainnet</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#10B981" }}>{mainnetPrivate}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-border-default overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: privateCount > 0 ? `${(mainnetPrivate / privateCount) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: "#10B981" }}>
                  {privateCount > 0 ? ((mainnetPrivate / privateCount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>

            {/* DEVNET Section */}
            <div className="relative p-2.5 rounded-lg" style={{ 
              background: isLight 
                ? "linear-gradient(135deg, rgba(234, 179, 8, 0.05) 0%, rgba(245, 158, 11, 0.08) 100%)"
                : "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)",
              border: '1px solid',
              borderColor: hexToRgba("#F59E0B", 0.2)
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Devnet</span>
                </div>
                <span className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{devnetPrivate}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-border-default overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-yellow-500 to-amber-400"
                    style={{ width: privateCount > 0 ? `${(devnetPrivate / privateCount) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>
                  {privateCount > 0 ? ((devnetPrivate / privateCount) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
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
        showSparkline={true}
        sparklineData={[]} // TODO: Pass real historical data once collected
        backContent={
          <div className="space-y-2">
            {/* Network Distribution */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ 
                background: isLight 
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(16, 185, 129, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.16) 100%)",
                border: '1px solid',
                borderColor: hexToRgba("#10B981", 0.25)
              }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-soft mb-1">Mainnet</div>
                <div className="text-xl font-bold" style={{ color: "#10B981" }}>{mainnetCount}</div>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ 
                background: isLight 
                  ? "linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(245, 158, 11, 0.16) 100%)",
                border: '1px solid',
                borderColor: hexToRgba("#F59E0B", 0.25)
              }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-soft mb-1">Devnet</div>
                <div className="text-xl font-bold" style={{ color: "#F59E0B" }}>{devnetCount}</div>
              </div>
            </div>

            {/* Type Distribution */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ 
                background: isLight ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.08)" 
              }}>
                <span className="text-xs text-text-soft flex items-center gap-1.5">
                  <Radio className="w-3 h-3" style={{ color: kpiColors.public }} />
                  <span>Public</span>
                </span>
                <span className="text-sm font-bold text-text-main">{publicCount}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ 
                background: isLight ? "rgba(139, 92, 246, 0.05)" : "rgba(139, 92, 246, 0.08)" 
              }}>
                <span className="text-xs text-text-soft flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" style={{ color: kpiColors.private }} />
                  <span>Private</span>
                </span>
                <span className="text-sm font-bold text-text-main">{privateCount}</span>
              </div>
            </div>
          </div>
        }
      />

      {/* Network Operators - FlipCard */}
      <FlipCard
        icon={Users}
        iconColor="#3B82F6"
        title="Network Ops"
        mainValue={operatorsMetrics.uniqueManagers}
        subtitle="Infrastructure managers"
        isLight={isLight}
        hexToRgba={hexToRgba}
        frontExtraContent={
          <div>
            {/* Decentralization Bar - Compact to match sparkline height */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-faint text-xs">Decentralization</span>
                <span className="font-medium text-text-soft text-xs">
                  {operatorsMetrics.uniqueManagers > 0 
                    ? `${((operatorsMetrics.singleNodeOperators / operatorsMetrics.uniqueManagers) * 100).toFixed(0)}%`
                    : '0%'}
                </span>
              </div>
              <div className="relative h-1.5 rounded-full overflow-hidden" style={{ 
                background: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.08)" 
              }}>
                <div 
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{ 
                    width: operatorsMetrics.uniqueManagers > 0
                      ? `${((operatorsMetrics.singleNodeOperators / operatorsMetrics.uniqueManagers) * 100)}%`
                      : '0%',
                    background: "linear-gradient(90deg, #3B82F6 0%, #10B981 100%)"
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-text-faint">
                <span className="text-xs">🟢 {operatorsMetrics.singleNodeOperators} single</span>
                <span className="text-xs">🔵 {operatorsMetrics.multiNodeOperators} multi</span>
              </div>
            </div>
          </div>
        }
        backContent={
          <div className="space-y-2">
            {/* Operator Types */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg text-center" style={{ 
                background: isLight 
                  ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.16) 100%)",
                border: '1px solid',
                borderColor: hexToRgba("#10B981", 0.25)
              }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-soft mb-1">Multi</div>
                <div className="text-xl font-bold" style={{ color: "#10B981" }}>{operatorsMetrics.multiNodeOperators}</div>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ 
                background: isLight 
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.12) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.16) 100%)",
                border: '1px solid',
                borderColor: hexToRgba("#3B82F6", 0.25)
              }}>
                <div className="text-xs font-semibold uppercase tracking-wider text-text-soft mb-1">Single</div>
                <div className="text-xl font-bold" style={{ color: "#3B82F6" }}>{operatorsMetrics.singleNodeOperators}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ 
                background: isLight ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.08)" 
              }}>
                <span className="text-xs text-text-soft">🏆 Top operator</span>
                <span className="text-sm font-bold" style={{ color: "#10B981" }}>
                  {operatorsMetrics.topOperator?.nodeCount || 0} nodes
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ 
                background: isLight ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.08)" 
              }}>
                <span className="text-xs text-text-soft">📊 Avg/manager</span>
                <span className="text-sm font-bold text-text-main">
                  {operatorsMetrics.uniqueManagers > 0 ? (totalNodes / operatorsMetrics.uniqueManagers).toFixed(1) : '0'} nodes
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 rounded" style={{ 
                background: isLight ? "rgba(168, 85, 247, 0.05)" : "rgba(168, 85, 247, 0.08)" 
              }}>
                <span className="text-xs text-text-soft">🎯 Multi-node rate</span>
                <span className="text-sm font-bold" style={{ color: "#A855F7" }}>
                  {operatorsMetrics.uniqueManagers > 0 ? ((operatorsMetrics.multiNodeOperators / operatorsMetrics.uniqueManagers) * 100).toFixed(0) : '0'}%
                </span>
              </div>
            </div>
          </div>
        }
      />

      {/* System Alerts - Premium Design */}
      <div 
        className="kpi-card relative overflow-hidden p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/50 hover:scale-[1.02] group"
        style={{ height: '275px' }}
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
        <div className="h-full flex flex-col">
          {/* Header - Title + Icon */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.25em] font-semibold truncate" style={{ color: kpiColors.alerts }}>
                System Alerts
              </p>
              <p className="text-xs text-text-faint truncate">Critical & warnings</p>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 transition-all duration-300 group-hover:scale-110"
              style={{ background: hexToRgba(kpiColors.alerts, 0.15) }}
            >
              <AlertCircle className="w-4 h-4" strokeWidth={2.5} style={{ color: kpiColors.alerts }} />
            </div>
          </div>
          
          {/* Main value - in elegant box */}
          <div className="flex-1 flex items-center justify-center py-2">
            <div 
              className="relative px-5 py-3 rounded-xl"
              style={{ 
                background: isLight
                  ? `linear-gradient(135deg, ${hexToRgba(alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts, 0.06)} 0%, ${hexToRgba(alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts, 0.12)} 100%)`
                  : `linear-gradient(135deg, ${hexToRgba(alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts, 0.12)} 0%, ${hexToRgba(alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts, 0.18)} 100%)`,
                border: `1.5px solid ${hexToRgba(alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts, 0.2)}`,
                boxShadow: `0 4px 16px ${hexToRgba(alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts, 0.12)}`,
              }}
            >
              <div className="text-4xl font-bold tracking-tight" style={{ color: alerts.length === 0 ? kpiColors.alertOk : kpiColors.alerts }}>
                {alerts.length}
              </div>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="mt-auto">
            {alerts.length === 0 ? (
              <div 
                className="p-3 rounded-lg border flex items-center justify-center gap-2"
                style={{ 
                  background: isLight ? "rgba(15,23,42,0.02)" : "rgba(255,255,255,0.02)",
                  borderColor: "var(--border-default)"
                }}
              >
                <Check className="w-4 h-4" strokeWidth={2.2} style={{ color: kpiColors.alertOk }} />
                <span className="text-sm font-medium" style={{ color: kpiColors.alertOk }}>All systems normal</span>
              </div>
            ) : (
              <div 
                className="p-3 rounded-lg border space-y-2"
                style={{ 
                  background: isLight ? "rgba(15,23,42,0.02)" : "rgba(255,255,255,0.02)",
                  borderColor: "var(--border-default)"
                }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-soft flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: statusColors.critical }} />
                    Critical
                  </span>
                  <span className="font-bold" style={{ color: statusColors.critical }}>{criticalCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-soft flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: statusColors.warning }} />
                    Warning
                  </span>
                  <span className="font-bold" style={{ color: statusColors.warning }}>{warningCount}</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Call to action */}
          <div className="text-center mt-3 text-xs text-text-faint opacity-50 group-hover:opacity-100 transition-opacity">
            Click for details →
          </div>
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
