import type { PNode, PNodeStats } from "./types";

/**
 * Calculate a 0-100 performance score for a pNode
 * Based on:
 * - CPU efficiency (40%)
 * - RAM efficiency (25%)
 * - Uptime (20%)
 * - Network stability (15%)
 */
export function calculateNodeScore(pnode: PNode): number {
  // Private nodes = 0
  if (pnode.node_type === 'private' || pnode.stats.uptime === 0) {
    return 0;
  }

  // CPU efficiency (40%)
  const cpuScore = Math.max(0, Math.min(100, 100 - pnode.stats.cpu_percent));
  const cpuWeighted = cpuScore * 0.4;

  // RAM efficiency (25%)
  // Optimal: <50%, Good: 50-75%, Poor: 75-90%, Critical: >90%
  const ramPercent =
    pnode.stats.ram_total > 0
      ? (pnode.stats.ram_used / pnode.stats.ram_total) * 100
      : 0;
  const ramScore = Math.max(0, Math.min(100, 100 - ramPercent));
  const ramWeighted = ramScore * 0.25;

  // Uptime (20%)
  // <1h: 0%, 1-24h: 25%, 1-7d: 50%, 7-30d: 75%, >30d: 100%
  const uptimeHours = pnode.stats.uptime / 3600;
  let uptimeScore = 0;
  if (uptimeHours >= 30 * 24) uptimeScore = 100;
  else if (uptimeHours >= 7 * 24) uptimeScore = 75;
  else if (uptimeHours >= 24) uptimeScore = 50;
  else if (uptimeHours >= 1) uptimeScore = 25;
  const uptimeWeighted = uptimeScore * 0.2;

  // Network stability (15%)
  // Based on packets_sent/received ratio
  // Ideal: ratio close to 1 (balanced traffic)
  const totalPackets = pnode.stats.packets_sent + pnode.stats.packets_received;
  let stabilityScore = 50; // baseline
  if (totalPackets > 0) {
    const ratio = pnode.stats.packets_sent / (pnode.stats.packets_received || 1);
    // If ratio between 0.5 and 2, it's good = 100
    if (ratio >= 0.5 && ratio <= 2) {
      stabilityScore = 100;
    } else if (ratio >= 0.3 && ratio <= 3.3) {
      stabilityScore = 80;
    } else if (ratio >= 0.2 && ratio <= 5) {
      stabilityScore = 60;
    } else {
      stabilityScore = 40;
    }
  }
  const stabilityWeighted = stabilityScore * 0.15;

  // Note: we intentionally do not include active streams in the score for now.
  // The field is often missing/inconsistent across nodes and makes comparisons harder.

  const totalScore = cpuWeighted + ramWeighted + uptimeWeighted + stabilityWeighted;

  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

/**
 * Returns a color based on the score
 */
export function getScoreColor(score: number): string {
  if (score === 0) return 'text-gray-400'; // Private/offline
  if (score >= 90) return 'text-green-400';
  if (score >= 75) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 45) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Returns a rating label based on the score
 */
export function getScoreLabel(score: number): string {
  if (score === 0) return 'N/A';
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Poor';
}

/**
 * Returns a badge background color based on the score
 */
export function getScoreBadgeColor(score: number): string {
  if (score === 0) return 'bg-gray-900 border-gray-700';
  if (score >= 90) return 'bg-green-900/30 border-green-600/50';
  if (score >= 75) return 'bg-emerald-900/30 border-emerald-600/50';
  if (score >= 60) return 'bg-yellow-900/30 border-yellow-600/50';
  if (score >= 45) return 'bg-orange-900/30 border-orange-600/50';
  return 'bg-red-900/30 border-red-600/50';
}
