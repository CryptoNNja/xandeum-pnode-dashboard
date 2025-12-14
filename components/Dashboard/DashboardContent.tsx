
"use client";

import dynamic from "next/dynamic";
import clsx from "clsx";
import PNodeTable from "@/components/PNodeTable";
import ClientErrorBoundary from "@/components/ClientErrorBoundary";
import { ViewMode, SortKey, SortDirection } from "@/hooks/usePnodeDashboard";
import type { PNode } from "@/lib/types";
import { getHealthStatus } from "@/lib/health";
import { calculateNodeScore, getScoreColor } from "@/lib/scoring";

const NodesMap = dynamic(() => import("@/components/NodesMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[650px] w-full rounded-xl border border-border-app bg-bg-card flex flex-col items-center justify-center gap-4 text-text-soft theme-transition">
      <div className="w-12 h-12 border-4 border-accent-aqua border-t-transparent rounded-full animate-spin" />
      <p className="text-xs uppercase tracking-[0.35em]">Loading map</p>
    </div>
  ),
});

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return "-";
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    const precision = value >= 10 || unitIndex < 2 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
};
  
const formatUptime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const statusBadge = (status: ReturnType<typeof getHealthStatus>) => {
    switch (status) {
      case "Excellent": return "bg-kpi-excellent/10 text-kpi-excellent border border-kpi-excellent/30";
      case "Good": return "bg-accent-aqua/10 text-accent-aqua border border-accent-aqua/30";
      case "Warning": return "bg-kpi-warning/10 text-kpi-warning border border-kpi-warning/30";
      case "Critical": return "bg-kpi-critical/10 text-kpi-critical border border-kpi-critical/40";
      default: return "bg-bg-bg2 text-text-soft border border-border-app";
    }
};

type DashboardContentProps = {
    viewMode: ViewMode;
    filteredAndSortedPNodes: PNode[];
    sortKey: SortKey;
    sortDirection: SortDirection;
    onSort: (key: SortKey | string) => void;
    loading: boolean;
    isLight: boolean;
};

export const DashboardContent = ({ 
    viewMode, 
    filteredAndSortedPNodes, 
    sortKey, 
    sortDirection, 
    onSort,
    loading,
    isLight
}: DashboardContentProps) => {
    if (loading) {
        return (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00D4AA]" />
            <p className="text-gray-400 mt-6 text-lg animate-pulse">
              Scanning Xandeum Network...
            </p>
          </div>
        );
    }

    if (filteredAndSortedPNodes.length === 0) {
        return (
            <div className="text-center py-20 bg-bg-card rounded-xl border border-border-app">
                <p className="text-text-main">No pNodes match your filters.</p>
            </div>
        );
    }

    return (
        <>
        {viewMode === "map" && (
          <ClientErrorBoundary
            fallback={({ error, reset }) => (
              <div className="h-[650px] w-full rounded-xl border border-border-app bg-bg-card flex flex-col items-center justify-center gap-3 text-text-soft theme-transition">
                <p className="text-xs uppercase tracking-[0.35em]">Map failed to render</p>
                <p className="text-[11px] font-mono text-text-faint max-w-[820px] px-6 text-center wrap-break-word">
                  {error.message}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-2 px-4 py-2 rounded-lg border border-border-app bg-bg-bg text-text-main hover:bg-bg-bg2 transition-colors theme-transition text-xs uppercase tracking-[0.25em]"
                >
                  Retry
                </button>
              </div>
            )}
          >
            <NodesMap nodes={filteredAndSortedPNodes} />
          </ClientErrorBoundary>
        )}

        {viewMode === "table" && (
          <PNodeTable
            data={filteredAndSortedPNodes}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
          />
        )}

        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPNodes.map((pnode) => {
              const status = getHealthStatus(pnode);
              const statusBorderClass =
                status === "Excellent"
                  ? "border-excellent"
                  : status === "Good"
                    ? "border-good"
                    : status === "Warning"
                      ? "border-warning"
                      : status === "Critical"
                        ? "border-critical"
                        : "border-soft";
              const cpuPercentValue = pnode.stats?.cpu_percent;
              const cpuDisplay =
                typeof cpuPercentValue === "number" && Number.isFinite(cpuPercentValue)
                  ? `${cpuPercentValue.toFixed(1)}%`
                  : "—";
              const ramDisplay = formatBytes(pnode.stats?.ram_used ?? 0);
              const diskDisplay = formatBytes(pnode.stats?.file_size ?? 0);
              const uptimeDisplay = formatUptime(pnode.stats?.uptime ?? 0);

              return (
                <div
                  key={pnode.ip}
                  onClick={() =>
                    (window.location.href = `/pnode/${pnode.ip}`)
                  }
                  className={clsx(
                    "p-6 rounded-xl border border-l-4 cursor-pointer transition-all hover:-translate-y-1 theme-transition group",
                    isLight
                      ? "bg-white border-black/10 hover:shadow-[0_20px_35px_-15px_rgba(15,23,42,0.25)]"
                      : "bg-bg-card border-border-app hover:shadow-[0_25px_45px_-20px_rgba(20,28,58,0.55)]",
                    statusBorderClass
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2
                      className={clsx(
                        "font-mono font-bold text-lg transition-colors",
                        isLight ? "text-text-main" : "text-white"
                      )}
                    >
                      {pnode.ip}
                    </h2>
                    <div className="flex gap-2 items-center">
                      <div
                        className={clsx(
                          "flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs border border-current/40",
                          getScoreColor(calculateNodeScore(pnode)),
                          isLight ? "bg-white/80" : "bg-black/40"
                        )}
                      >
                        {calculateNodeScore(pnode)}
                      </div>
                      <span
                        className={`px-2 py-2 rounded-full text-[10px] font-bold uppercase border ${statusBadge(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div
                      className={clsx(
                        "p-3 rounded-lg border theme-transition",
                        isLight
                          ? "bg-black/5 border-black/10"
                          : "bg-bg-bg2 border-border-app"
                      )}
                    >
                      <p className="text-text-soft text-[11px] uppercase tracking-wide">
                        CPU
                      </p>
                      <p className="font-bold text-text-main">
                        {cpuDisplay}
                      </p>
                    </div>

                    <div
                      className={clsx(
                        "p-3 rounded-lg border theme-transition",
                        isLight
                          ? "bg-black/5 border-black/10"
                          : "bg-bg-bg2 border-border-app"
                      )}
                    >
                      <p className="text-text-soft text-[11px] uppercase tracking-wide">
                        RAM
                      </p>
                      <p className="font-bold text-text-main">
                        {ramDisplay}
                      </p>
                    </div>

                    <div
                      className={clsx(
                        "p-3 rounded-lg border theme-transition",
                        isLight
                          ? "bg-black/5 border-black/10"
                          : "bg-bg-bg2 border-border-app"
                      )}
                    >
                      <p className="text-text-soft text-[11px] uppercase tracking-wide">
                        Disk
                      </p>
                      <p className="font-bold text-accent">
                        {diskDisplay}
                      </p>
                    </div>

                    <div
                      className={clsx(
                        "p-3 rounded-lg border theme-transition",
                        isLight
                          ? "bg-black/5 border-black/10"
                          : "bg-bg-bg2 border-border-app"
                      )}
                    >
                      <p className="text-text-soft text-[11px] uppercase tracking-wide">
                        Uptime
                      </p>
                      <p className="font-bold text-text-main">
                        {uptimeDisplay}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    )
}
