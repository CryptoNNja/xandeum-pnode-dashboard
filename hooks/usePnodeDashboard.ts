
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from 'use-debounce';
import { supabase } from "@/lib/supabase";
import type { PNode } from "@/lib/types";
import { getHealthStatus, type HealthStatus } from "@/lib/health";
import { calculateNodeScore } from "@/lib/scoring";
import { computeVersionOverview } from "@/lib/kpi";

export type ViewMode = "table" | "grid" | "map";
export type SortKey = "ip" | "cpu" | "ram" | "storage" | "uptime" | "health" | "packets";
export type SortDirection = "asc" | "desc";
export type NodeFilter = "all" | "public" | "private";
export type HealthFilter = "all" | "public" | "private";
export type AlertSeverity = "critical" | "warning";
export type AutoRefreshOption = "off" | "30s" | "1m" | "5m";

type HealthTrendKey = "excellent" | "good" | "warning" | "critical";

const createEmptyDistribution = (): Record<HealthTrendKey, number> => ({
  excellent: 0,
  good: 0,
  warning: 0,
  critical: 0,
});

export const usePnodeDashboard = () => {
  const [pnodes, setPnodes] = useState<PNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>("all");
  
  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Other state
  const [autoRefreshOption, setAutoRefreshOption] = useState<AutoRefreshOption>("1m");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [healthDelta, setHealthDelta] = useState<Record<HealthTrendKey, number>>(createEmptyDistribution());
  const [networkHealthHistory, setNetworkHealthHistory] = useState<number[]>([]);

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      params.set("sortBy", sortKey);
      params.set("sortDir", sortDirection);
      if (debouncedSearchTerm) params.set("query", debouncedSearchTerm);
      if (nodeFilter !== 'all') params.set("status", nodeFilter);
      
      const response = await fetch(`/api/pnodes?${params.toString()}`, { cache: "no-store" });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pnodes (${response.status})`);
      }

      const payload = await response.json();
      
      if (payload.data && Array.isArray(payload.data) && payload.pagination) {
        setPnodes(payload.data);
        setTotal(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("Error loading pnodes:", error);
    } finally {
      setLoading(false);
      if (isManual) {
        setRefreshing(false);
      }
    }
  }, [page, limit, sortKey, sortDirection, debouncedSearchTerm, nodeFilter]);

  // Real-time subscription
  useEffect(() => {
    // Initial fetch
    loadData();

    const channel = supabase
        .channel('pnodes-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'pnodes'
            },
            (payload) => {
                console.log('Change received!', payload);
                const newNode = payload.new as PNode;
                
                // If it's an insert or update, update the state
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    setPnodes(currentPnodes => {
                        const nodeIndex = currentPnodes.findIndex(p => p.ip === newNode.ip);
                        if (nodeIndex !== -1) {
                            // Update existing node
                            const newPnodes = [...currentPnodes];
                            newPnodes[nodeIndex] = newNode;
                            return newPnodes;
                        } else {
                            // Add new node (and re-sort/re-filter on next render, or just refetch)
                            // For simplicity, we can just refetch the whole list.
                            // A more advanced implementation would handle adding/sorting in place.
                            loadData();
                            return currentPnodes; 
                        }
                    });
                } else if (payload.eventType === 'DELETE') {
                    setPnodes(currentPnodes => currentPnodes.filter(p => p.ip !== payload.old.ip));
                }

                setLastUpdate(new Date());
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [supabase, loadData]);
  
  // This is a fallback polling mechanism in case the real-time connection fails.
  useEffect(() => {
    const ms =
      autoRefreshOption === "off"
        ? 0
        : autoRefreshOption === "30s"
          ? 30_000
          : autoRefreshOption === "1m"
            ? 60_000
            : 300_000;
    if (ms <= 0) return; // Realtime is preferred
    const interval = setInterval(() => loadData(true), ms);
    return () => clearInterval(interval);
  }, [autoRefreshOption, loadData]);



  const handleSort = useCallback(
    (key: SortKey | string) => {
      if (sortKey === key) {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key as SortKey);
        setSortDirection("desc");
      }
      setPage(1); // Reset to first page on sort
    },
    [sortKey]
  );
  
  // All the expensive calculations are now performed on the frontend based on the paginated data.
  // In a more advanced setup, some of these could be pre-calculated by the backend/database.
  const activeNodes = useMemo(() => pnodes.filter((pnode) => pnode.status === "active"), [pnodes]);
  const publicCount = activeNodes.length;
  const privateCount = useMemo(() => pnodes.filter((pnode) => pnode.status === "gossip_only").length, [pnodes]);
  
  const alerts = useMemo(() => {
    const generated: { type: string; message: string; ip: string; severity: AlertSeverity }[] = [];
    pnodes.forEach((pnode) => {
        if (pnode.status !== "active") return;
        const stats = pnode.stats;
        if (!stats) return;

        const cpuPercent = Number.isFinite(stats.cpu_percent) ? stats.cpu_percent : 0;
        if (cpuPercent >= 90) generated.push({ ip: pnode.ip, severity: "critical", type: "CPU Overload", message: `Load at ${cpuPercent.toFixed(1)}%` });
        else if (cpuPercent >= 75) generated.push({ ip: pnode.ip, severity: "warning", type: "CPU Pressure", message: `Load at ${cpuPercent.toFixed(1)}%` });

        const ramTotal = Number.isFinite(stats.ram_total) ? stats.ram_total : 0;
        const ramUsed = Number.isFinite(stats.ram_used) ? stats.ram_used : 0;
        if (ramTotal > 0) {
            const ramPercent = (ramUsed / ramTotal) * 100;
            if (ramPercent >= 90) generated.push({ ip: pnode.ip, severity: "critical", type: "RAM Saturation", message: `${ramPercent.toFixed(1)}% utilized` });
            else if (ramPercent >= 75) generated.push({ ip: pnode.ip, severity: "warning", type: "RAM Pressure", message: `${ramPercent.toFixed(1)}% utilized` });
        }

        const committedBytes = Number.isFinite(stats.file_size) ? (stats.file_size ?? 0) : 0;
        const usedBytes = Number.isFinite(stats.total_bytes) ? (stats.total_bytes ?? 0) : 0;
        if (committedBytes > 0) {
            const storagePercent = (usedBytes / committedBytes) * 100;
            if (storagePercent >= 95) generated.push({ ip: pnode.ip, severity: "critical", type: "Storage Full", message: `${storagePercent.toFixed(1)}% utilized` });
            else if (storagePercent >= 80) generated.push({ ip: pnode.ip, severity: "warning", type: "Storage High", message: `${storagePercent.toFixed(1)}% utilized` });
        }

        const performanceScore = calculateNodeScore(pnode);
        if (performanceScore > 0) {
            if (performanceScore < 50) generated.push({ ip: pnode.ip, severity: "critical", type: "Low Performance Score", message: `Score ${performanceScore}/100` });
            else if (performanceScore < 70) generated.push({ ip: pnode.ip, severity: "warning", type: "Degraded Performance", message: `Score ${performanceScore}/100` });
        }
    });
    return generated;
  }, [pnodes]);

  const criticalCount = useMemo(() => new Set(alerts.filter((a) => a.severity === "critical").map((a) => a.ip)).size, [alerts]);
  const warningCount = useMemo(() => new Set(alerts.filter((a) => a.severity === "warning").map((a) => a.ip)).size, [alerts]);

  const networkHealthScore = useMemo(() => {
    if (activeNodes.length === 0) return 0;
    const totalScore = activeNodes.reduce((sum, p) => sum + calculateNodeScore(p), 0);
    return Math.round(totalScore / activeNodes.length);
  }, [activeNodes]);

  useEffect(() => {
    if (activeNodes.length === 0 || !lastUpdate) return;
    setNetworkHealthHistory((prev) => [...prev, networkHealthScore].slice(-24));
  }, [activeNodes.length, networkHealthScore, lastUpdate]);

  const versionOverview = useMemo(() => computeVersionOverview(pnodes), [pnodes]);

  const refreshData = useCallback(() => loadData(true), [loadData]);

  const exportRows = useMemo(() => {
    return pnodes.map((pnode) => {
      const stats = pnode.stats ?? ({} as PNode["stats"]);
      return {
        ip: pnode.ip,
        visibility: pnode.status,
        health: getHealthStatus(pnode),
        version: pnode.version ?? "",
        cpu_percent: stats.cpu_percent ?? null,
        ram_used: stats.ram_used ?? null,
        ram_total: stats.ram_total ?? null,
        file_size: stats.file_size ?? null,
        total_bytes: stats.total_bytes ?? null,
        uptime: stats.uptime ?? null,
        packets_sent: stats.packets_sent ?? null,
        packets_received: stats.packets_received ?? null,
      };
    });
  }, [pnodes]);

  return {
    // State
    pnodes,
    loading,
    refreshing,
    viewMode,
    searchTerm,
    sortKey,
    sortDirection,
    nodeFilter,
    autoRefreshOption,
    lastUpdate,
    healthFilter,
    healthDelta,
    networkHealthHistory,

    // Pagination State
    page,
    limit,
    total,
    totalPages,

    // Setters
    setViewMode,
    setSearchTerm,
    setSortKey,
    setSortDirection,
    setNodeFilter,
    setAutoRefreshOption,
    setHealthFilter,
    setHealthDelta,
    setPage,
    setLimit,

    // Callbacks
    handleSort,
    refreshData,

    // Derived State
    activeNodes,
    publicCount,
    privateCount,
    filteredAndSortedPNodes: pnodes, // The API now returns pre-sorted and filtered data.
    alerts,
    criticalCount,
    warningCount,
    networkHealthScore,
    versionOverview,
    exportRows
  };
};
