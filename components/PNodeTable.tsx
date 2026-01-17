"use client";

import React, { memo } from "react";
import { useRouter } from "next/navigation";
import { Star, Lock, Globe, Copy } from "lucide-react";
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
  const allSelected = data.length > 0 && data.every(node => node.ip && selectedNodeIds?.has(node.ip));

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "-";
    const totalHours = Math.floor(seconds / 3600);
    
    // Option A: Double precision compact format
    if (totalHours < 24) {
      // Less than 1 day: show hours only
      return `${totalHours}h`;
    } else if (totalHours < 24 * 30) {
      // Less than 30 days: show "Xd Yh"
      const days = Math.floor(totalHours / 24);
      const hours = totalHours % 24;
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    } else if (totalHours < 24 * 365) {
      // Less than 1 year: show "Xmo Yd"
      const totalDays = Math.floor(totalHours / 24);
      const months = Math.floor(totalDays / 30);
      const days = totalDays % 30;
      return days > 0 ? `${months}mo ${days}d` : `${months}mo`;
    } else {
      // 1 year or more: show "Xy Zmo"
      const totalDays = Math.floor(totalHours / 24);
      const years = Math.floor(totalDays / 365);
      const remainingDays = totalDays % 365;
      const months = Math.floor(remainingDays / 30);
      return months > 0 ? `${years}y ${months}mo` : `${years}y`;
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
    { key: "network", label: "Network", sortable: true }, // Network column - sortable
    { key: "score", label: "Score", sortable: true },
    { key: "pubkey", label: "Operator", sortable: true }, // 🆕 New column for pubkey/operator
    { key: "ip", label: "IP Address", sortable: true },
    { key: "credits", label: "Credits", sortable: true }, // 🆕 Credits earned (XAN) - sortable
    { key: "health", label: "Status", sortable: true },
    { key: "version", label: "Version", sortable: true },
    { key: "cpu", label: "CPU", sortable: true },
    { key: "ram", label: "RAM", sortable: true },
    { key: "storage", label: "Storage", sortable: true },
    { key: "packets", label: "Traffic", sortable: true },
    { key: "uptime", label: "Uptime", sortable: true },
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
        <table className="min-w-full text-left border-collapse text-sm" style={{ tableLayout: 'fixed', width: '1100px' }}>
          <colgroup>
            {onToggleSelection && <col style={{ width: '40px' }} />}
            {onToggleFavorite && <col style={{ width: '50px' }} />}
            <col style={{ width: '60px' }} />
            <col style={{ width: '65px' }} />
            <col style={{ width: '115px' }} />
            <col style={{ width: '145px' }} />
            <col style={{ width: '95px' }} />
            <col style={{ width: '95px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '70px' }} />
            <col style={{ width: '75px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '95px' }} />
            <col style={{ width: '85px' }} />
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
              <th className="p-4 bg-bg-bg2/50 align-middle" style={{ textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => allSelected ? onClearSelection?.() : onSelectAll?.()}
                  className="w-4 h-4 rounded border-2 border-border-app bg-bg-card checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer hover:scale-110"
                  title={allSelected ? "Deselect all" : "Select all"}
                />
              </th>
            )}

            {/* Favorite star header */}
            {onToggleFavorite && (
              <th className="p-4 bg-bg-bg2/50 text-[11px] align-middle" style={{ textAlign: 'center' }}>
                <Star className="w-4 h-4 text-yellow-500/60 mx-auto" />
              </th>
            )}
            
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => header.sortable && onSort(header.key)}
                className={clsx(
                  "p-4 text-[11px] font-bold uppercase tracking-wider transition-colors select-none group whitespace-nowrap align-middle",
                  header.sortable ? "cursor-pointer" : "cursor-default",
                  isLight ? "text-black/60" : "text-text-soft"
                )}
                style={{ textAlign: 'center' }}
              >
                {header.key === "network" ? (
                  <>
                    <Globe className="w-4 h-4 text-blue-400/70 inline-block" strokeWidth={2} aria-label="Network" />
                    {header.sortable && <SortIcon columnKey={header.key} />}
                  </>
                ) : (
                  <>
                    {header.label}
                    {header.sortable && <SortIcon columnKey={header.key} />}
                  </>
                )}
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
          {data.map((pnode, index) => {
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

            const isSelected = pnode.ip ? selectedNodeIds?.has(pnode.ip) : false;
            const isRegistryOnly = pnode.status === "registry_only";
            const canNavigate = pnode.ip && !isRegistryOnly;
            
            return (
              <tr
                key={pnode.ip || pnode.pubkey || `unknown-${index}`}
                onClick={() => !isSelected && canNavigate && router.push(`/pnode/${pnode.ip}`)}
                className={clsx(
                  "transition-all duration-200 group relative",
                  canNavigate && !isSelected && "cursor-pointer",
                  !canNavigate && "cursor-default",
                  isSelected && "!bg-purple-500/10 ring-2 ring-inset ring-purple-500",
                  isRegistryOnly && "opacity-60 italic",
                  isLight
                    ? "hover:bg-black/5 hover:shadow-md"
                    : "bg-bg-card hover:bg-table-hover hover:shadow-lg hover:shadow-accent-aqua/5",
                  !isSelected && canNavigate && "hover:border-l-4 hover:border-l-accent-aqua"
                )}
              >
                {/* SELECTION CHECKBOX */}
                {onToggleSelection && pnode.ip && (
                  <td 
                    className="p-4 align-middle"
                    style={{ textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(pnode.ip!)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-2 border-border-app bg-bg-card checked:bg-purple-500 checked:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all cursor-pointer hover:scale-110"
                    />
                  </td>
                )}
                {onToggleSelection && !pnode.ip && <td className="p-4"></td>}

                {/* FAVORITE STAR */}
                {onToggleFavorite && pnode.ip && (
                  <td 
                    className="p-4 align-middle"
                    style={{ textAlign: 'center' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pnode.ip!);
                      }}
                      className={clsx(
                        "w-4 h-4 transition-all hover:scale-125 active:scale-95 mx-auto",
                        favoriteIds?.has(pnode.ip!)
                          ? "text-yellow-500 hover:text-yellow-400"
                          : "text-text-faint hover:text-yellow-500"
                      )}
                      title={favoriteIds?.has(pnode.ip!) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star 
                        className={clsx(
                          "w-4 h-4 transition-all",
                          favoriteIds?.has(pnode.ip!) && "fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]"
                        )} 
                      />
                    </button>
                  </td>
                )}
                {onToggleFavorite && !pnode.ip && <td className="p-4"></td>}
                
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

                {/* 🆕 PUBKEY/OPERATOR CELL */}
                <td className="p-4 align-middle" style={{ textAlign: 'center' }}>
                  {pnode.pubkey ? (
                    <>
                      <span className="text-xs text-text-main font-mono">
                        {pnode.pubkey.slice(0, 8)}...{pnode.pubkey.slice(-4)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(pnode.pubkey!);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-all text-text-faint hover:text-[#00d4ff]"
                        title="Copy pubkey"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-text-faint italic">Unknown</span>
                  )}
                </td>

                <td className="p-4 font-mono text-text-main font-medium group-hover:text-accent-aqua transition-colors align-middle" style={{ textAlign: 'center' }}>
                  {pnode.ip ? (
                    <>
                      {pnode.ip.startsWith('PRIVATE-') && (
                        <Lock 
                          className="inline w-3 h-3 text-text-faint mr-1" 
                          strokeWidth={2.5}
                          aria-label="Private node - no public services"
                        />
                      )}
                      <span className="text-xs" title={pnode.ip}>
                        {pnode.ip}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(pnode.ip!);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-all text-text-faint hover:text-[#00d4ff]"
                        title="Copy IP"
                      >
                        <Copy className="inline w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-text-faint italic">Awaiting</span>
                  )}
                </td>

                {/* 🆕 CREDITS CELL - Premium design */}
                <td className="p-4 align-middle text-center">
                  <span className={pnode.credits && pnode.credits > 0 
                    ? "text-sm font-bold font-mono bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent" 
                    : "text-xs text-text-faint italic"}>
                    {pnode.credits && pnode.credits > 0 ? pnode.credits.toLocaleString() : '—'}
                  </span>
                </td>

                <td className="p-4 align-middle text-center">
                  <span className="px-3 py-1.5 rounded-full text-[9px] font-bold border uppercase tracking-wide inline-block" style={badgeStyle}>
                    {status}
                  </span>
                </td>

                <td className="p-4 text-xs text-text-faint font-mono align-middle text-center">
                  <span>{versionLabel}</span>
                </td>

                <td className="p-4 align-middle text-center">
                  <span className="text-sm text-text-main font-mono">
                    {Number.isFinite(pnode.stats.cpu_percent) ? `${pnode.stats.cpu_percent.toFixed(1)}%` : '—'}
                  </span>
                </td>

                <td className="p-4 text-xs text-accent font-semibold align-middle text-center">
                  <span className="font-mono">
                    {ramTotal > 0 ? `${((ramUsed / ramTotal) * 100).toFixed(1)}%` : '—'}
                  </span>
                </td>

                <td className="p-4 text-sm font-semibold align-middle text-center">
                  <div className="text-sm font-bold whitespace-nowrap" style={{ color: isLight ? '#9945ff' : '#a855f7' }}>
                    {formatBytesAdaptive(committedBytes)}
                  </div>
                  <div className="text-[10px] text-text-faint whitespace-nowrap">
                    {formatBytesAdaptive(usedBytes)} used
                  </div>
                </td>

                <td className="p-4 text-xs text-text-main font-mono align-middle text-center">
                  <div className="font-semibold whitespace-nowrap">
                    {formatPacketValue(totalPackets)}
                  </div>
                  <div className="text-[9px] whitespace-nowrap">
                    <span style={{ color: 'var(--accent-aqua)' }}>↑{formatPacketValue(sent)}</span>
                    <span className="mx-1">•</span>
                    <span style={{ color: isLight ? '#d97706' : '#fbbf24' }}>↓{formatPacketValue(recv)}</span>
                  </div>
                </td>

                <td className="p-4 text-sm text-text-main font-mono align-middle text-center">
                  <span className="whitespace-nowrap">{formatUptime(pnode.stats.uptime)}</span>
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
