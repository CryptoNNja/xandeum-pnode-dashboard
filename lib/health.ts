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

  const isCritical =
    cpu >= 95 ||
    uptimeHours < 1 ||
    ramPercent >= 90 ||
    storagePercent >= 95 ||
    (hasScore && performanceScore < 50);
  if (isCritical) return "Critical";

  const isWarning =
    cpu >= 80 ||
    uptimeHours < 6 ||
    ramPercent >= 75 ||
    storagePercent >= 80 ||
    (hasScore && performanceScore < 70);
  if (isWarning) return "Warning";

  if (
    cpu <= 25 &&
    uptimeHours >= 48 &&
    ramPercent < 50 &&
    storagePercent < 70
  ) {
    return "Excellent";
  }

  return "Good";
}
