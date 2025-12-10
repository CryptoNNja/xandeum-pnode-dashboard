"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Radio, ShieldCheck, Network, Cpu, Package, Activity } from "lucide-react";
import PNodeTable from "@/components/PNodeTable";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Map en dynamic pour éviter les problèmes SSR
const NodesMap = dynamic(() => import("@/components/NodesMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[650px] w-full bg-[#0A0E27] animate-pulse rounded-xl border border-[#2D3454] flex items-center justify-center flex-col gap-4">
      <div className="w-12 h-12 border-4 border-[#00D4AA] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400 font-mono text-sm tracking-widest">
        INITIALIZING GEO-LINK...
      </p>
    </div>
  ),
});

/* -------------------------------------------------- */
/*                      TYPES                         */
/* -------------------------------------------------- */

type SortKey = "ip" | "cpu" | "ram" | "storage" | "uptime" | "health" | "packets";
type SortDirection = "asc" | "desc";
type ViewMode = "grid" | "table" | "map";

interface PNodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
}

interface PNode {
  ip: string;
  status: string;
  stats: PNodeStats;
  version?: string;
}

/* -------------------------------------------------- */
/*                 TOOLTIP CUSTOM                     */
/* -------------------------------------------------- */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0E27] border border-[#00D4AA] rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-white font-bold mb-1 text-xs uppercase tracking-wider">
          {label || payload[0]?.name}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-gray-300 font-medium">{entry.name}:</span>
            <span className="font-mono font-bold text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/* -------------------------------------------------- */
/*                MAIN COMPONENT                       */
/* -------------------------------------------------- */

export default function Home() {
  const [pnodes, setPnodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  /* -------------------------------------------------- */
  /*               DATA FETCHING                        */
  /* -------------------------------------------------- */

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      const response = await fetch("/api/pnodes");
      const data = await response.json();
      if (Array.isArray(data)) {
        setPnodes(data);
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading pnodes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => loadData(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* -------------------------------------------------- */
  /*                   HELPERS                          */
  /* -------------------------------------------------- */

  const getTimeAgo = () => {
    if (!lastUpdate) return "";
    const seconds = Math.floor((currentTime - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const formatBytes = (bytes: number) =>
    bytes > 0 ? (bytes / 1_000_000_000).toFixed(0) + " GB" : "-";

  const formatUptime = (seconds: number) =>
    seconds > 0 ? Math.floor(seconds / 3600) + " h" : "-";

  const getHealthStatus = (pnode: PNode) => {
    if (pnode.status === "gossip_only" || !pnode.stats || pnode.stats.uptime === 0)
      return "Private";

    const cpu = pnode.stats.cpu_percent;
    const hours = pnode.stats.uptime / 3600;

    if (cpu >= 90) return "Critical";
    if (hours < 1) return "Warning";
    if (cpu >= 70) return "Warning";
    if (cpu < 20 && hours >= 24) return "Excellent";
    return "Good";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "Excellent":
        return "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40";
      case "Good":
        return "bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40";
      case "Warning":
        return "bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40";
      case "Critical":
        return "bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40";
      default:
        return "bg-[#64748B]/20 text-[#64748B] border-[#64748B]/40";
    }
  };

  /* -------------------------------------------------- */
  /*                     SORTING                        */
  /* -------------------------------------------------- */

  const handleSort = (key: SortKey | string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key as SortKey);
      setSortDirection("asc");
    }
  };

  const getSortValue = (pnode: PNode, key: SortKey) => {
    switch (key) {
      case "ip":
        return pnode.ip;
      case "cpu":
        return pnode.stats?.cpu_percent ?? 0;
      case "ram":
        return pnode.stats?.ram_used ?? 0;
      case "storage":
        return pnode.stats?.file_size ?? 0;
      case "uptime":
        return pnode.stats?.uptime ?? 0;
      case "packets":
        return (pnode.stats?.packets_sent ?? 0) + (pnode.stats?.packets_received ?? 0);
      case "health": {
        const status = getHealthStatus(pnode);
        const healthOrder = {
          Critical: 0,
          Warning: 1,
          Private: 2,
          Good: 3,
          Excellent: 4,
        };
        return healthOrder[status as keyof typeof healthOrder] ?? 0;
      }
      default:
        return 0;
    }
  };

  /* -------------------------------------------------- */
  /*               FILTER + SORT FINAL                  */
  /* -------------------------------------------------- */

  const filteredAndSortedPNodes = useMemo(() => {
    return pnodes
      .filter((pnode) => {
        const matchesSearch = pnode.ip
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesPublicFilter = showPublicOnly
          ? getHealthStatus(pnode) !== "Private"
          : true;
        return matchesSearch && matchesPublicFilter;
      })
      .sort((a, b) => {
        const aValue = getSortValue(a, sortKey);
        const bValue = getSortValue(b, sortKey);
        if (aValue === bValue) return 0;
        if (sortDirection === "asc") return aValue > bValue ? 1 : -1;
        return aValue < bValue ? 1 : -1;
      });
  }, [pnodes, searchTerm, showPublicOnly, sortKey, sortDirection]);

  /* -------------------------------------------------- */
  /*                     ALERTS                         */
  /* -------------------------------------------------- */

  const alerts = useMemo(() => {
    const generated: {
      type: string;
      message: string;
      ip: string;
      severity: "critical" | "warning" | "info";
    }[] = [];

    pnodes.forEach((p) => {
      const status = getHealthStatus(p);
      const cpu = p.stats?.cpu_percent ?? 0;

      if (status === "Critical") {
        if (cpu >= 90) {
          generated.push({
            type: "CPU Overload",
            message: `Load at ${cpu.toFixed(1)}%`,
            ip: p.ip,
            severity: "critical",
          });
        } else {
          generated.push({
            type: "Instability",
            message: "Active but unstable",
            ip: p.ip,
            severity: "critical",
          });
        }
      } else if (status === "Warning") {
        generated.push({
          type: "High Load",
          message: `CPU at ${cpu.toFixed(1)}%`,
          ip: p.ip,
          severity: "warning",
        });
      }
    });

    return generated;
  }, [pnodes]);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;

  const activeNodes = pnodes.filter((p) => getHealthStatus(p) !== "Private");

  /* -------------------------------------------------- */
  /*                 DISTRIBUTIONS                      */
  /* -------------------------------------------------- */

  const cpuDistribution = useMemo(() => [
    {
      range: "Idle",
      count: activeNodes.filter((p) => p.stats.cpu_percent < 20).length,
      color: "#10B981",
    },
    {
      range: "Normal",
      count: activeNodes.filter(
        (p) =>
          p.stats.cpu_percent >= 20 && p.stats.cpu_percent < 70
      ).length,
      color: "#00D4AA",
    },
    {
      range: "Load",
      count: activeNodes.filter((p) => p.stats.cpu_percent >= 70).length,
      color: "#F59E0B",
    },
  ], [activeNodes]);

  const healthDistribution = useMemo(() => [
    {
      name: "Excellent",
      value: pnodes.filter((p) => getHealthStatus(p) === "Excellent").length,
      color: "#10B981",
    },
    {
      name: "Good",
      value: pnodes.filter((p) => getHealthStatus(p) === "Good").length,
      color: "#3B82F6",
    },
    {
      name: "Warning",
      value: pnodes.filter((p) => getHealthStatus(p) === "Warning").length,
      color: "#F59E0B",
    },
    {
      name: "Critical",
      value: pnodes.filter((p) => getHealthStatus(p) === "Critical").length,
      color: "#EF4444",
    },
    {
      name: "Private",
      value: pnodes.filter((p) => getHealthStatus(p) === "Private").length,
      color: "#64748B",
    },
  ].filter((i) => i.value > 0), [pnodes]);

  const versionData = useMemo(() => {
    const counts: Record<string, number> = {};

    pnodes.forEach((p) => {
      const v =
        p.version && p.version !== "unknown"
          ? p.version
          : getHealthStatus(p) === "Private"
            ? "Hidden"
            : "v0.6.0";

      counts[v] = (counts[v] || 0) + 1;
    });

    return Object.keys(counts).map((k) => ({
      name: k,
      value: counts[k],
      color: k === "Hidden" ? "#64748B" : "#00D4AA",
    }));
  }, [pnodes]);

  /* -------------------------------------------------- */
  /*           COMPUTED VALUES & COUNTS                 */
  /* -------------------------------------------------- */

  const publicCount = activeNodes.length;
  const privateCount = pnodes.filter(
    (p) => getHealthStatus(p) === "Private"
  ).length;

  const { healthCounts, healthPercent } = useMemo(() => {
    const counts = {
      excellent: pnodes.filter((p) => getHealthStatus(p) === "Excellent").length,
      good: pnodes.filter((p) => getHealthStatus(p) === "Good").length,
      warning: pnodes.filter((p) => getHealthStatus(p) === "Warning").length,
      critical: pnodes.filter((p) => getHealthStatus(p) === "Critical").length,
    };

    const totalActive = counts.excellent + counts.good + counts.warning + counts.critical;

    const percent = {
      excellent: totalActive > 0 ? Math.round((counts.excellent / totalActive) * 100) : 0,
      good: totalActive > 0 ? Math.round((counts.good / totalActive) * 100) : 0,
      warning: totalActive > 0 ? Math.round((counts.warning / totalActive) * 100) : 0,
      critical: totalActive > 0 ? Math.round((counts.critical / totalActive) * 100) : 0,
    };

    return { healthCounts: counts, healthPercent: percent };
  }, [pnodes]);

  const refreshData = () => loadData(true);

  /* -------------------------------------------------- */
  /*                     RENDER                         */
  /* -------------------------------------------------- */

  return (
    <main className="min-h-screen bg-[#0A0E27] text-white pb-20">
      {/* HERO */}
      <header className="relative border-b border-[#2D3454] overflow-hidden">
        {/* Aurora Background Animé */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#7B3FF2] via-[#00D4AA] to-[#7B3FF2] bg-[length:200%_100%] animate-aurora"></div>

        {/* Overlay pour texte lisible */}
        <div className="absolute inset-0 bg-[#0A0E27]/20 backdrop-blur-sm"></div>

        {/* Contenu */}
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Xandeum P-Node Analytics
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Alerts */}
              <button
                onClick={() => setIsAlertOpen(true)}
                className="relative px-4 py-2 rounded-lg border border-[#2D3454] bg-[#1A1F3A] hover:bg-[#232a4a] text-xs uppercase font-semibold tracking-wide flex items-center gap-2"
              >
                Alerts
                {criticalCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-[#EF4444]/20 text-[#FCA5A5] text-[10px] font-mono">
                    {criticalCount} CRIT
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ALERT PANEL MODAL */}
      {isAlertOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsAlertOpen(false)}
        >
          <div
            className="bg-[#0A0E27] border border-[#2D3454] rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-[#2D3454] p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">System Alerts</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {alerts.length} alert{alerts.length !== 1 ? "s" : ""} detected
                  {criticalCount > 0 && (
                    <span className="ml-2 text-[#EF4444] font-semibold">
                      ({criticalCount} critical)
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsAlertOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {alerts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#10B981]/20 mb-4">
                    <svg
                      className="w-8 h-8 text-[#10B981]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-[#10B981] text-lg font-semibold">
                    ✓ All Systems Healthy
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    No alerts to display
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#2D3454]">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-5 hover:bg-[#1A1F3A] transition-colors cursor-pointer ${alert.severity === "critical"
                        ? "border-l-4 border-[#EF4444]"
                        : alert.severity === "warning"
                          ? "border-l-4 border-[#F59E0B]"
                          : "border-l-4 border-[#3B82F6]"
                        }`}
                      onClick={() => {
                        setIsAlertOpen(false);
                        window.location.href = `/pnode/${alert.ip}`;
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${alert.severity === "critical"
                            ? "bg-[#EF4444]/20 text-[#EF4444]"
                            : alert.severity === "warning"
                              ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                              : "bg-[#3B82F6]/20 text-[#3B82F6]"
                            }`}
                        >
                          {alert.type}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {alert.ip}
                        </span>
                      </div>
                      <p className="text-sm text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Click to view node details →
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[#2D3454] p-4 bg-[#0A0E27]">
              <button
                onClick={() => setIsAlertOpen(false)}
                className="w-full px-4 py-2 bg-[#1A1F3A] hover:bg-[#232a4a] border border-[#2D3454] rounded-lg text-sm font-semibold text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* KPI + HEALTH + CHARTS */}
      <section className="max-w-7xl mx-auto px-6 mt-6 space-y-6">
        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Public Nodes */}
          <div className="relative bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md overflow-hidden group hover:border-[#00D4AA]/50 transition-all">
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#00D4AA]/10 flex items-center justify-center group-hover:bg-[#00D4AA]/20 transition-all">
              <Radio className="w-5 h-5 text-[#00D4AA]" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#00D4AA]/5 rounded-full blur-3xl group-hover:bg-[#00D4AA]/10 transition-all" />
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">
              Public Nodes
            </p>
            <p className="text-4xl font-bold text-[#00D4AA] relative z-10">{publicCount}</p>
          </div>

          {/* Private Nodes */}
          <div className="relative bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md overflow-hidden group hover:border-[#EF4444]/50 transition-all">
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#EF4444]/10 flex items-center justify-center group-hover:bg-[#EF4444]/20 transition-all">
              <ShieldCheck className="w-5 h-5 text-[#EF4444]" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#EF4444]/5 rounded-full blur-3xl group-hover:bg-[#EF4444]/10 transition-all" />
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">
              Private Nodes
            </p>
            <p className="text-4xl font-bold text-[#EF4444] relative z-10">{privateCount}</p>
          </div>

          {/* Total Nodes */}
          <div className="relative bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md overflow-hidden group hover:border-[#7B3FF2]/50 transition-all">
            <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#7B3FF2]/10 flex items-center justify-center group-hover:bg-[#7B3FF2]/20 transition-all">
              <Network className="w-5 h-5 text-[#7B3FF2]" strokeWidth={2.5} />
            </div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#7B3FF2]/5 rounded-full blur-3xl group-hover:bg-[#7B3FF2]/10 transition-all" />
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">
              Total Nodes
            </p>
            <p className="text-4xl font-bold text-[#7B3FF2] relative z-10">{pnodes.length}</p>
          </div>
        </div>

        {/* HEALTH DISTRIBUTION */}
        <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-white">
              Health Distribution
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">
              Public nodes only
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Excellent */}
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Excellent
              </span>
              <div className="w-full bg-[#111827] rounded-full overflow-hidden mt-1 h-2 border border-[#374151]">
                <div
                  className="h-full bg-[#10B981]"
                  style={{ width: `${healthPercent.excellent}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 mt-1 inline-block">
                {healthPercent.excellent}%
              </span>
            </div>

            {/* Good */}
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Good
              </span>
              <div className="w-full bg-[#111827] rounded-full overflow-hidden mt-1 h-2 border border-[#374151]">
                <div
                  className="h-full bg-[#3B82F6]"
                  style={{ width: `${healthPercent.good}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 mt-1 inline-block">
                {healthPercent.good}%
              </span>
            </div>

            {/* Warning */}
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Warning
              </span>
              <div className="w-full bg-[#111827] rounded-full overflow-hidden mt-1 h-2 border border-[#374151]">
                <div
                  className="h-full bg-[#F59E0B]"
                  style={{ width: `${healthPercent.warning}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 mt-1 inline-block">
                {healthPercent.warning}%
              </span>
            </div>

            {/* Critical */}
            <div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Critical
              </span>
              <div className="w-full bg-[#111827] rounded-full overflow-hidden mt-1 h-2 border border-[#374151]">
                <div
                  className="h-full bg-[#EF4444]"
                  style={{ width: `${healthPercent.critical}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 mt-1 inline-block">
                {healthPercent.critical}%
              </span>
            </div>
          </div>
        </div>

        {/* CHARTS ROW 1x4 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* CPU LOAD */}
          <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-[#10B981]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold">CPU Load</h3>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cpuDistribution} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
                  <XAxis dataKey="range" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {cpuDistribution.map((item, idx) => (
                      <Cell key={idx} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* STORAGE DISTRIBUTION */}
          <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[#7B3FF2]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold">Storage</h3>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
                  data={[
                    {
                      range: "0-50",
                      count: activeNodes.filter((p) => p.stats.file_size < 50_000_000_000).length,
                    },
                    {
                      range: "50-100",
                      count: activeNodes.filter(
                        (p) => p.stats.file_size >= 50_000_000_000 && p.stats.file_size < 100_000_000_000
                      ).length,
                    },
                    {
                      range: "100-200",
                      count: activeNodes.filter(
                        (p) => p.stats.file_size >= 100_000_000_000 && p.stats.file_size < 200_000_000_000
                      ).length,
                    },
                    {
                      range: ">200",
                      count: activeNodes.filter((p) => p.stats.file_size >= 200_000_000_000).length,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3454" />
                  <XAxis dataKey="range" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#7B3FF2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* VERSIONS - DONUT */}
          <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-[#00D4AA]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold">Versions</h3>
            </div>
            <div className="h-[180px] relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={versionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {versionData.map((item, idx) => (
                      <Cell
                        key={idx}
                        fill={item.color}
                        stroke="#0A0E27"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Nombre total au centre */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{pnodes.length}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
                </div>
              </div>
            </div>
            {/* Légende fixe */}
            <div className="space-y-2">
              {versionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HEALTH - DONUT */}
          <div className="bg-[#1A1F3A] border border-[#2D3454] rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#10B981]" strokeWidth={2.5} />
              <h3 className="text-xs font-semibold">Health</h3>
            </div>
            <div className="h-[180px] relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {healthDistribution.map((item, idx) => (
                      <Cell
                        key={idx}
                        fill={item.color}
                        stroke="#0A0E27"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Nombre total au centre */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{activeNodes.length}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Active</p>
                </div>
              </div>
            </div>
            {/* Légende fixe */}
            <div className="space-y-2">
              {healthDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TOOLBAR */}
      <section className="max-w-7xl mx-auto px-6 mt-6 mb-6">
        <div className="w-full bg-[#1A1F3A] border border-[#2D3454] rounded-xl px-5 py-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          {/* LEFT: search + filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              placeholder="Search IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-[#0A0E27] border border-[#2D3454] rounded-lg text-sm focus:outline-none focus:border-[#00D4AA] text-gray-100 w-64"
            />

            <button
              onClick={() => setShowPublicOnly(!showPublicOnly)}
              className={`px-4 py-2 rounded-lg text-xs uppercase font-semibold border border-[#2D3454] transition-colors ${showPublicOnly
                ? "bg-[#00D4AA] text-black"
                : "bg-[#0A0E27] text-gray-200 hover:bg-[#111827]"
                }`}
            >
              {showPublicOnly ? "Public Only: ON" : "Public Only: OFF"}
            </button>
          </div>

          {/* RIGHT: view modes + refresh + last update */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg text-xs uppercase font-semibold border border-[#2D3454] transition-colors ${viewMode === "table"
                  ? "bg-[#00D4AA] text-black"
                  : "bg-[#0A0E27] text-gray-200 hover:bg-[#111827]"
                  }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-lg text-xs uppercase font-semibold border border-[#2D3454] transition-colors ${viewMode === "grid"
                  ? "bg-[#00D4AA] text-black"
                  : "bg-[#0A0E27] text-gray-200 hover:bg-[#111827]"
                  }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`px-4 py-2 rounded-lg text-xs uppercase font-semibold border border-[#2D3454] transition-colors ${viewMode === "map"
                  ? "bg-[#00D4AA] text-black"
                  : "bg-[#0A0E27] text-gray-200 hover:bg-[#111827]"
                  }`}
              >
                Map
              </button>
            </div>

            <button
              onClick={refreshData}
              className="px-4 py-2 rounded-lg text-xs uppercase font-semibold border border-[#2D3454] bg-[#0A0E27] text-gray-100 hover:bg-[#111827] flex items-center gap-2"
            >
              {refreshing && (
                <span className="w-3 h-3 border-2 border-[#00D4AA] border-t-transparent rounded-full animate-spin" />
              )}
              Refresh Now
            </button>

            <span className="text-[10px] text-gray-400 font-mono tracking-tight">
              Last update: {getTimeAgo() || "—"}
            </span>
          </div>
        </div>
      </section>

      {/* CONTENT (TABLE / GRID / MAP) */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="text-center py-32">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00D4AA]" />
            <p className="text-gray-400 mt-6 text-lg animate-pulse">
              Scanning Xandeum Network...
            </p>
          </div>
        ) : filteredAndSortedPNodes.length === 0 ? (
          <div className="text-center py-20 bg-[#1A1F3A] rounded-xl border border-[#2D3454]">
            <p className="text-gray-300">No pNodes match your filters.</p>
          </div>
        ) : (
          <>
            {viewMode === "map" && (
              <NodesMap nodes={filteredAndSortedPNodes as any} />
            )}

            {viewMode === "table" && (
              <PNodeTable
                data={filteredAndSortedPNodes as any}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedPNodes.map((pnode) => {
                  const status = getHealthStatus(pnode);
                  let borderColor = "border-[#4B5563]";
                  if (status === "Excellent") borderColor = "border-[#10B981]";
                  else if (status === "Good") borderColor = "border-[#3B82F6]";
                  else if (status === "Warning") borderColor = "border-[#F59E0B]";
                  else if (status === "Critical") borderColor = "border-[#EF4444]";

                  return (
                    <div
                      key={pnode.ip}
                      onClick={() =>
                        (window.location.href = `/pnode/${pnode.ip}`)
                      }
                      className={`bg-[#1A1F3A] p-5 rounded-xl border-l-4 ${borderColor} border border-[#2D3454] hover:shadow-xl cursor-pointer transition-all hover:-translate-y-1`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h2 className="font-mono font-bold text-white text-lg">
                          {pnode.ip}
                        </h2>
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadge(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#111827] p-2 rounded">
                          <p className="text-gray-400 text-xs">CPU</p>
                          <p className="font-bold text-white">
                            {pnode.stats.cpu_percent.toFixed(1)}%
                          </p>
                        </div>

                        <div className="bg-[#111827] p-2 rounded">
                          <p className="text-gray-400 text-xs">RAM</p>
                          <p className="font-bold text-white">
                            {formatBytes(pnode.stats.ram_used)}
                          </p>
                        </div>

                        <div className="bg-[#111827] p-2 rounded">
                          <p className="text-gray-400 text-xs">Disk</p>
                          <p className="font-bold text-[#7B3FF2]">
                            {formatBytes(pnode.stats.file_size)}
                          </p>
                        </div>

                        <div className="bg-[#111827] p-2 rounded">
                          <p className="text-gray-400 text-xs">Uptime</p>
                          <p className="font-bold text-white">
                            {formatUptime(pnode.stats.uptime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#2D3454] bg-[#050816] p-8 mt-auto w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">
              Built for{" "}
              <span className="text-[#00D4AA] font-semibold">Xandeum</span> •
              Superteam Earn Bounty
            </p>
            <p className="text-gray-500 text-xs">Powered by pRPC</p>
          </div>

          <div className="flex items-center gap-3 bg-[#0A0E27] px-4 py-2 rounded-full border border-[#2D3454]">
            <img
              src="/avatar-ninja.png"
              alt="Ninja0x"
              className="w-8 h-8 rounded-full"
            />
            <p className="text-gray-300 text-xs">
              Coded with <span className="text-red-400">❤️</span> by{" "}
              <span className="text-[#00D4AA] font-semibold">Ninja0x</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
