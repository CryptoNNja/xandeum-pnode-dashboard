"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import PNodeTable from "@/components/PNodeTable";
import { GB_IN_BYTES, TB_IN_BYTES, getStatusColors } from "@/lib/utils";
import type { PNode } from "@/lib/types";
import { InfoTooltip } from "@/components/common/InfoTooltip";

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
  filteredAndSortedPNodes: PNode[];
  sortKey: string;
  sortDirection: "asc" | "desc";
  onSort: (key: any) => void;
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
  isLight,
}: DashboardContentProps) => {
  const router = useRouter();
  const statusColors = getStatusColors();

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
          data={filteredAndSortedPNodes}
          onSort={onSort}
          sortKey={sortKey}
          sortDirection={sortDirection}
        />
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAndSortedPNodes.map((pnode) => (
        <div
          key={pnode.ip}
          onClick={() => router.push(`/pnode/${pnode.ip}`)}
          className="kpi-card p-6 cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-bold text-text-main group-hover:text-accent theme-transition">
                {pnode.ip}
              </p>
              <p className="text-xs text-text-faint font-mono">
                {pnode.city || "Unknown Location"}
              </p>
            </div>
            <div
              className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${statusColors[pnode.status === "active" ? "excellent" : "private"]}20`,
                color: statusColors[pnode.status === "active" ? "excellent" : "private"],
              }}
            >
              {pnode.status}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-text-soft">Storage</span>
              <span className="text-text-main font-mono">
                {((pnode.stats?.file_size || 0) / TB_IN_BYTES).toFixed(2)} TB
              </span>
            </div>
            <div className="w-full bg-border-app-soft h-1 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-aqua theme-transition"
                style={{
                  width: `${Math.min(100, ((pnode.stats?.file_size || 0) / (1.5 * TB_IN_BYTES)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-soft">CPU Load</span>
              <span className="text-text-main font-mono">
                {pnode.stats?.cpu_percent?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};
