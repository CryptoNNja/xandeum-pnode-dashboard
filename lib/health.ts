import type { PNode } from "./types";
import { calculateNodeScore, setCachedNodes } from "./scoring";
import { WARNING_UPTIME_THRESHOLD_HOURS, CRITICAL_UPTIME_THRESHOLD_HOURS } from "./constants";

/**
 * Set cached nodes for health calculations
 * This allows components without direct access to allNodes to still benefit from network context
 */
export { setCachedNodes };

export type HealthStatus =
  | "Excellent"
  | "Good"
  | "Warning"
  | "Critical"
  | "Private";

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
};

const sanitizeNumber = (value: number | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
};

/**
 * Determine health status of a pNode
 * 
 * @param pnode - The node to evaluate
 * @param allNodes - Optional: Full network context for accurate performance scoring
 * @returns HealthStatus - a 4-tier status (Excellent | Good | Warning | Critical | Private)
 * 
 * Note: Passing allNodes ensures the performance score uses accurate version tier detection,
 * which impacts the health status calculation.
 */
export function getHealthStatus(pnode?: PNode | null, allNodes?: PNode[]): HealthStatus {
  if (!pnode || pnode.status === "gossip_only" || pnode.status === "stale") {
    return "Private";
  }

  const stats = pnode.stats;
  if (!stats) {
    return "Private";
  }

  const cpuRaw = sanitizeNumber(stats.cpu_percent);
  const uptimeSeconds = sanitizeNumber(stats.uptime);
  const hasCpu = Number.isFinite(stats.cpu_percent);
  const hasUptime = Number.isFinite(stats.uptime);

  if (!hasCpu && !hasUptime) {
    return "Private";
  }

  const cpu = clampPercent(cpuRaw);
  const uptimeHours = uptimeSeconds / 3600;

  const ramTotal = sanitizeNumber(stats.ram_total);
  const ramUsed = sanitizeNumber(stats.ram_used);
  const ramPercent =
    ramTotal > 0 ? clampPercent((ramUsed / ramTotal) * 100) : 0;

  // Storage usage can come from two different sources:
  // - get-pods-with-stats: storage_committed/storage_used (capacity promised vs actual usage)
  // - get-stats: file_size/total_bytes (node-reported totals)
  // Prefer pods-with-stats when available, but fallback to get-stats to stay comparable with
  // the official dashboard and to avoid treating missing pods fields as "0%".
  const committedBytes = sanitizeNumber(stats.storage_committed) || sanitizeNumber(stats.file_size);
  const usedBytes = sanitizeNumber(stats.storage_used) || sanitizeNumber(stats.total_bytes);
  const storagePercent =
    committedBytes > 0 ? clampPercent((usedBytes / committedBytes) * 100) : 0;

  // Performance score (0-100) - now with network context for accurate version tiers
  const performanceScore = calculateNodeScore(pnode, allNodes);
  const hasScore = performanceScore > 0;

  // CRITICAL - Service at risk, immediate action required
  // Expert SRE thresholds for production monitoring
  const isCritical =
    uptimeHours < CRITICAL_UPTIME_THRESHOLD_HOURS ||  // < 5min (recent crash/restart)
    storagePercent >= 98 ||          // Disk almost full (data loss imminent)
    ramPercent >= 98 ||              // RAM saturated (OOM kill risk)
    cpu >= 98 ||                     // CPU stuck (possible infinite loop)
    (hasScore && performanceScore < 20);  // Multiple critical failures

  if (isCritical) return "Critical";

  // WARNING - Degraded performance, monitoring required
  // Node is functional but needs attention
  const isWarning =
    uptimeHours < WARNING_UPTIME_THRESHOLD_HOURS ||  // Restarted recently (stability concern)
    storagePercent >= 85 ||          // Storage filling up
    ramPercent >= 85 ||              // High memory pressure
    cpu >= 90 ||                     // High sustained CPU load
    (hasScore && performanceScore < 50);  // Underperforming

  if (isWarning) return "Warning";

  // EXCELLENT - Optimal health
  // Node operating at peak performance
  if (
    cpu <= 60 &&
    uptimeHours >= 168 &&            // > 7 days uptime
    ramPercent < 70 &&
    storagePercent < 70 &&
    hasScore && performanceScore >= 85
  ) {
    return "Excellent";
  }

  // GOOD - Normal operation (default)
  return "Good";
}
