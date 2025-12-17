"use client";

import React from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { calculateNodeScore, getScoreColor } from "@/lib/scoring";
import { useTheme } from "@/hooks/useTheme";
import { getHealthStatus } from "@/lib/health";
import type { PNode } from "@/lib/types";

interface PNodeTableProps {
  data: PNode[];
  onSort: (key: string) => void;
  sortKey: string;
  sortDirection: "asc" | "desc";
}

export default function PNodeTable({
  data = [],
  onSort,
  sortKey,
  sortDirection,
}: PNodeTableProps) {
  const { theme, mounted: themeMounted } = useTheme();
  const router = useRouter();
  const isLight = themeMounted ? theme === "light" : false;

  if (!data || !Array.isArray(data)) return null;

  const formatBytes = (bytes: number) =>
    `${Math.max(bytes, 0) / 1_000_000_000 < 0.1 ? (bytes / 1_000_000_000).toFixed(1) : (bytes / 1_000_000_000).toFixed(0)} GB`;

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "-";
    const hours = Math.floor(seconds / 3600);
    return hours + " h";
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
    { key: "score", label: "Score" },
    { key: "ip", label: "IP Address" },
    { key: "health", label: "Status" },
    { key: "version", label: "Version" },
    { key: "cpu", label: "CPU Load" },
    { key: "ram", label: "RAM Usage" },
    { key: "storage", label: "Storage" },
    { key: "packets", label: "Traffic" },
    { key: "uptime", label: "Uptime" },
  ];

  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-xl border shadow-xl transition-colors kpi-card",
        isLight
          ? "border-black/10"
          : "border-border-app"
      )}
    >
      <table className="w-full text-left border-collapse text-sm">
        <colgroup>
          <col style={{ width: '60px' }} />
          <col style={{ width: '130px' }} />
          <col style={{ width: '85px' }} />
          <col style={{ width: '80px' }} />
          <col style={{ width: '90px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '90px' }} />
          <col style={{ width: '120px' }} />
          <col style={{ width: '75px' }} />
          <col style={{ width: '50px' }} />
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
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => onSort(header.key)}
                className={clsx(
                  "p-4 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors select-none group whitespace-nowrap",
                  isLight ? "text-black/60" : "text-text-soft"
                )}
              >
                <div className="flex items-center">
                  {header.label}
                  <SortIcon columnKey={header.key} />
                </div>
              </th>
            ))}
            <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-text-faint text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody
          className={clsx(
            "divide-y transition-colors",
            isLight ? "divide-black/10" : "divide-border-app"
          )}
        >
          {data.map((pnode) => {
            const status = getHealthStatus(pnode);

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
            // API v0.7: stats.file_size = storage_committed
            const committedBytes = Math.max(pnode.stats.file_size ?? 0, 0);

            return (
              <tr
                key={pnode.ip}
                onClick={() => router.push(`/pnode/${pnode.ip}`)}
                className={clsx(
                  "transition-colors cursor-pointer group",
                  isLight
                    ? "hover:bg-black/5"
                    : "bg-bg-card hover:bg-table-hover"
                )}
              >
                <td className="p-4 text-center align-middle">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getScoreColor(calculateNodeScore(pnode))}`}>
                    {calculateNodeScore(pnode)}
                  </div>
                </td>

                <td className="p-4 font-mono text-text-main font-medium group-hover:text-accent-aqua transition-colors whitespace-nowrap align-middle">
                  {pnode.ip}
                </td>

                <td className="p-4 align-middle">
                  <span
                    className="px-4 py-2 rounded-full text-[10px] font-bold border uppercase tracking-wide"
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
                  {formatBytes(ramUsed)}{" "}
                  <span className="text-text-faint text-xs">
                    / {formatBytes(ramTotal)}
                  </span>
                </td>

                <td className="p-4 text-sm font-semibold whitespace-nowrap align-middle" style={{ color: 'var(--accent)' }}>
                  {formatBytes(committedBytes)}
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

                <td className="p-4 text-sm text-text-main font-mono whitespace-nowrap align-middle">
                  {formatUptime(pnode.stats.uptime)}
                </td>

                <td className="p-4 text-right align-middle">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-bg-bg2 text-accent-aqua opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                    →
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
