"use client";

import React, { memo } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Star, Lock, Globe } from "lucide-react";
import clsx from "clsx";
import { calculateNodeScore, getScoreColor } from "@/lib/scoring";
import { useTheme } from "@/hooks/useTheme";
import { getHealthStatus } from "@/lib/health";
import type { PNode } from "@/lib/types";
import { formatBytesAdaptive } from "@/lib/utils";
import { Pagination } from "@/components/common/Pagination";
import { NetworkBadge } from "@/components/common/NetworkBadge";

interface PNodeTableProps {
  data: PNode[];
  onSort: (key: string) => void;
  sortKey: string;
  sortDirection: "asc" | "desc";
  // Pagination props
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  // Selection props (optional)
  selectedNodeIds?: Set<string>;
  onToggleSelection?: (nodeIp: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  // Favorites props (optional)
  favoriteIds?: Set<string>;
  onToggleFavorite?: (nodeIp: string) => void;
}

const PNodeTableComponent = ({
  data = [],
  onSort,
  sortKey,
  sortDirection,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  selectedNodeIds,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  favoriteIds,
  onToggleFavorite,
}: PNodeTableProps) => {
  const { theme, mounted: themeMounted } = useTheme();
  const router = useRouter();
  const isLight = themeMounted ? theme === "light" : false;

  if (!data || !Array.isArray(data)) return null;
  
  const hasSelection = selectedNodeIds && selectedNodeIds.size > 0;
  const allSelected = data.length > 0 && data.every(node => selectedNodeIds?.has(node.ip));

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "-";
    const hours = Math.floor(seconds / 3600);
    
    // Dynamic formatting based on duration
    if (hours < 24) {
      return `${hours}h`;
    } else if (hours < 24 * 30) {
      const days = Math.floor(hours / 24);
      return `${days}d`;
    } else if (hours < 24 * 365) {
      const months = Math.floor(hours / (24 * 30));
      return `${months}mo`;
    } else {
      const years = Math.floor(hours / (24 * 365));
      return `${years}y`;
    }
  };

  const formatPacketValue = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "0";
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (absValue >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (absValue >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString("en-US");
  };

  const getVersionLabel = (pnode: PNode, isPrivate: boolean) => {
    const raw = pnode.version?.trim();
    if (!raw || raw.toLowerCase() === "unknown") {
      return isPrivate ? "Private" : "Unknown";
    }
    const match = raw.match(/(\d+\.\d+\.\d+)/);
    if (match) {
      return `v${match[1]}`;
    }
    const normalized = raw.replace(/^V/, "v");
    return normalized.startsWith("v") ? normalized : `v${normalized}`;
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) {
      return (
        <span className="text-text-faint ml-1 opacity-0 group-hover:opacity-50 transition-opacity">
          ↕
        </span>
      );
    }
    return (
      <span className="text-accent-aqua ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const headers = [
    { key: "network", label: "Network", icon: true }, // Icon column for network - AFTER favorites
    { key: "score", label: "Score" },
    { key: "ip", label: "IP Address" },
    { key: "health", label: "Status" },
    { key: "version", label: "Version" },
    { key: "cpu", label: "CPU Load" },
    { key: "ram", label: "RAM Usage" },
    { key: "storage", label: "Storage" },
    { key: "packets", label: "Traffic" },
    { key: "active_streams", label: "Streams" },
    { key: "total_pages", label: "Pages" },
    { key: "uptime", label: "Uptime" },
  ];

  return (
    <div
      className={clsx(
        "w-full rounded-xl border shadow-xl transition-colors kpi-card overflow-hidden",
        isLight
          ? "border-black/10"
          : "border-border-app"
      )}
    >
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm table-fixed">
          <colgroup>
            {onToggleSelection && <col className="w-[45px]" />}
            {onToggleFavorite && <col className="w-[45px]" />}
            <col className="w-[60px]" />
            <col className="w-[65px]" />
            <col className="w-[155px]" />
            <col className="w-[105px]" />
            <col className="w-[85px]" />
            <col className="w-[85px]" />
            <col className="w-[120px]" />
            <col className="w-[100px]" />
            <col className="w-[125px]" />
            <col className="w-[80px]" />
            <col className="w-[90px]" />
            <col className="w-[75px]" />
          </colgroup>
        <thead>
          <tr
            className={clsx(
              "border-b transition-colors",
              isLight
                ? "border-black/10 bg-black/5"
                : "border-border-app bg-bg-bg2"
            )}
          >
            {/* Selection checkbox header */}
            {onToggleSelection && (
              <th className="p-2 text-center bg-bg-bg2/50">
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? onClearSelection?.() : onSelectAll?.()}
                    className="w-4 h-4 rounded border-2 border-border-app bg-bg-card checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer hover:scale-110"
                    title={allSelected ? "Deselect all" : "Select all"}
                  />
                </div>
              </th>
            )}

            {/* Favorite star header */}
            {onToggleFavorite && (
              <th className="p-2 text-center bg-bg-bg2/50">
                <div className="flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-500/50" />
                </div>
              </th>
            )}
            
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => onSort(header.key)}
                className={clsx(
                  "p-4 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors select-none group whitespace-nowrap",
                  header.icon ? "text-center" : "",
                  isLight ? "text-black/60" : "text-text-soft"
                )}
              >
                <div className={clsx("flex items-center", header.icon ? "justify-center" : "")}>
                  {header.icon ? (
                    <Globe className="w-4 h-4 text-blue-400/70" strokeWidth={2} aria-label="Network" />
                  ) : (
                    <>
                      {header.label}
                      <SortIcon columnKey={header.key} />
                    </>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className={clsx(
            "divide-y transition-colors",
            isLight ? "divide-black/10" : "divide-border-app"
          )}
        >
          {data.map((pnode) => {
            const status = (pnode as any)._healthStatus || "Private";

            // Helper to get CSS variable value
            const getCssVar = (varName: string, fallback: string): string => {
              if (typeof window === "undefined") return fallback;
              return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
            };

            const hexToRgba = (hex: string, alpha: number) => {
              const sanitized = hex.replace("#", "");
              const isShort = sanitized.length === 3;
              const full = isShort
                ? sanitized
                  .split("")
                  .map((char) => char + char)
                  .join("")
                : sanitized.padEnd(6, "0");
              const r = parseInt(full.substring(0, 2), 16) || 0;
              const g = parseInt(full.substring(2, 4), 16) || 0;
              const b = parseInt(full.substring(4, 6), 16) || 0;
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            const getStatusColor = (status: string) => {
              if (status === "Excellent") return getCssVar("--kpi-excellent", "#10B981");
              if (status === "Good") return getCssVar("--kpi-good", "#3B82F6");
              if (status === "Warning") return getCssVar("--kpi-warning", "#F59E0B");
              if (status === "Critical") return getCssVar("--kpi-critical", "#EF4444");
              return getCssVar("--kpi-private", "#64748B"); // Private
            };

            const statusColor = getStatusColor(status);
            const badgeStyle = {
              backgroundColor: hexToRgba(statusColor, 0.2),
              color: statusColor,
              borderColor: hexToRgba(statusColor, 0.3),
            };

            const isPrivate = pnode.status !== "active";
            const sent = pnode.stats.packets_sent;
            const recv = pnode.stats.packets_received;
            const totalPackets = sent + recv;
            const versionLabel = getVersionLabel(pnode, isPrivate);
            const ramUsed = Math.max(pnode.stats.ram_used ?? 0, 0);
            const ramTotal = Math.max(pnode.stats.ram_total ?? 0, 0);
            
            // Use storage_committed for capacity, storage_used for actual usage
            const committedBytes = Math.max(pnode.stats.storage_committed ?? 0, 0);
            const usedBytes = Math.max(pnode.stats.storage_used ?? 0, 0);

            const isSelected = selectedNodeIds?.has(pnode.ip);
            
            return (
              <tr
                key={pnode.ip}
                onClick={() => !isSelected && router.push(`/pnode/${pnode.ip}`)}
                className={clsx(
                  "transition-all duration-200 group relative",
                  !isSelected && "cursor-pointer",
                  isSelected && "!bg-purple-500/10 ring-2 ring-inset ring-purple-500",
                  isLight
                    ? "hover:bg-black/5 hover:shadow-md"
                    : "bg-bg-card hover:bg-table-hover hover:shadow-lg hover:shadow-accent-aqua/5",
                  !isSelected && "hover:border-l-4 hover:border-l-accent-aqua"
                )}
              >
                {/* SELECTION CHECKBOX */}
                {onToggleSelection && (
                  <td 
                    className="p-2 text-center align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelection(pnode.ip)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-2 border-border-app bg-bg-card checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer hover:scale-110"
                      />
                    </div>
                  </td>
                )}

                {/* FAVORITE STAR */}
                {onToggleFavorite && (
                  <td 
                    className="p-2 text-center align-middle"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pnode.ip);
                      }}
                      className={clsx(
                        "flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-125 active:scale-95",
                        favoriteIds?.has(pnode.ip)
                          ? "text-yellow-500 hover:text-yellow-400"
                          : "text-text-faint hover:text-yellow-500"
                      )}
                      title={favoriteIds?.has(pnode.ip) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star 
                        className={clsx(
                          "w-4 h-4 transition-all",
                          favoriteIds?.has(pnode.ip) && "fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                        )} 
                      />
                    </button>
                  </td>
                )}
                
                {/* Network indicator - Dedicated column RIGHT AFTER favorites */}
                <td className="p-4 align-middle text-center">
                  <span 
                    className={`inline-block w-2 h-2 rounded-full ${
                      pnode.network === "MAINNET" ? "bg-green-500" : "bg-yellow-500"
                    }`}
                    title={pnode.network}
                  />
                </td>

                <td className="p-4 text-center align-middle">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getScoreColor((pnode as any)._score)}`}>
                    {(pnode as any)._score}
                  </div>
                </td>

                <td className="p-4 font-mono text-text-main font-medium group-hover:text-accent-aqua transition-colors whitespace-nowrap align-middle">
                  <div className="flex items-center gap-2">
                    {/* Show lock icon for private nodes (IP starts with PRIVATE-) */}
                    {pnode.ip.startsWith('PRIVATE-') && (
                      <Lock 
                        className="w-3.5 h-3.5 text-text-faint flex-shrink-0" 
                        strokeWidth={2.5}
                        title="Private node - no public services"
                      />
                    )}
                    <span>{pnode.ip}</span>
                    <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0" style={{ color: 'var(--accent-aqua)' }} />
                  </div>
                </td>

                <td className="p-4 align-middle">
                  {/* Status badge - cleaner without network dot */}
                  <span
                    className="px-4 py-2 rounded-full text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap"
                    style={badgeStyle}
                  >
                    {status}
                  </span>
                </td>

                <td className="p-4 text-xs text-text-faint font-mono whitespace-nowrap align-middle">
                  {versionLabel}
                </td>

                <td className="p-4 whitespace-nowrap align-middle">
                  <span className="text-sm text-text-main font-mono">
                    {Number.isFinite(pnode.stats.cpu_percent)
                      ? `${pnode.stats.cpu_percent.toFixed(1)}%`
                      : "—"}
                  </span>
                </td>

                <td className="p-4 text-sm text-accent font-semibold whitespace-nowrap align-middle">
                  {formatBytesAdaptive(ramUsed)}{" "}
                  <span className="text-text-faint text-xs">
                    / {formatBytesAdaptive(ramTotal)}
                  </span>
                </td>

                <td className="p-4 text-sm font-semibold whitespace-nowrap align-middle">
                  <div className="flex flex-col gap-1">
                    {/* Storage Committed (capacity) - Main value in purple */}
                    <span className="text-sm font-bold" style={{ color: isLight ? '#9945ff' : '#a855f7' }}>
                      {formatBytesAdaptive(committedBytes)}
                    </span>
                    {/* Storage Used (actual) - Secondary info */}
                    <span className="text-[10px] text-text-faint">
                      {formatBytesAdaptive(usedBytes)}
                      <span className="ml-1 opacity-60">used</span>
                    </span>
                  </div>
                </td>

                <td className="p-4 text-sm text-text-main font-mono whitespace-nowrap align-middle">
                  <div className="flex flex-col">
                    <span>
                      {formatPacketValue(totalPackets)}
                      <span className="text-[10px] text-text-faint ml-1">
                        pkts
                      </span>
                    </span>
                    <span className="text-[10px] mt-2">
                      <span style={{ color: 'var(--accent-aqua)' }}>
                        ↑ {formatPacketValue(sent)}
                      </span>
                      <span className="text-text-faint mx-1">•</span>
                      <span style={{ color: isLight ? '#d97706' : '#fbbf24' }}>
                        ↓ {formatPacketValue(recv)}
                      </span>
                    </span>
                  </div>
                </td>

                <td className="p-4 text-sm text-text-main font-mono text-center whitespace-nowrap align-middle">
                  <span className="px-2 py-1 rounded-md bg-green-900/20 border border-green-600/30">
                    {pnode.stats.active_streams || 0}
                  </span>
                </td>

                <td className="p-4 text-sm text-text-main font-mono text-center whitespace-nowrap align-middle">
                  {pnode.stats.total_pages > 0 ? (
                    <span className="text-accent-purple font-semibold">
                      {pnode.stats.total_pages.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-text-faint">—</span>
                  )}
                </td>

                <td className="p-4 text-sm text-text-main font-mono whitespace-nowrap align-middle">
                  {formatUptime(pnode.stats.uptime)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
};

export const PNodeTable = memo(PNodeTableComponent);
PNodeTable.displayName = "PNodeTable";

export default PNodeTable;
