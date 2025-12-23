import type { PNode } from "./types";
import { calculateNodeScore } from "./scoring";

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

export function getHealthStatus(pnode?: PNode | null): HealthStatus {
  if (!pnode || pnode.status === "gossip_only") {
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

  const performanceScore = calculateNodeScore(pnode);
  const hasScore = performanceScore > 0;

  // CRITICAL - Service at risk, immediate action required
  // Expert SRE thresholds for production monitoring
  const isCritical =
    uptimeSeconds < 300 ||           // < 5min (recent crash/restart)
    storagePercent >= 98 ||          // Disk almost full (data loss imminent)
    ramPercent >= 98 ||              // RAM saturated (OOM kill risk)
    cpu >= 98 ||                     // CPU stuck (possible infinite loop)
    (hasScore && performanceScore < 20);  // Multiple critical failures

  if (isCritical) return "Critical";

  // WARNING - Degraded performance, monitoring required
  // Node is functional but needs attention
  const isWarning =
    uptimeHours < 24 ||              // Restarted recently (stability concern)
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
