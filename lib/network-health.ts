/**
 * Network Health V2 - Component-based scoring system
 * 
 * This replaces the simple average score with a weighted component system
 * that provides detailed insights into network health.
 */

import type { PNode } from './types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface NetworkHealthComponent {
  score: number;        // 0-100
  weight: number;       // 0-1 (total must = 1)
  label: string;
  icon: string;
  color: string;
  details: Record<string, any>;
}

export interface NetworkHealthScore {
  overall: number;      // 0-100 weighted average
  components: {
    versionConsensus: NetworkHealthComponent;
    networkUptime: NetworkHealthComponent;
    storageHealth: NetworkHealthComponent;
    resourceEfficiency: NetworkHealthComponent;
    networkConnectivity: NetworkHealthComponent;
  };
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  recommendations: HealthRecommendation[];
}

export interface HealthRecommendation {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: keyof NetworkHealthScore['components'];
  title: string;
  description: string;
  affectedNodes: string[];
  impact: string;
  actionable: boolean;
}

// ============================================================================
// Component Calculators
// ============================================================================

/**
 * 1. Version Consensus (25% weight)
 * Measures how many nodes are on the consensus version vs outdated versions
 */
function calculateVersionConsensus(nodes: PNode[]): NetworkHealthComponent {
  // Find the most common version (consensus)
  const versions = new Map<string, number>();
  nodes.forEach(node => {
    const version = node.version || 'unknown';
    versions.set(version, (versions.get(version) || 0) + 1);
  });

  const sortedVersions = Array.from(versions.entries())
    .sort((a, b) => b[1] - a[1]);
  
  const consensusVersion = sortedVersions[0]?.[0] || 'unknown';
  const consensusCount = sortedVersions[0]?.[1] || 0;
  const consensusPercent = (consensusCount / nodes.length) * 100;

  // Calculate score based on consensus percentage
  let score = 0;
  if (consensusPercent >= 95) score = 100;
  else if (consensusPercent >= 90) score = 95;
  else if (consensusPercent >= 85) score = 90;
  else if (consensusPercent >= 80) score = 85;
  else if (consensusPercent >= 75) score = 80;
  else if (consensusPercent >= 70) score = 75;
  else if (consensusPercent >= 60) score = 70;
  else if (consensusPercent >= 50) score = 60;
  else score = Math.max(0, consensusPercent);

  // Penalty for deprecated versions (if we had that info)
  // For now, non-consensus versions are considered "legacy"
  const legacyCount = nodes.length - consensusCount;

  return {
    score: Math.round(score),
    weight: 0.25,
    label: 'Version Consensus',
    icon: 'CheckCircle2',
    color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
    details: {
      consensusVersion,
      consensusCount,
      consensusPercent: Math.round(consensusPercent),
      legacyCount,
      totalVersions: versions.size,
    }
  };
}

/**
 * 2. Network Uptime (25% weight)
 * Measures average uptime and stability of nodes
 */
function calculateNetworkUptime(nodes: PNode[]): NetworkHealthComponent {
  let totalUptimeScore = 0;
  let nodesWithUptime = 0;

  nodes.forEach(node => {
    const uptime = node.stats?.uptime || 0; // in seconds
    const uptimeHours = uptime / 3600;

    // Score based on uptime
    let nodeScore = 0;
    if (uptimeHours >= 720) nodeScore = 100;      // 30+ days
    else if (uptimeHours >= 168) nodeScore = 95;  // 7+ days
    else if (uptimeHours >= 48) nodeScore = 85;   // 2+ days
    else if (uptimeHours >= 24) nodeScore = 70;   // 1+ day
    else if (uptimeHours >= 12) nodeScore = 50;   // 12+ hours
    else if (uptimeHours >= 6) nodeScore = 30;    // 6+ hours
    else nodeScore = 10;                          // < 6 hours

    if (uptime > 0) {
      totalUptimeScore += nodeScore;
      nodesWithUptime++;
    }
  });

  const avgScore = nodesWithUptime > 0 
    ? totalUptimeScore / nodesWithUptime 
    : 0;

  // Calculate distribution
  const uptimeBuckets = {
    moreThan30d: 0,
    between7And30d: 0,
    between1And7d: 0,
    lessThan1d: 0,
  };

  nodes.forEach(node => {
    const uptimeHours = (node.stats?.uptime || 0) / 3600;
    if (uptimeHours >= 720) uptimeBuckets.moreThan30d++;
    else if (uptimeHours >= 168) uptimeBuckets.between7And30d++;
    else if (uptimeHours >= 24) uptimeBuckets.between1And7d++;
    else uptimeBuckets.lessThan1d++;
  });

  return {
    score: Math.round(avgScore),
    weight: 0.25,
    label: 'Network Uptime',
    icon: 'Zap',
    color: avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#F59E0B' : '#EF4444',
    details: {
      avgUptimeDays: Math.round((nodes.reduce((sum, n) => sum + (n.stats?.uptime || 0), 0) / nodes.length) / 86400),
      nodesWithUptime,
      distribution: uptimeBuckets,
    }
  };
}

/**
 * 3. Storage Health (20% weight)
 * Measures storage commitment and distribution
 */
function calculateStorageHealth(nodes: PNode[]): NetworkHealthComponent {
  const totalStorage = nodes.reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);
  const avgStorage = totalStorage / nodes.length;
  
  // Calculate distribution (standard deviation)
  const variance = nodes.reduce((sum, n) => {
    const storage = n.stats?.storage_committed || 0;
    return sum + Math.pow(storage - avgStorage, 2);
  }, 0) / nodes.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgStorage > 0 ? (stdDev / avgStorage) : 0;

  // Score based on average storage and distribution
  let score = 50; // Base score

  // Bonus for good average storage (0-30 points)
  const TB = 1e12;
  if (avgStorage >= 3 * TB) score += 30;
  else if (avgStorage >= 2 * TB) score += 25;
  else if (avgStorage >= 1 * TB) score += 20;
  else if (avgStorage >= 500e9) score += 15;
  else if (avgStorage >= 100e9) score += 10;
  else score += 5;

  // Bonus for good distribution (0-20 points)
  // Lower CV = more balanced = better
  if (coefficientOfVariation <= 0.3) score += 20;
  else if (coefficientOfVariation <= 0.5) score += 15;
  else if (coefficientOfVariation <= 0.7) score += 10;
  else if (coefficientOfVariation <= 1.0) score += 5;

  return {
    score: Math.min(100, Math.round(score)),
    weight: 0.20,
    label: 'Storage Health',
    icon: 'Database',
    color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
    details: {
      totalStorageTB: Math.round(totalStorage / TB * 100) / 100,
      avgStorageTB: Math.round(avgStorage / TB * 100) / 100,
      coefficientOfVariation: Math.round(coefficientOfVariation * 100) / 100,
      distribution: coefficientOfVariation <= 0.5 ? 'balanced' : 'unbalanced',
    }
  };
}

/**
 * 4. Resource Efficiency (15% weight)
 * Measures CPU/RAM utilization efficiency
 */
function calculateResourceEfficiency(nodes: PNode[]): NetworkHealthComponent {
  let totalCpu = 0;
  let totalRam = 0;
  let nodesWithStats = 0;
  let cpuCritical = 0;
  let ramCritical = 0;

  nodes.forEach(node => {
    const cpu = node.stats?.cpu_percent || 0;
    const ramUsed = node.stats?.ram_used || 0;
    const ramTotal = node.stats?.ram_total || 1;
    const ramPercent = (ramUsed / ramTotal) * 100;

    // Only count nodes with non-zero stats (actual data)
    if (node.stats && (cpu > 0 || ramPercent > 0)) {
      totalCpu += cpu;
      totalRam += ramPercent;
      nodesWithStats++;

      if (cpu >= 90) cpuCritical++;
      if (ramPercent >= 90) ramCritical++;
    }
  });

  const avgCpu = nodesWithStats > 0 ? totalCpu / nodesWithStats : 0;
  const avgRam = nodesWithStats > 0 ? totalRam / nodesWithStats : 0;

  // Score based on optimal utilization
  // Sweet spot: 40-70% CPU, 50-80% RAM
  let cpuScore = 0;
  if (avgCpu >= 40 && avgCpu <= 70) cpuScore = 100;
  else if (avgCpu >= 30 && avgCpu <= 80) cpuScore = 85;
  else if (avgCpu >= 20 && avgCpu <= 90) cpuScore = 70;
  else if (avgCpu < 20) cpuScore = 60; // Too low = underutilized
  else cpuScore = Math.max(0, 100 - (avgCpu - 90) * 2); // Penalty for high CPU

  let ramScore = 0;
  if (avgRam >= 50 && avgRam <= 80) ramScore = 100;
  else if (avgRam >= 40 && avgRam <= 90) ramScore = 85;
  else if (avgRam >= 30 && avgRam <= 95) ramScore = 70;
  else if (avgRam < 30) ramScore = 60; // Too low = underutilized
  else ramScore = Math.max(0, 100 - (avgRam - 90) * 2);

  const score = (cpuScore * 0.5 + ramScore * 0.5);

  // Penalty for critical nodes
  const criticalPenalty = (cpuCritical + ramCritical) * 5;

  return {
    score: Math.max(0, Math.round(score - criticalPenalty)),
    weight: 0.15,
    label: 'Resource Efficiency',
    icon: 'Cpu',
    color: score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444',
    details: {
      avgCpu: Math.round(avgCpu),
      avgRam: Math.round(avgRam),
      cpuCritical,
      ramCritical,
      nodesWithStats,
    }
  };
}

/**
 * 5. Network Connectivity (15% weight)
 * Measures network connectivity and balance
 */
function calculateNetworkConnectivity(nodes: PNode[]): NetworkHealthComponent {
  // Base this on packets sent/received as network activity indicators
  let totalScore = 0;
  let nodesWithData = 0;

  nodes.forEach(node => {
    const packetsSent = node.stats?.packets_sent || 0;
    const packetsReceived = node.stats?.packets_received || 0;
    
    // Score based on having network activity
    let nodeScore = 50; // Base score for being reachable

    if (packetsSent > 0 || packetsReceived > 0) {
      nodeScore += 25; // Bonus for activity

      // Bonus for balanced I/O (not too skewed)
      const total = packetsSent + packetsReceived;
      if (total > 0) {
        const sentRatio = packetsSent / total;
        if (sentRatio >= 0.4 && sentRatio <= 0.6) {
          nodeScore += 25; // Well balanced
        } else if (sentRatio >= 0.3 && sentRatio <= 0.7) {
          nodeScore += 15; // Reasonably balanced
        } else {
          nodeScore += 5; // Skewed but has activity
        }
      }
    }

    totalScore += nodeScore;
    nodesWithData++;
  });

  const avgScore = nodesWithData > 0 ? totalScore / nodesWithData : 0;

  return {
    score: Math.round(avgScore),
    weight: 0.15,
    label: 'Network Connectivity',
    icon: 'Wifi',
    color: avgScore >= 80 ? '#10B981' : avgScore >= 60 ? '#F59E0B' : '#EF4444',
    details: {
      activeNodes: nodes.filter(n => (n.stats?.packets_sent || 0) > 0 || (n.stats?.packets_received || 0) > 0).length,
      totalNodes: nodes.length,
    }
  };
}

// ============================================================================
// Main Calculator
// ============================================================================

/**
 * Calculate comprehensive network health score
 */
export function calculateNetworkHealthV2(nodes: PNode[]): NetworkHealthScore {
  if (nodes.length === 0) {
    return {
      overall: 0,
      components: {} as any,
      rating: 'critical',
      trend: 'unknown',
      recommendations: [],
    };
  }

  // Calculate all components
  const versionConsensus = calculateVersionConsensus(nodes);
  const networkUptime = calculateNetworkUptime(nodes);
  const storageHealth = calculateStorageHealth(nodes);
  const resourceEfficiency = calculateResourceEfficiency(nodes);
  const networkConnectivity = calculateNetworkConnectivity(nodes);

  // Calculate weighted overall score
  const overall = Math.round(
    versionConsensus.score * versionConsensus.weight +
    networkUptime.score * networkUptime.weight +
    storageHealth.score * storageHealth.weight +
    resourceEfficiency.score * resourceEfficiency.weight +
    networkConnectivity.score * networkConnectivity.weight
  );

  // Determine rating
  let rating: NetworkHealthScore['rating'];
  if (overall >= 90) rating = 'excellent';
  else if (overall >= 75) rating = 'good';
  else if (overall >= 60) rating = 'fair';
  else if (overall >= 40) rating = 'poor';
  else rating = 'critical';

  // Generate recommendations
  const recommendations = generateRecommendations({
    versionConsensus,
    networkUptime,
    storageHealth,
    resourceEfficiency,
    networkConnectivity,
  });

  return {
    overall,
    components: {
      versionConsensus,
      networkUptime,
      storageHealth,
      resourceEfficiency,
      networkConnectivity,
    },
    rating,
    trend: 'unknown', // Will be calculated with historical data
    recommendations,
  };
}

// ============================================================================
// Recommendations Generator
// ============================================================================

function generateRecommendations(components: NetworkHealthScore['components']): HealthRecommendation[] {
  const recs: HealthRecommendation[] = [];

  // Version consensus recommendations
  if (components.versionConsensus.score < 80) {
    const { legacyCount, consensusVersion } = components.versionConsensus.details;
    recs.push({
      id: 'version-consensus-low',
      severity: components.versionConsensus.score < 60 ? 'critical' : 'warning',
      category: 'versionConsensus',
      title: `${legacyCount} nodes not on consensus version`,
      description: `Update nodes to version ${consensusVersion} to improve network cohesion.`,
      affectedNodes: [],
      impact: `Improves health by +${Math.round((80 - components.versionConsensus.score) * 0.25)} points`,
      actionable: true,
    });
  }

  // Resource efficiency recommendations
  if (components.resourceEfficiency.details.cpuCritical > 0) {
    recs.push({
      id: 'cpu-critical',
      severity: 'warning',
      category: 'resourceEfficiency',
      title: `${components.resourceEfficiency.details.cpuCritical} nodes with high CPU usage`,
      description: 'Nodes running at >90% CPU may experience performance issues.',
      affectedNodes: [],
      impact: 'May affect network responsiveness',
      actionable: true,
    });
  }

  // Add more recommendations based on other components...

  return recs;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getHealthRating(score: number): NetworkHealthScore['rating'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  if (score >= 40) return 'poor';
  return 'critical';
}

export function getHealthColor(rating: NetworkHealthScore['rating']): string {
  const colors = {
    excellent: '#10B981',
    good: '#3B82F6',
    fair: '#F59E0B',
    poor: '#EF4444',
    critical: '#DC2626',
  };
  return colors[rating];
}

export function getHealthGradient(rating: NetworkHealthScore['rating']): string {
  const gradients = {
    excellent: 'from-emerald-500 to-green-600',
    good: 'from-blue-500 to-cyan-600',
    fair: 'from-yellow-500 to-orange-600',
    poor: 'from-orange-500 to-red-600',
    critical: 'from-red-600 to-red-800',
  };
  return gradients[rating];
}
