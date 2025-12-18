"use client";

import React, { memo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Cpu, HardDrive, Zap, MapPin, Activity, ShieldCheck, Globe } from "lucide-react";
import PNodeTable from "@/components/PNodeTable";
import { GB_IN_BYTES, TB_IN_BYTES, getStatusColors, hexToRgba } from "@/lib/utils";
import type { PNode } from "@/lib/types";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import clsx from "clsx";

const NodesMap = dynamic(() => import("@/components/NodesMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[650px] bg-bg-card/50 rounded-xl flex items-center justify-center border border-border-app animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent-aqua border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-text-soft">Loading network map...</p>
      </div>
    </div>
  ),
});

type DashboardContentProps = {
  viewMode: "map" | "table" | "grid";
  filteredAndSortedPNodes: (PNode & { _score?: number; _healthStatus?: string })[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: any) => void;
  loading: boolean;
  isLight: boolean;
};

const DashboardContentComponent = ({
  viewMode,
  filteredAndSortedPNodes,
  sortKey,
  sortDirection,
  onSort,
  loading,
  isLight,
}: DashboardContentProps) => {
  const router = useRouter();
  const statusColors = getStatusColors();

  const getHealthColor = (status?: string) => {
    switch (status) {
      case "Excellent": return statusColors.excellent;
      case "Good": return statusColors.good;
      case "Warning": return statusColors.warning;
      case "Critical": return statusColors.critical;
      case "Private": return "#7B3FF2"; // Purple for private
      default: return "#64748B";
    }
  };

  const getResourceColor = (val: number) => {
    if (val >= 90) return "#EF4444"; // Critical Red
    if (val >= 75) return "#F59E0B"; // Warning Orange
    return "#00D4AA"; // Healthy Aqua
  };

  if (viewMode === "map") {
    return (
      <section className="max-w-7xl mx-auto px-6 w-full space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-text-soft">Global Node Distribution</h2>
          <InfoTooltip content="Geographic location of detected pNodes. Clustered markers indicate multiple nodes in the same region." />
        </div>
        <div className="h-[650px] relative">
          <NodesMap nodes={filteredAndSortedPNodes} />
        </div>
      </section>
    );
  }

  if (viewMode === "table") {
    return (
      <section className="max-w-7xl mx-auto px-6">
        <PNodeTable
          data={filteredAndSortedPNodes as PNode[]}
          onSort={onSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
        />
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredAndSortedPNodes.map((pnode) => {
        const score = pnode._score ?? 0;
        const healthStatus = pnode._healthStatus;
        const healthColor = getHealthColor(healthStatus);
        const isPrivate = pnode.status === "gossip_only";
        
        // Resource calculations
        const cpu = pnode.stats?.cpu_percent ?? 0;
        const ramUsed = pnode.stats?.ram_used ?? 0;
        const ramTotal = pnode.stats?.ram_total ?? 1; // avoid /0
        const ramPercent = (ramUsed / ramTotal) * 100;
        const storage = pnode.stats?.file_size ?? 0;
        const storagePercent = Math.min(100, (storage / (1 * TB_IN_BYTES)) * 100);

        return (
          <div
            key={pnode.ip}
            onClick={() => router.push(`/pnode/${pnode.ip}`)}
            className={clsx(
              "kpi-card relative overflow-hidden p-6 cursor-pointer group transition-all duration-300",
              "border-2 hover:scale-[1.02] active:scale-[0.98]",
              healthStatus === "Critical" && "animate-pulse-slow"
            )}
            style={{
              borderColor: hexToRgba(healthColor, 0.3),
              boxShadow: `0 0 20px ${hexToRgba(healthColor, 0.1)}`,
            }}
          >
            {/* BACKGROUND GLOW */}
            <div 
              className="absolute -top-24 -right-24 w-48 h-48 blur-[80px] pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity"
              style={{ backgroundColor: healthColor }}
            />

            {/* HEADER: IP & LED */}
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={clsx(
                    "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                    pnode.status === "active" ? "bg-green-400 animate-pulse" : isPrivate ? "bg-blue-400" : "bg-gray-500"
                  )} />
                  {pnode.status === "active" && (
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-40" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight text-text-main font-mono">
                    {pnode.ip}
                  </p>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-text-faint">
                    {pnode.version ? pnode.version.split(' ')[0] : "v?.?.?"}
                  </p>
                </div>
              </div>
              <div 
                className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.1em]"
                style={{ 
                  backgroundColor: hexToRgba(healthColor, 0.15),
                  color: healthColor,
                  border: `1px solid ${hexToRgba(healthColor, 0.3)}`
                }}
              >
                {healthStatus || "AUDITING"}
              </div>
            </div>

            {/* BODY: HEALTH CIRCLE & RESOURCE BARS */}
            <div className="flex items-center gap-8 mb-6">
              {/* HEALTH RADIAL INDICATOR */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-white/5"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    style={{ 
                      stroke: healthColor,
                      strokeDasharray: 264,
                      strokeDashoffset: 264 - (264 * score) / 100,
                      transition: "stroke-dashoffset 1s ease-out"
                    }}
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black leading-none" style={{ color: healthColor }}>
                    {isPrivate ? "—" : score}
                  </span>
                  {!isPrivate && <span className="text-[8px] font-bold text-text-soft uppercase">Score</span>}
                </div>
              </div>

              {/* RESOURCE MINI JAUGES */}
              <div className="flex-1 space-y-4">
                {/* CPU */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-text-soft">
                      <Cpu className="w-3 h-3" /> CPU
                    </span>
                    <span className={clsx(cpu > 90 && "animate-pulse text-red-500")}>
                      {cpu.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500" 
                      style={{ width: `${cpu}%`, backgroundColor: getResourceColor(cpu) }}
                    />
                  </div>
                </div>

                {/* RAM */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-text-soft">
                      <Zap className="w-3 h-3" /> RAM
                    </span>
                    <span className={clsx(ramPercent > 90 && "animate-pulse text-red-500")}>
                      {ramPercent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500" 
                      style={{ width: `${ramPercent}%`, backgroundColor: getResourceColor(ramPercent) }}
                    />
                  </div>
                </div>

                {/* STORAGE */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-text-soft">
                      <HardDrive className="w-3 h-3" /> Disk
                    </span>
                    <span className="text-text-main">
                      {(storage / TB_IN_BYTES).toFixed(1)}TB
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-purple" 
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FOOTER: LOCATION & NETWORK ACTIVITY */}
            <div className="pt-4 border-t border-border-app/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-soft">
                <MapPin className="w-3.5 h-3.5 text-accent-aqua" />
                <span className="text-[10px] font-bold truncate max-w-[120px]">
                  {pnode.city ? `${pnode.city}, ${pnode.country || ""}` : "Unknown Origin"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-mono text-text-faint">
                  <Activity className="w-3 h-3" />
                  <span>{((pnode.stats?.packets_sent ?? 0) + (pnode.stats?.packets_received ?? 0)).toLocaleString()}</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-accent-aqua/20 transition-colors">
                  <Globe className="w-3 h-3 text-text-faint group-hover:text-accent-aqua" />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};

export const DashboardContent = memo(DashboardContentComponent);
DashboardContent.displayName = "DashboardContent";
