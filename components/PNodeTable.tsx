"use client";

import React from "react";

interface PNodeStats {
  cpu_percent: number;
  ram_used: number;
  ram_total: number;
  file_size: number;
  uptime: number;
  packets_received: number;
  packets_sent: number;
}

interface PNode {
  ip: string;
  status: string;
  stats: PNodeStats;
  version?: string;
}

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
  if (!data || !Array.isArray(data)) return null;

  const formatBytes = (bytes: number) =>
    (bytes / 1_000_000_000).toFixed(0) + " GB";

  const formatUptime = (seconds: number) => {
    if (seconds === 0) return "-";
    const hours = Math.floor(seconds / 3600);
    return hours + " h";
  };

  const formatPackets = (p: number) => {
    if (!p || p <= 0) return "-";
    return p.toLocaleString("en-US");
  };

  const getHealthStatus = (pnode: PNode) => {
    if (pnode.status === "gossip_only" || pnode.stats.uptime === 0)
      return "Private";

    const cpu = pnode.stats.cpu_percent;
    const hours = pnode.stats.uptime / 3600;

    if (cpu >= 90) return "Critical";
    if (hours < 1) return "Warning";
    if (cpu >= 70) return "Warning";
    if (cpu < 20 && hours >= 24) return "Excellent";
    return "Good";
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) {
      return (
        <span className="text-gray-600 ml-1 opacity-0 group-hover:opacity-50 transition-opacity">
          ↕
        </span>
      );
    }
    return (
      <span className="text-[#00D4AA] ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const headers = [
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
    <div className="overflow-x-auto rounded-xl border border-[#2D3454] bg-[#1A1F3A] shadow-xl">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-[#0F1419] border-b border-[#2D3454]">
            {headers.map((header) => (
              <th
                key={header.key}
                onClick={() => onSort(header.key)}
                className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-400 cursor-pointer hover:text-white hover:bg-[#2D3454]/50 transition-colors select-none group whitespace-nowrap"
              >
                <div className="flex items-center">
                  {header.label}
                  <SortIcon columnKey={header.key} />
                </div>
              </th>
            ))}
            <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2D3454]">
          {data.map((pnode) => {
            const status = getHealthStatus(pnode);

            let badgeClass = "bg-[#64748B]/20 text-[#64748B] border-[#64748B]/30"; // Private
            if (status === "Excellent")
              badgeClass =
                "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30";
            else if (status === "Good")
              badgeClass =
                "bg-[#38BDF8]/20 text-[#38BDF8] border-[#38BDF8]/30";
            else if (status === "Warning")
              badgeClass =
                "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/30";
            else if (status === "Critical")
              badgeClass =
                "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/30";

            const isPrivate = status === "Private";
            const sent = pnode.stats.packets_sent;
            const recv = pnode.stats.packets_received;
            const totalPackets = sent + recv;

            return (
              <tr
                key={pnode.ip}
                onClick={() => (window.location.href = `/pnode/${pnode.ip}`)}
                className="hover:bg-[#2D3454]/30 transition-colors cursor-pointer group"
              >
                <td className="p-4 font-mono text-white font-medium group-hover:text-[#00D4AA] transition-colors whitespace-nowrap">
                  {pnode.ip}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${badgeClass}`}
                  >
                    {status}
                  </span>
                </td>

                <td className="p-4 text-xs text-gray-400 font-mono whitespace-nowrap">
                  {pnode.version || (isPrivate ? "Unknown" : "-")}
                </td>

                <td className="p-4">
                  {!isPrivate ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pnode.stats.cpu_percent > 90
                              ? "bg-[#EF4444]"
                              : "bg-[#00D4AA]"
                          }`}
                          style={{
                            width: `${Math.min(
                              pnode.stats.cpu_percent,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-300 w-12 text-right">
                        {pnode.stats.cpu_percent.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">
                      Hidden
                    </span>
                  )}
                </td>

                <td className="p-4 text-sm text-gray-300 whitespace-nowrap">
                  {!isPrivate ? (
                    <>
                      {formatBytes(pnode.stats.ram_used)}{" "}
                      <span className="text-gray-600 text-xs">
                        / {formatBytes(pnode.stats.ram_total)}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-600 text-xs italic">
                      Hidden
                    </span>
                  )}
                </td>

                <td className="p-4 text-sm text-[#7B3FF2] font-semibold whitespace-nowrap">
                  {!isPrivate ? (
                    formatBytes(pnode.stats.file_size)
                  ) : (
                    <span className="text-gray-600 text-xs italic font-normal">
                      Hidden
                    </span>
                  )}
                </td>

                {/* TRAFFIC : total + IN/OUT colorés */}
                <td className="p-4 text-sm text-gray-300 font-mono whitespace-nowrap">
                  {!isPrivate ? (
                    <div className="flex flex-col">
                      <span>
                        {formatPackets(totalPackets)}
                        <span className="text-[10px] text-gray-500 ml-1">
                          pkts
                        </span>
                      </span>
                      <span className="text-[10px] mt-0.5">
                        <span className="text-[#00D4AA]">
                          ↑ {formatPackets(sent)}
                        </span>
                        <span className="text-gray-500 mx-1">•</span>
                        <span className="text-[#e9c601]">
                          ↓ {formatPackets(recv)}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs italic">
                      Hidden
                    </span>
                  )}
                </td>

                <td className="p-4 text-sm text-gray-300 font-mono whitespace-nowrap">
                  {!isPrivate ? (
                    formatUptime(pnode.stats.uptime)
                  ) : (
                    <span className="text-gray-600 text-xs italic">
                      Hidden
                    </span>
                  )}
                </td>

                <td className="p-4 text-right">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#2D3454] text-[#00D4AA] opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
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
