"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from 'use-debounce';
import { supabase } from "@/lib/supabase";
import type { PNode } from "@/lib/types";
import { getHealthStatus } from "@/lib/health";
import { calculateNodeScore } from "@/lib/scoring";
import { computeVersionOverview } from "@/lib/kpi";
import { calculateNetworkSyncMetrics, fetchNetworkParticipation, type NetworkParticipationMetrics } from "@/lib/blockchain-metrics";
import { useToast } from "@/components/common/Toast";
import { 
  GB_IN_BYTES, 
  TB_IN_BYTES, 
  STORAGE_BUCKETS, 
  getStatusColors, 
  getCpuBuckets,
  getNetworkHealthColor,
  getNetworkUptimeVisuals,
  getStorageBarColors,
  hexToRgba
} from "@/lib/utils";

export type ViewMode = "table" | "grid" | "map";
export type SortKey = "ip" | "cpu" | "ram" | "storage" | "uptime" | "health" | "packets" | "active_streams" | "total_pages" | "score" | "version";
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

export type Alert = {
  ip: string;
  type: string;
  severity: "critical" | "warning";
  message: string;
  value: string;
};

export const usePnodeDashboard = (theme?: string) => {
  const toast = useToast();
  const [allPnodes, setAllPnodes] = useState<(PNode & { _score: number; _healthStatus: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  
  // Search and Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [nodeFilter, setNodeFilter] = useState<NodeFilter>("all");
  
  // Advanced Filters
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [selectedHealthStatuses, setSelectedHealthStatuses] = useState<string[]>([]);
  const [minCpu, setMinCpu] = useState<number>(0);
  const [minStorage, setMinStorage] = useState<number>(0); // 0-100 for non-linear scale

  // Max storage in the network for auto-calibration
  const maxStorageBytes = useMemo(() => {
    if (allPnodes.length === 0) return 10 * TB_IN_BYTES;
    const max = Math.max(...allPnodes.map(p => p.stats?.storage_committed ?? 0));
    return Math.max(max, TB_IN_BYTES); // At least 1TB for scale
  }, [allPnodes]);

  // Convert 0-100 slider value to actual bytes (non-linear)
  // 0-50 maps to 0-1TB, 50-100 maps to 1TB-Max
  const sliderToBytes = useCallback((val: number) => {
    if (val === 0) return 0;
    if (val <= 50) {
      return (val / 50) * TB_IN_BYTES;
    }
    const ratio = (val - 50) / 50;
    return TB_IN_BYTES + ratio * (maxStorageBytes - TB_IN_BYTES);
  }, [maxStorageBytes]);

  const currentMinStorageBytes = useMemo(() => sliderToBytes(minStorage), [minStorage, sliderToBytes]);
  const [debouncedMinCpu] = useDebounce(minCpu, 150);
  const [debouncedMinStorageBytes] = useDebounce(currentMinStorageBytes, 150);

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Grid View Settings
  const [gridLimit, setGridLimit] = useState<number>(25); // 25, 50, 100, 200, or -1 for all

  // Other state
  const [autoRefreshOption, setAutoRefreshOption] = useState<AutoRefreshOption>("1m");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [networkHealthHistory, setNetworkHealthHistory] = useState<number[]>([]);

  // Historical scores
  const [yesterdayScore, setYesterdayScore] = useState<number | null>(null);
  const [lastWeekScore, setLastWeekScore] = useState<number | null>(null);
  
  // Network participation from credits API
  const [networkParticipation, setNetworkParticipation] = useState<NetworkParticipationMetrics | null>(null);

  // Network metadata (gossip discovery stats)
  const [networkMetadata, setNetworkMetadata] = useState<{
    networkTotal: number;
    crawledNodes: number;
    activeNodes: number;
    coveragePercent: number;
    lastUpdated: string | null;
  }>({
    networkTotal: 0,
    crawledNodes: 0,
    activeNodes: 0,
    coveragePercent: 0,
    lastUpdated: null
  });

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);

    try {
      // Fetch all nodes for accurate global KPIs and easy filtering/sorting
      // Add retry logic for transient Supabase errors (502, 503, 504, 500)
      let response: Response | undefined;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        // Add timeout to prevent hanging requests (30s max)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        try {
          response = await fetch(`/api/pnodes?limit=1000`, {
            cache: "no-store",
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // Handle timeout or network errors
          if (fetchError.name === 'AbortError') {
            console.log(`Request timeout (30s), retrying... (attempt ${attempts + 1}/${maxAttempts})`);
          } else {
            console.log(`Network error: ${fetchError.message}, retrying... (attempt ${attempts + 1}/${maxAttempts})`);
          }

          if (attempts < maxAttempts - 1) {
            attempts++;
            const delay = Math.min(1000 * Math.pow(2, attempts), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error(`Failed to fetch pnodes after ${maxAttempts} attempts: ${fetchError.message}`);
          }
        }

        // Retry on 500/502/503/504 (Supabase/Cloudflare infrastructure errors)
        if (response && (response.status >= 500 && response.status <= 504) && attempts < maxAttempts - 1) {
          attempts++;
          const delay = Math.min(1000 * Math.pow(2, attempts), 5000); // Exponential backoff, max 5s
          console.log(`Supabase error ${response.status}, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch pnodes (${response?.status || 'unknown error'})`);
      }

      const payload = await response.json();
      
      if (payload.data && Array.isArray(payload.data)) {
        // Pre-calculate scores and health status once per load to optimize filtering/sorting performance
        // Pass full node list for accurate version tier detection and health calculation
        const pnodesWithScores = payload.data.map((p: PNode) => {
          const score = calculateNodeScore(p, payload.data); // ✨ Pass network context
          const healthStatus = getHealthStatus(p, payload.data); // ✨ Pass network context for accurate health
          
          return {
            ...p,
            _score: score,
            _healthStatus: healthStatus
          };
        });
        
        setAllPnodes(pnodesWithScores);
        setLastUpdate(new Date());
        if (isManual) {
          toast.success(`Loaded ${payload.data.length} nodes`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load nodes";
      console.error("Error loading pnodes:", error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
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
            () => {
                // For simplicity and correctness of derived states, refetch all on change
                loadData();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [loadData]);
  
  useEffect(() => {
    const ms =
      autoRefreshOption === "off"
        ? 0
        : autoRefreshOption === "30s"
          ? 30_000
          : autoRefreshOption === "1m"
            ? 60_000
            : 300_000;
    if (ms <= 0) return;
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
    },
    [sortKey]
  );

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setNodeFilter("all");
    setSelectedVersions([]);
    setSelectedHealthStatuses([]);
    setMinCpu(0);
    setMinStorage(0);
  }, []);

  const availableVersions = useMemo(() => {
    const versions = new Set<string>();
    allPnodes.forEach(p => {
      if (p.version) versions.add(p.version);
    });
    return Array.from(versions).sort((a, b) => b.localeCompare(a));
  }, [allPnodes]);

  // Fast count for immediate UI feedback in the filters panel
  const quickResultsCount = useMemo(() => {
    let count = 0;
    allPnodes.forEach(p => {
      // Basic visibility
      if (nodeFilter !== "all" && (nodeFilter === "public" ? p.status !== "active" : p.status !== "gossip_only")) return;
      // Versions
      if (selectedVersions.length > 0) {
        const trimmed = p.version?.trim();
        let bucketId = "other";
        if (trimmed && !/^unknown$/i.test(trimmed)) {
          const normalized = trimmed.replace(/^V/, "v").startsWith("v") ? trimmed.replace(/^V/, "v") : `v${trimmed}`;
          const match = normalized.match(/^v(\d+)\.(\d+)/i);
          if (match) bucketId = `v${match[1]}.${match[2]}`;
        }
        if (!selectedVersions.includes(bucketId)) return;
      }
      // Health
      if (selectedHealthStatuses.length > 0 && !selectedHealthStatuses.includes(p._healthStatus)) return;
      // CPU (instant feedback)
      if (minCpu > 0 && (p.stats?.cpu_percent ?? 0) < minCpu) return;
      // Storage (instant feedback using bytes)
      if (minStorage > 0 && (p.stats?.storage_committed ?? 0) < currentMinStorageBytes) return;
      
      count++;
    });
    return count;
  }, [allPnodes, nodeFilter, selectedVersions, selectedHealthStatuses, minCpu, minStorage, currentMinStorageBytes]);
  
  // Filtering and Sorting logic (Frontend)
  const filteredAndSortedPNodes = useMemo(() => {
    let result = [...allPnodes];

    // Enhanced Search filter with multiple field support
    if (debouncedSearchTerm) {
      const q = debouncedSearchTerm.toLowerCase().trim();
      result = result.filter(p => {
        // Basic fields (backward compatible)
        if (p.ip.toLowerCase().includes(q)) return true;
        if (p.version?.toLowerCase().includes(q)) return true;
        if (p.city?.toLowerCase().includes(q)) return true;
        
        // Status with user-friendly aliases
        const status = p.status.toLowerCase();
        if (status.includes(q)) return true;
        if (q === "private" && status === "gossip_only") return true;
        if (q === "public" && status === "active") return true;
        if (q === "gossip" && status === "gossip_only") return true;
        
        // Geographic fields
        if (p.country?.toLowerCase().includes(q)) return true;
        if (p.country_code?.toLowerCase().includes(q)) return true;
        
        // Pubkey search
        if (p.pubkey?.toLowerCase().includes(q)) return true;
        
        // Health status search
        if (p._healthStatus?.toLowerCase().includes(q)) return true;
        
        return false;
      });
    }

    // Visibility filter
    if (nodeFilter !== "all") {
      result = result.filter(p => 
        nodeFilter === "public" ? p.status === "active" : p.status === "gossip_only"
      );
    }

    // Advanced: Versions
    if (selectedVersions.length > 0) {
      result = result.filter(p => {
        const trimmed = p.version?.trim();
        let bucketId = "other";
        if (trimmed && !/^unknown$/i.test(trimmed)) {
          const normalized = trimmed.replace(/^V/, "v").startsWith("v") ? trimmed.replace(/^V/, "v") : `v${trimmed}`;
          const match = normalized.match(/^v(\d+)\.(\d+)/i);
          if (match) bucketId = `v${match[1]}.${match[2]}`;
        }
        return selectedVersions.includes(bucketId);
      });
    }

    // Advanced: Health Status
    if (selectedHealthStatuses.length > 0) {
      result = result.filter(p => selectedHealthStatuses.includes(p._healthStatus));
    }

    // Advanced: Min CPU
    if (debouncedMinCpu > 0) {
      result = result.filter(p => (p.stats?.cpu_percent ?? 0) >= debouncedMinCpu);
    }

    // Advanced: Min Storage (using debounced bytes)
    if (debouncedMinStorageBytes > 0) {
      result = result.filter(p => (p.stats?.storage_committed ?? 0) >= debouncedMinStorageBytes);
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortKey) {
        case "ip":
          // Convert IP to comparable number for proper sorting
          const ipToNumber = (ip: string) => {
            const parts = ip.split('.').map(Number);
            return (parts[0] || 0) * 16777216 + (parts[1] || 0) * 65536 + (parts[2] || 0) * 256 + (parts[3] || 0);
          };
          valA = ipToNumber(a.ip);
          valB = ipToNumber(b.ip);
          break;
        case "cpu": valA = a.stats?.cpu_percent ?? 0; valB = b.stats?.cpu_percent ?? 0; break;
        case "ram": valA = a.stats?.ram_used ?? 0; valB = b.stats?.ram_used ?? 0; break;
        case "storage": valA = a.stats?.storage_committed ?? 0; valB = b.stats?.storage_committed ?? 0; break;
        case "uptime": valA = a.stats?.uptime ?? 0; valB = b.stats?.uptime ?? 0; break;
        case "packets":
          valA = (a.stats?.packets_sent ?? 0) + (a.stats?.packets_received ?? 0);
          valB = (b.stats?.packets_sent ?? 0) + (b.stats?.packets_received ?? 0);
          break;
        case "active_streams":
          valA = a.stats?.active_streams ?? 0;
          valB = b.stats?.active_streams ?? 0;
          break;
        case "total_pages":
          valA = a.stats?.total_pages ?? 0;
          valB = b.stats?.total_pages ?? 0;
          break;
        case "score":
          valA = a._score;
          valB = b._score;
          break;
        case "health":
          // Sort by health status with priority: Excellent > Good > Warning > Critical > Private
          const healthPriority: Record<string, number> = {
            'Excellent': 4,
            'Good': 3,
            'Warning': 2,
            'Critical': 1,
            'Private': 0
          };
          valA = healthPriority[a._healthStatus] ?? -1;
          valB = healthPriority[b._healthStatus] ?? -1;
          break;
        case "version":
          valA = a.version ?? "";
          valB = b.version ?? "";
          break;
        default: valA = a.ip; valB = b.ip;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [allPnodes, debouncedSearchTerm, nodeFilter, selectedVersions, selectedHealthStatuses, debouncedMinCpu, debouncedMinStorageBytes, sortKey, sortDirection]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, nodeFilter, selectedVersions, selectedHealthStatuses, debouncedMinCpu, debouncedMinStorageBytes, sortKey, sortDirection]);

  // Pagination for Table View
  const totalPages = useMemo(() => Math.ceil(filteredAndSortedPNodes.length / pageSize), [filteredAndSortedPNodes.length, pageSize]);

  const paginatedPNodes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedPNodes.slice(startIndex, endIndex);
  }, [filteredAndSortedPNodes, currentPage, pageSize]);

  // Grid View with intelligent limit
  const gridPNodes = useMemo(() => {
    if (gridLimit === -1) {
      // Show all nodes
      return filteredAndSortedPNodes;
    }
    // Show top N nodes by score
    return filteredAndSortedPNodes.slice(0, gridLimit);
  }, [filteredAndSortedPNodes, gridLimit]);

  // Derived global states (always based on allPnodes)
  const activeNodes = useMemo(() => allPnodes.filter((pnode) => pnode.status === "active"), [allPnodes]);
  const publicCount = activeNodes.length;
  const privateCount = useMemo(() => allPnodes.filter((pnode) => pnode.status === "gossip_only").length, [allPnodes]);
  
  // Alert system synchronized with Health Status
  // Generates detailed, actionable alerts based on expert SRE thresholds
  const alerts = useMemo(() => {
    const generated: Alert[] = [];
    
    allPnodes.forEach((pnode) => {
      if (pnode.status !== "active") return;
      const stats = pnode.stats;
      if (!stats) return;

      const healthStatus = pnode._healthStatus;
      
      // Only generate alerts for Warning and Critical nodes
      if (healthStatus !== "Warning" && healthStatus !== "Critical") return;

      // Sanitize metrics
      const cpuPercent = Number.isFinite(stats.cpu_percent) ? stats.cpu_percent : 0;
      const uptimeSeconds = Number.isFinite(stats.uptime) ? stats.uptime : 0;
      const uptimeHours = uptimeSeconds / 3600;
      const ramTotal = Number.isFinite(stats.ram_total) ? stats.ram_total : 0;
      const ramUsed = Number.isFinite(stats.ram_used) ? stats.ram_used : 0;
      const ramPercent = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;
      const committedBytes = Number.isFinite(stats.storage_committed) ? (stats.storage_committed ?? 0) : 0;
      const usedBytes = Number.isFinite(stats.storage_used) ? (stats.storage_used ?? 0) : 0;
      const storagePercent = committedBytes > 0 ? (usedBytes / committedBytes) * 100 : 0;
      const performanceScore = calculateNodeScore(pnode, allPnodes);

      // CRITICAL ALERTS - Immediate action required
      if (healthStatus === "Critical") {
        // Uptime < 5 min = Recent crash/restart
        if (uptimeSeconds < 300) {
          const uptimeMin = Math.floor(uptimeSeconds / 60);
          generated.push({
            ip: pnode.ip,
            severity: "critical",
            type: "Node Crash Detected",
            message: `Node restarted ${uptimeMin}min ago - investigate crash cause`,
            value: `${uptimeMin}min uptime`
          });
        }

        // Storage ≥ 98% = Disk full imminent
        if (storagePercent >= 98) {
          generated.push({
            ip: pnode.ip,
            severity: "critical",
            type: "Storage Critical",
            message: `Disk almost full - data loss imminent, free space NOW`,
            value: `${storagePercent.toFixed(1)}% used`
          });
        }

        // RAM ≥ 98% = OOM kill risk
        if (ramPercent >= 98) {
          generated.push({
            ip: pnode.ip,
            severity: "critical",
            type: "RAM Exhausted",
            message: `Memory exhausted - OOM kill imminent, restart or add RAM`,
            value: `${ramPercent.toFixed(1)}% used`
          });
        }

        // CPU ≥ 98% = Stuck/infinite loop
        if (cpuPercent >= 98) {
          generated.push({
            ip: pnode.ip,
            severity: "critical",
            type: "CPU Stuck",
            message: `CPU at maximum - possible infinite loop or deadlock`,
            value: `${cpuPercent.toFixed(1)}% load`
          });
        }

        // Performance Score < 20 = Multiple failures
        if (performanceScore > 0 && performanceScore < 20) {
          generated.push({
            ip: pnode.ip,
            severity: "critical",
            type: "Multiple Failures",
            message: `Critical performance degradation - multiple subsystems failing`,
            value: `Score: ${performanceScore}/100`
          });
        }
      }

      // WARNING ALERTS - Monitor closely, action needed soon
      if (healthStatus === "Warning") {
        // Uptime < 24h = Recent restart (instability?)
        if (uptimeHours < 24 && uptimeHours >= 0.083) { // 5min to 24h
          generated.push({
            ip: pnode.ip,
            severity: "warning",
            type: "Recent Restart",
            message: `Node restarted ${uptimeHours.toFixed(1)}h ago - monitor for stability`,
            value: `${uptimeHours.toFixed(1)}h uptime`
          });
        }

        // Storage 85-98% = Filling up
        if (storagePercent >= 85 && storagePercent < 98) {
          generated.push({
            ip: pnode.ip,
            severity: "warning",
            type: "Storage Filling",
            message: `Disk space low - cleanup recommended within 7 days`,
            value: `${storagePercent.toFixed(1)}% used`
          });
        }

        // RAM 85-98% = High memory pressure
        if (ramPercent >= 85 && ramPercent < 98) {
          generated.push({
            ip: pnode.ip,
            severity: "warning",
            type: "High Memory Usage",
            message: `Memory pressure high - consider optimizing or adding RAM`,
            value: `${ramPercent.toFixed(1)}% used`
          });
        }

        // CPU 90-98% = High sustained load
        if (cpuPercent >= 90 && cpuPercent < 98) {
          generated.push({
            ip: pnode.ip,
            severity: "warning",
            type: "High CPU Load",
            message: `CPU load sustained high - verify workload is normal`,
            value: `${cpuPercent.toFixed(1)}% load`
          });
        }

        // Performance Score 20-50 = Underperforming
        if (performanceScore > 0 && performanceScore >= 20 && performanceScore < 50) {
          generated.push({
            ip: pnode.ip,
            severity: "warning",
            type: "Degraded Performance",
            message: `Node underperforming - review metrics and optimize`,
            value: `Score: ${performanceScore}/100`
          });
        }
      }
    });

    return generated;
  }, [allPnodes]);

  const criticalCount = useMemo(() => new Set(alerts.filter((a) => a.severity === "critical").map((a) => a.ip)).size, [alerts]);
  const warningCount = useMemo(() => new Set(alerts.filter((a) => a.severity === "warning").map((a) => a.ip)).size, [alerts]);

  const networkHealthScore = useMemo(() => {
    if (activeNodes.length === 0) return 0;
    const totalScore = activeNodes.reduce((sum, p) => sum + calculateNodeScore(p, allPnodes), 0);
    return Math.round(totalScore / activeNodes.length);
  }, [activeNodes, allPnodes]);

  const networkHealthInsights = useMemo(() => {
    const score = networkHealthScore;
    
    // Build sparkline: use historical data if available, otherwise create synthetic trend from yesterday/lastWeek scores
    let sparklineValues: number[];
    if (networkHealthHistory.length > 0) {
      console.log("[NetworkHealth] Using history data:", networkHealthHistory);
      sparklineValues = networkHealthHistory;
    } else if (lastWeekScore !== null && yesterdayScore !== null) {
      console.log("[NetworkHealth] Using week+yesterday:", { lastWeekScore, yesterdayScore, score });
      // Create 7-point trend from last week to today
      sparklineValues = [
        lastWeekScore,
        lastWeekScore + (yesterdayScore - lastWeekScore) * 0.2,
        lastWeekScore + (yesterdayScore - lastWeekScore) * 0.4,
        lastWeekScore + (yesterdayScore - lastWeekScore) * 0.6,
        lastWeekScore + (yesterdayScore - lastWeekScore) * 0.8,
        yesterdayScore,
        score
      ];
    } else if (yesterdayScore !== null) {
      console.log("[NetworkHealth] Using yesterday only:", { yesterdayScore, score });
      // Create 3-point trend from yesterday to today
      sparklineValues = [yesterdayScore, (yesterdayScore + score) / 2, score];
    } else {
      console.log("[NetworkHealth] No historical data, flat line at:", score);
      sparklineValues = [score];
    }

    const deltaYesterday = yesterdayScore !== null
      ? score - yesterdayScore
      : (sparklineValues.length >= 2
        ? sparklineValues[sparklineValues.length - 1] - sparklineValues[sparklineValues.length - 2]
        : 0);

    const deltaLastWeek = lastWeekScore !== null ? score - lastWeekScore : null;

    const color = getNetworkHealthColor(score);
    const svgWidth = 120;
    const svgHeight = 36;
    const sampleCount = Math.max(1, sparklineValues.length);
    
    // Calculate min/max for better scaling (zoom on actual data range)
    const minValue = Math.min(...sparklineValues);
    const maxValue = Math.max(...sparklineValues);
    const valueRange = maxValue - minValue;
    
    // Add padding (10% on each side) for better visualization
    const padding = valueRange * 0.2 || 5; // Minimum 5 points padding
    const scaledMin = Math.max(0, minValue - padding);
    const scaledMax = Math.min(100, maxValue + padding);
    const scaledRange = scaledMax - scaledMin;
    
    const points = sparklineValues
      .map((value, index) => {
        const x = sampleCount === 1 ? svgWidth / 2 : (index / (sampleCount - 1)) * svgWidth;
        // Scale Y based on actual data range, not 0-100
        const normalizedValue = scaledRange > 0 ? (value - scaledMin) / scaledRange : 0.5;
        const y = svgHeight - (normalizedValue * svgHeight);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    const areaPoints = `${points} ${svgWidth},${svgHeight} 0,${svgHeight}`;
    
    console.log("[NetworkHealth] Sparkline values:", sparklineValues, "min:", minValue, "max:", maxValue);
    console.log("[NetworkHealth] SVG points (scaled):", points);

    return {
      score,
      deltaYesterday,
      deltaLastWeek,
      color,
      trendIcon: deltaYesterday > 0 ? "▲" : deltaYesterday < 0 ? "▼" : "→",
      trendColor: deltaYesterday > 0 ? "#10B981" : deltaYesterday < 0 ? "#EF4444" : "#94a3b8",
      trendIconWeek: deltaLastWeek !== null ? (deltaLastWeek > 0 ? "▲" : deltaLastWeek < 0 ? "▼" : "→") : "→",
      trendColorWeek: deltaLastWeek !== null ? (deltaLastWeek > 0 ? "#10B981" : deltaLastWeek < 0 ? "#EF4444" : "#94a3b8") : "#94a3b8",
      svgWidth,
      svgHeight,
      sparklinePoints: points,
      sparklineAreaPoints: areaPoints,
      sparklineFill: hexToRgba(color, 0.15),
    };
  }, [networkHealthScore, networkHealthHistory, yesterdayScore, lastWeekScore, theme]);

  const storageCapacityStats = useMemo(() => {
    let totalCommitted = 0;
    let totalUsed = 0;

    // Storage committed: ALL nodes (even gossip_only)
    // Use storage_committed from get-pods-with-stats API
    allPnodes.forEach((pnode) => {
      const stats = pnode.stats;
      if (!stats) return;
      const committed = stats.storage_committed ?? 0;
      totalCommitted += Number.isFinite(committed) ? committed : 0;
    });

    // Storage used: only ACTIVE nodes
    // IMPORTANT: use total_bytes (from get-stats) for "storage used" because storage_used
    // (from get-pods-with-stats) is often tiny/incomplete. This matches the real disk usage.
    allPnodes.forEach((pnode) => {
      if (pnode.status !== "active") return;
      const stats = pnode.stats;
      if (!stats) return;
      // Prefer total_bytes for actual usage; fallback to storage_used if needed.
      const used = stats.total_bytes ?? stats.storage_used ?? 0;
      totalUsed += Number.isFinite(used) ? used : 0;
    });

    totalCommitted = Math.max(totalCommitted, 0);
    totalUsed = Math.max(Math.min(totalUsed, totalCommitted || totalUsed), 0);
    const available = Math.max(totalCommitted - totalUsed, 0);
    const percent = totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0;
    const percentClamped = Math.min(100, percent);

    // Use decimal formatting (KB=1e3, MB=1e6, etc.) to match AboutPNodes display
    const KB = 1e3;
    const MB = 1e6;
    const GB = 1e9;
    const TB = 1e12;
    
    const formatAdaptive = (bytes: number) => {
      if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
      if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
      if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
      if (bytes >= KB) return `${(bytes / KB).toFixed(2)} KB`;
      return `${bytes} bytes`;
    };

    return {
      totalCommitted,
      totalUsed,
      available,
      percent: percentClamped,
      formattedUsed: formatAdaptive(totalUsed),
      formattedTotal: `${(totalCommitted / TB_IN_BYTES).toFixed(1)} TB`,
      formattedAvailable: formatAdaptive(available),
      availabilityLabel: percentClamped > 80 ? "remaining" : "available",
    };
  }, [allPnodes]);

  const storageBarColors = useMemo(
    () => getStorageBarColors(storageCapacityStats.percent),
    [storageCapacityStats.percent, theme]
  );

  const avgCpuUsage = useMemo(() => {
    const activeCpuNodes = allPnodes.filter((pnode) => pnode.status === "active");
    if (activeCpuNodes.length === 0) return { percent: 0, nodeCount: 0 };
    const totalPercent = activeCpuNodes.reduce((sum, pnode) => sum + Math.max(0, pnode.stats?.cpu_percent ?? 0), 0);
    return { percent: Math.min(100, totalPercent / activeCpuNodes.length), nodeCount: activeCpuNodes.length };
  }, [allPnodes]);

  const avgRamUsage = useMemo(() => {
    const activeRamNodes = allPnodes.filter((pnode) => pnode.status === "active" && (pnode.stats?.ram_total ?? 0) > 0);
    if (activeRamNodes.length === 0) return { usedAvg: 0, totalAvg: 0, ratio: 0, nodeCount: 0 };
    const usedAvg = activeRamNodes.reduce((sum, pnode) => sum + Math.max(0, pnode.stats?.ram_used ?? 0), 0) / activeRamNodes.length;
    const totalAvg = activeRamNodes.reduce((sum, pnode) => sum + Math.max(0, pnode.stats?.ram_total ?? 0), 0) / activeRamNodes.length;
    return { 
      usedAvg, 
      totalAvg, 
      ratio: Math.min(100, (usedAvg / totalAvg) * 100), 
      nodeCount: activeRamNodes.length,
      formattedUsed: `${(usedAvg / GB_IN_BYTES).toFixed(1)} GB`,
      formattedTotal: `${(totalAvg / GB_IN_BYTES).toFixed(1)} GB`
    };
  }, [allPnodes]);

  const networkUptimeStats = useMemo(() => {
    const publicOnline = allPnodes.filter((pnode) => getHealthStatus(pnode, allPnodes) !== "Private" && pnode.status === "active").length;
    const publicTotal = publicCount || 0;
    const percent = publicTotal > 0 ? Number(((publicOnline / publicTotal) * 100).toFixed(1)) : 0;
    return { percent, publicOnline, publicTotal, ...getNetworkUptimeVisuals(percent) };
  }, [allPnodes, publicCount, theme]);

  const storageDistribution = useMemo(() => STORAGE_BUCKETS.map((bucket) => ({
    range: bucket.label,
    count: allPnodes.filter((pnode) => (pnode.stats?.storage_committed ?? 0) >= bucket.min && (pnode.stats?.storage_committed ?? 0) < bucket.max).length
  })), [allPnodes]);

  const cpuDistribution = useMemo(() => {
    const buckets = getCpuBuckets();
    return buckets.map((bucket) => ({
      range: bucket.label,
      min: bucket.min,
      max: bucket.max,
      count: allPnodes.filter((pnode) => pnode.status === "active" && (pnode.stats?.cpu_percent ?? 0) >= bucket.min && (pnode.stats?.cpu_percent ?? 0) < bucket.max).length,
      color: bucket.color
    }));
  }, [allPnodes, theme]);

  const pagesDistribution = useMemo(() => {
    // Get all active nodes with pages data
    const activeNodesWithPages = allPnodes
      .filter(p => p.status === "active" && (p.stats?.total_pages ?? 0) > 0)
      .map(p => p.stats?.total_pages ?? 0)
      .sort((a, b) => a - b);

    if (activeNodesWithPages.length === 0) {
      // Fallback buckets if no data
      return [
        { range: "0", min: 0, max: 0, count: 0, color: "#64748B" }
      ];
    }

    const maxPages = Math.max(...activeNodesWithPages);
    const minPages = Math.min(...activeNodesWithPages.filter(p => p > 0));

    // Create adaptive buckets based on logarithmic scale
    const createLogBuckets = (min: number, max: number) => {
      if (max === 0) return [];

      // Use log scale for better distribution
      const logMin = Math.log10(Math.max(min, 1));
      const logMax = Math.log10(max);
      const step = (logMax - logMin) / 5; // 5 buckets

      const buckets = [];
      const colors = ["#10B981", "#06B6D4", "#3B82F6", "#8B5CF6", "#F59E0B"]; // Green -> Cyan -> Blue -> Purple -> Orange

      for (let i = 0; i < 5; i++) {
        const bucketLogMin = logMin + (i * step);
        const bucketLogMax = logMin + ((i + 1) * step);
        const bucketMin = Math.pow(10, bucketLogMin);
        const bucketMax = i === 4 ? Infinity : Math.pow(10, bucketLogMax);

        // Format label based on magnitude
        const formatPageCount = (val: number) => {
          if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
          if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
          return val.toFixed(0);
        };

        const label = i === 4
          ? `${formatPageCount(bucketMin)}+`
          : `${formatPageCount(bucketMin)}-${formatPageCount(bucketMax)}`;

        buckets.push({
          range: label,
          min: Math.round(bucketMin),
          max: bucketMax,
          color: colors[i]
        });
      }

      return buckets;
    };

    const pagesBuckets = createLogBuckets(minPages, maxPages);

    return pagesBuckets.map((bucket) => ({
      range: bucket.range,
      count: allPnodes.filter((pnode) =>
        pnode.status === "active" &&
        (pnode.stats?.total_pages ?? 0) >= bucket.min &&
        (pnode.stats?.total_pages ?? 0) < bucket.max
      ).length,
      color: bucket.color
    }));
  }, [allPnodes]);

  const versionOverview = useMemo(() => computeVersionOverview(allPnodes), [allPnodes]);

  const versionChart = useMemo(() => ({
    entries: versionOverview.buckets.map((bucket) => ({ id: bucket.id, label: bucket.label, count: bucket.count, percentage: bucket.percentage, color: bucket.color })),
    latestPercentLabel: versionOverview.latestPercentage.toFixed(0),
    message: versionOverview.health.description,
  }), [versionOverview]);

  const networkSyncMetrics = useMemo(() => calculateNetworkSyncMetrics(allPnodes), [allPnodes]);

  // Disabled: This was creating duplicate values [85, 85, 85...] instead of real historical data
  // We now use yesterday/lastWeek scores from API to build synthetic trend
  // useEffect(() => {
  //   if (activeNodes.length === 0 || !lastUpdate) return;
  //   setNetworkHealthHistory((prev) => [...prev, networkHealthScore].slice(-24));
  // }, [activeNodes.length, networkHealthScore, lastUpdate]);

  const refreshData = useCallback(() => loadData(true), [loadData]);

  const loadYesterdayScore = useCallback(async () => {
    try {
      const response = await fetch("/api/network-health/yesterday", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.networkHealthScore !== null) {
        console.log("[NetworkHealth] Yesterday score loaded:", payload.networkHealthScore);
        setYesterdayScore(payload.networkHealthScore);
      }
    } catch (error) {
      console.error("Error loading yesterday score:", error);
    }
  }, []);

  const loadLastWeekScore = useCallback(async () => {
    try {
      const response = await fetch("/api/network-health/last-week", { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (payload.networkHealthScore !== null) {
        console.log("[NetworkHealth] Last week score loaded:", payload.networkHealthScore);
        setLastWeekScore(payload.networkHealthScore);
      }
    } catch (error) {
      console.error("Error loading last week score:", error);
    }
  }, []);

  useEffect(() => {
    loadYesterdayScore();
    loadLastWeekScore();
  }, [loadYesterdayScore, loadLastWeekScore]);

  // Load network participation metrics
  useEffect(() => {
    const loadParticipation = async () => {
      const data = await fetchNetworkParticipation();
      if (data) {
        setNetworkParticipation(data);
      }
    };

    loadParticipation();

    // Refresh every 5 minutes
    const interval = setInterval(loadParticipation, 300_000);
    return () => clearInterval(interval);
  }, []);

  // Load network metadata (gossip discovery stats)
  useEffect(() => {
    const loadNetworkMetadata = async () => {
      try {
        const response = await fetch('/api/network-metadata', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          setNetworkMetadata(data);
        }
      } catch (error) {
        console.error('Error fetching network metadata:', error);
      }
    };

    loadNetworkMetadata();

    // Refresh every 5 minutes (in sync with participation)
    const interval = setInterval(loadNetworkMetadata, 300_000);
    return () => clearInterval(interval);
  }, []);

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(allPnodes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pnodes_export_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("JSON export started");
  }, [allPnodes]);

  const exportCsv = useCallback(() => {
    if (allPnodes.length === 0) return;
    const headers = ["IP", "Status", "Version", "CPU %", "RAM Used", "RAM Total", "Storage", "Uptime"];
    const rows = allPnodes.map((p) => [
      p.ip,
      p.status,
      p.version || "unknown",
      p.stats?.cpu_percent?.toFixed(1) || "0",
      p.stats?.ram_used || "0",
      p.stats?.ram_total || "0",
      p.stats?.storage_committed || "0",
      p.stats?.uptime || "0",
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pnodes_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV export started");
  }, [allPnodes]);

  const exportExcel = useCallback(() => {
    exportCsv();
  }, [exportCsv]);

  return {
    pnodes: allPnodes,
    loading,
    refreshing,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    sortKey,
    setSortKey,
    sortDirection,
    setSortDirection,
    nodeFilter,
    setNodeFilter,
    isAdvancedFilterOpen,
    setIsAdvancedFilterOpen,
    selectedVersions,
    setSelectedVersions,
    selectedHealthStatuses,
    setSelectedHealthStatuses,
    minCpu,
    setMinCpu,
    minStorage,
    setMinStorage,
    maxStorageBytes,
    sliderToBytes,
    resetFilters,
    availableVersions,
    autoRefreshOption,
    setAutoRefreshOption,
    lastUpdate,
    healthFilter,
    setHealthFilter,
    networkHealthHistory,
    yesterdayScore,
    lastWeekScore,
    handleSort,
    refreshData,
    publicCount,
    privateCount,
    filteredAndSortedPNodes,
    quickResultsCount,
    // Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    paginatedPNodes,
    // Grid View
    gridPNodes,
    gridLimit,
    setGridLimit,
    alerts,
    criticalCount,
    warningCount,
    networkHealthScore,
    networkSyncMetrics,
    networkParticipation,
    networkMetadata,
    versionOverview,
    networkHealthInsights,
    storageCapacityStats,
    storageBarColors,
    avgCpuUsage,
    avgRamUsage,
    networkUptimeStats,
    storageDistribution,
    cpuDistribution,
    pagesDistribution,
    versionChart,
    healthDistribution: {
      excellent: allPnodes.filter(p => {
        const isTarget = nodeFilter === "all" ? p.status === "active" : (nodeFilter === "public" ? p.status === "active" : p.status === "gossip_only");
        return isTarget && p._healthStatus === "Excellent";
      }).length,
      good: allPnodes.filter(p => {
        const isTarget = nodeFilter === "all" ? p.status === "active" : (nodeFilter === "public" ? p.status === "active" : p.status === "gossip_only");
        return isTarget && p._healthStatus === "Good";
      }).length,
      warning: allPnodes.filter(p => {
        const isTarget = nodeFilter === "all" ? p.status === "active" : (nodeFilter === "public" ? p.status === "active" : p.status === "gossip_only");
        return isTarget && p._healthStatus === "Warning";
      }).length,
      critical: allPnodes.filter(p => {
        const isTarget = nodeFilter === "all" ? p.status === "active" : (nodeFilter === "public" ? p.status === "active" : p.status === "gossip_only");
        return isTarget && p._healthStatus === "Critical";
      }).length,
      total: allPnodes.filter(p => {
        return nodeFilter === "all" ? p.status === "active" : (nodeFilter === "public" ? p.status === "active" : p.status === "gossip_only");
      }).length,
    },
    exportData,
    exportCsv,
    exportExcel
  };
};
