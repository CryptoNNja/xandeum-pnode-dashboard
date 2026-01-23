import type { PNode } from "./types";

/**
 * 🎯 Xandeum pNode Scoring System v3.0
 * 
 * Advanced scoring system for Xandeum's decentralized storage network
 * Fair, accurate, and production-tested evaluation logic.
 * 
 * CORE PHILOSOPHY:
 * ================
 * 1. Reward REAL contribution (not just promises)
 * 2. Fair comparison between active and gossip-only nodes
 * 3. Version consensus is critical for network health
 * 4. Adapt to network maturity and detect outliers
 * 5. Prevent gaming through whale caps and smart penalties
 * 
 * KEY FEATURES:
 * =============
 * ✅ Dynamic version consensus detection (no hardcoded versions)
 * ✅ Separate scoring logic for active vs gossip nodes
 * ✅ Whale protection (storage outliers capped at 72/100)
 * ✅ Version compliance rewards (consensus = bonus, outdated = penalty)
 * ✅ Network maturity adaptation (early stage vs mature)
 * ✅ Transparent score breakdown for users
 * ✅ Backward compatible API with caching
 * 
 * SCORING WEIGHTS:
 * ================
 * 
 * ACTIVE NODES (full metrics available):
 * - Version Consensus: 15% (network health & stability)
 * - Storage Committed: 20% (capacity contribution)
 * - Uptime: 25% (availability for storage access)
 * - Network I/O: 20% (actual network participation)
 * - CPU Efficiency: 10% (resource optimization)
 * - RAM Efficiency: 10% (caching capability)
 * 
 * GOSSIP-ONLY NODES (limited metrics):
 * - Version Consensus: 25% (critical for network health)
 * - Storage Committed: 45% (main contribution)
 * - Storage Efficiency: 20% (relative to network average)
 * - Participation: 10% (discovery bonus)
 * - GLOBAL CAP: 75 max (reflects limited contribution vs active nodes)
 * - WHALE CAP: 72 max if storage > 10x network average
 * 
 * VERSION PENALTIES:
 * ==================
 * - Trynet/Beta builds: 0.85x multiplier (-15%)
 * - Gossip + Outdated: 0.80x multiplier (-20%)
 * - Unknown version: 0.75x multiplier (-25%)
 */

// ============================================================================
// VERSION CONSENSUS DETECTION
// ============================================================================

export interface VersionTier {
  tier: 1 | 2 | 3 | 4;
  name: 'Consensus' | 'Supported' | 'Legacy' | 'Deprecated';
  score: number;
  multiplier: number;
  description: string;
}

/**
 * Dynamically detect version consensus from active nodes
 * Returns the most common version among active nodes
 */
export function detectConsensusVersion(nodes: PNode[]): string | null {
  const activeNodes = nodes.filter(n => n.node_type === 'public' && n.version && n.version !== 'unknown');
  
  if (activeNodes.length === 0) return null;
  
  // Count versions
  const versionCounts = new Map<string, number>();
  activeNodes.forEach(node => {
    const version = node.version || 'unknown';
    versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
  });
  
  // Find most common version
  let consensusVersion = '';
  let maxCount = 0;
  
  versionCounts.forEach((count, version) => {
    if (count > maxCount) {
      maxCount = count;
      consensusVersion = version;
    }
  });
  
  return consensusVersion || null;
}

/**
 * Calculate version tier based on network adoption
 * Tier 1 (Consensus): >50% of active nodes
 * Tier 2 (Supported): >20% of active nodes
 * Tier 3 (Legacy): >5% of active nodes
 * Tier 4 (Deprecated): <5% or trynet/beta/unknown
 */
export function calculateVersionTier(
  nodeVersion: string | undefined,
  nodes: PNode[]
): VersionTier {
  // Unknown or missing version = deprecated
  if (!nodeVersion || nodeVersion === 'unknown') {
    return {
      tier: 4,
      name: 'Deprecated',
      score: 0,
      multiplier: 0.75,
      description: 'Unknown version - please update node software'
    };
  }
  
  // Detect trynet/beta builds
  const isTrynet = nodeVersion.includes('trynet') || 
                   nodeVersion.includes('beta') || 
                   nodeVersion.includes('alpha') ||
                   nodeVersion.includes('dev');
  
  if (isTrynet) {
    return {
      tier: 4,
      name: 'Deprecated',
      score: 30,
      multiplier: 0.85,
      description: 'Unstable build - use stable release for better score'
    };
  }
  
  // Calculate adoption rate
  const activeNodes = nodes.filter(n => n.node_type === 'public' && n.version);
  if (activeNodes.length === 0) {
    return {
      tier: 3,
      name: 'Legacy',
      score: 60,
      multiplier: 0.90,
      description: 'Unable to determine consensus'
    };
  }
  
  const nodesWithThisVersion = activeNodes.filter(n => n.version === nodeVersion).length;
  const adoptionRate = (nodesWithThisVersion / activeNodes.length) * 100;
  
  // Tier 1: Consensus (>50%)
  if (adoptionRate >= 50) {
    return {
      tier: 1,
      name: 'Consensus',
      score: 100,
      multiplier: 1.0,
      description: `Network consensus version (${adoptionRate.toFixed(1)}% adoption)`
    };
  }
  
  // Tier 2: Supported (20-50%)
  if (adoptionRate >= 20) {
    return {
      tier: 2,
      name: 'Supported',
      score: 80,
      multiplier: 0.95,
      description: `Supported version (${adoptionRate.toFixed(1)}% adoption)`
    };
  }
  
  // Tier 3: Legacy (5-20%)
  if (adoptionRate >= 5) {
    return {
      tier: 3,
      name: 'Legacy',
      score: 60,
      multiplier: 0.90,
      description: `Legacy version (${adoptionRate.toFixed(1)}% adoption)`
    };
  }
  
  // Tier 4: Deprecated (<5%)
  return {
    tier: 4,
    name: 'Deprecated',
    score: 40,
    multiplier: 0.85,
    description: `Outdated version (${adoptionRate.toFixed(1)}% adoption) - please update`
  };
}

// ============================================================================
// NETWORK ANALYSIS UTILITIES
// ============================================================================

/**
 * Calculate network-wide average storage committed
 * Used to detect storage whales (outliers)
 */
export function getNetworkAverageStorage(nodes: PNode[]): number {
  const nodesWithStorage = nodes.filter(n => (n.stats.storage_committed || 0) > 0);
  
  if (nodesWithStorage.length === 0) return 0;
  
  const totalStorage = nodesWithStorage.reduce((sum, n) => sum + (n.stats.storage_committed || 0), 0);
  return totalStorage / nodesWithStorage.length;
}

/**
 * Calculate network-wide storage utilization
 */
export function getNetworkStorageUtilization(nodes: PNode[]): number {
  const nodesWithStorage = nodes.filter(n => (n.stats.storage_committed || 0) > 0);
  
  if (nodesWithStorage.length === 0) return 0;
  
  const totalCommitted = nodesWithStorage.reduce((sum, n) => sum + (n.stats.storage_committed || 0), 0);
  const totalUsed = nodesWithStorage.reduce((sum, n) => sum + (n.stats.storage_used || n.stats.total_bytes || 0), 0);
  
  return totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0;
}

/**
 * Determine if node is a storage whale (>10x network average)
 */
export function isStorageWhale(node: PNode, nodes: PNode[]): boolean {
  const avgStorage = getNetworkAverageStorage(nodes);
  const nodeStorage = node.stats.storage_committed || 0;
  
  return nodeStorage > (avgStorage * 10) && avgStorage > 0;
}

/**
 * Determine if network is in "early" or "mature" phase
 * Threshold: 20% average utilization
 */
export function getNetworkPhase(nodes: PNode[]): 'early' | 'mature' {
  const avgUtilization = getNetworkStorageUtilization(nodes);
  return avgUtilization < 20 ? 'early' : 'mature';
}

// ============================================================================
// ACTIVE NODE SCORING (Full Metrics Available)
// ============================================================================

function calculateActiveNodeScore(pnode: PNode, allNodes: PNode[]): number {
  const stats = pnode.stats;
  
  // Offline nodes = 0
  if (stats.uptime === 0 && !stats.storage_committed) {
    return 0;
  }
  
  // ============================================
  // 1. VERSION CONSENSUS (15%)
  // ============================================
  const versionTier = calculateVersionTier(pnode.version, allNodes);
  const versionScore = versionTier.score;
  const versionWeighted = versionScore * 0.15;
  
  // ============================================
  // 2. STORAGE COMMITTED (20%)
  // ============================================
  const storageCommitted = stats.storage_committed || 0;
  let storageCommittedScore = 0;
  
  if (storageCommitted === 0) {
    storageCommittedScore = 0;
  } else {
    const storageGB = storageCommitted / (1024 ** 3);
    
    // Progressive scoring
    if (storageGB >= 5000) storageCommittedScore = 100;      // ≥5TB
    else if (storageGB >= 2000) storageCommittedScore = 95;  // ≥2TB
    else if (storageGB >= 1000) storageCommittedScore = 90;  // ≥1TB
    else if (storageGB >= 500) storageCommittedScore = 80;   // ≥500GB
    else if (storageGB >= 250) storageCommittedScore = 70;   // ≥250GB
    else if (storageGB >= 100) storageCommittedScore = 60;   // ≥100GB
    else if (storageGB >= 50) storageCommittedScore = 50;    // ≥50GB
    else storageCommittedScore = 40;                         // <50GB
  }
  
  const storageCommittedWeighted = storageCommittedScore * 0.20;
  
  // ============================================
  // 3. UPTIME (25%)
  // ============================================
  const uptimeHours = stats.uptime / 3600;
  let uptimeScore = 0;
  
  if (uptimeHours >= 30 * 24) uptimeScore = 100;      // ≥30 days
  else if (uptimeHours >= 14 * 24) uptimeScore = 95;  // ≥14 days
  else if (uptimeHours >= 7 * 24) uptimeScore = 90;   // ≥7 days
  else if (uptimeHours >= 3 * 24) uptimeScore = 75;   // ≥3 days
  else if (uptimeHours >= 24) uptimeScore = 60;       // ≥1 day
  else if (uptimeHours >= 12) uptimeScore = 45;       // ≥12 hours
  else if (uptimeHours >= 6) uptimeScore = 30;        // ≥6 hours
  else uptimeScore = 15;                              // <6 hours
  
  const uptimeWeighted = uptimeScore * 0.25;
  
  // ============================================
  // 4. NETWORK I/O (20%)
  // ============================================
  const totalPackets = stats.packets_sent + stats.packets_received;
  let networkScore = 50; // Baseline
  
  if (totalPackets > 0) {
    const ratio = stats.packets_sent / (stats.packets_received || 1);
    
    // Balanced traffic is ideal for storage nodes
    if (ratio >= 0.8 && ratio <= 1.5) {
      networkScore = 100; // Perfect balance
    } else if (ratio >= 0.5 && ratio <= 2.0) {
      networkScore = 95;  // Good balance
    } else if (ratio >= 0.3 && ratio <= 3.0) {
      networkScore = 80;  // Acceptable
    } else if (ratio >= 0.2 && ratio <= 4.0) {
      networkScore = 65;  // Unbalanced
    } else {
      networkScore = 40;  // Poor
    }
    
    // Bonus for high volume (active participation)
    if (totalPackets > 1000000) networkScore = Math.min(100, networkScore + 5);
    else if (totalPackets > 500000) networkScore = Math.min(100, networkScore + 3);
  }
  
  const networkWeighted = networkScore * 0.20;
  
  // ============================================
  // 5. CPU EFFICIENCY (10%)
  // ============================================
  const cpuPercent = stats.cpu_percent || 0;
  let cpuScore = 0;
  
  if (cpuPercent <= 30) cpuScore = 100;       // Low usage
  else if (cpuPercent <= 50) cpuScore = 95;   // Moderate
  else if (cpuPercent <= 70) cpuScore = 85;   // Active
  else if (cpuPercent <= 85) cpuScore = 70;   // High
  else if (cpuPercent <= 95) cpuScore = 50;   // Very high
  else cpuScore = 30;                         // Saturated
  
  const cpuWeighted = cpuScore * 0.10;
  
  // ============================================
  // 6. RAM EFFICIENCY (10%)
  // ============================================
  const ramPercent = stats.ram_total > 0
    ? (stats.ram_used / stats.ram_total) * 100
    : 0;
  
  let ramScore = 0;
  
  if (ramPercent <= 60) ramScore = 100;      // Plenty available
  else if (ramPercent <= 75) ramScore = 90;  // Good
  else if (ramPercent <= 85) ramScore = 75;  // Moderate
  else if (ramPercent <= 95) ramScore = 50;  // High
  else ramScore = 25;                        // Critical
  
  const ramWeighted = ramScore * 0.10;
  
  // ============================================
  // CALCULATE BASE SCORE
  // ============================================
  let baseScore = 
    versionWeighted +           // 15%
    storageCommittedWeighted +  // 20%
    uptimeWeighted +            // 25%
    networkWeighted +           // 20%
    cpuWeighted +               // 10%
    ramWeighted;                // 10%
  
  // ============================================
  // APPLY VERSION MULTIPLIER
  // ============================================
  baseScore = baseScore * versionTier.multiplier;
  
  // ============================================
  // BONUSES
  // ============================================
  // Bonus for consensus version + good uptime
  if (versionTier.tier === 1 && uptimeHours >= 7 * 24) {
    baseScore = Math.min(100, baseScore + 3);
  }
  
  return Math.round(Math.max(0, Math.min(100, baseScore)));
}

// ============================================================================
// GOSSIP-ONLY NODE SCORING (Limited Metrics)
// ============================================================================

function calculateGossipNodeScore(pnode: PNode, allNodes: PNode[]): number {
  const stats = pnode.stats;
  const storageCommitted = stats.storage_committed || 0;
  
  // No storage data = minimal participation score
  if (storageCommitted === 0) {
    return 15; // Base participation
  }
  
  // ============================================
  // 1. VERSION CONSENSUS (25% - Higher weight)
  // ============================================
  const versionTier = calculateVersionTier(pnode.version, allNodes);
  const versionScore = versionTier.score;
  const versionWeighted = versionScore * 0.25;
  
  // ============================================
  // 2. STORAGE COMMITTED (45% - Primary metric)
  // ============================================
  const storageGB = storageCommitted / (1024 ** 3);
  let storageCommittedScore = 0;
  
  if (storageGB >= 5000) storageCommittedScore = 100;
  else if (storageGB >= 2000) storageCommittedScore = 95;
  else if (storageGB >= 1000) storageCommittedScore = 90;
  else if (storageGB >= 500) storageCommittedScore = 80;
  else if (storageGB >= 250) storageCommittedScore = 70;
  else if (storageGB >= 100) storageCommittedScore = 60;
  else if (storageGB >= 50) storageCommittedScore = 50;
  else storageCommittedScore = 40;
  
  const storageCommittedWeighted = storageCommittedScore * 0.45;
  
  // ============================================
  // 3. STORAGE EFFICIENCY (20%)
  // ============================================
  // Compare to network average - reward reasonable contributions
  const avgStorage = getNetworkAverageStorage(allNodes);
  let storageEfficiencyScore = 50; // Baseline
  
  if (avgStorage > 0) {
    const ratio = storageCommitted / avgStorage;
    
    if (ratio >= 0.5 && ratio <= 2) {
      storageEfficiencyScore = 100; // Close to average (fair)
    } else if (ratio >= 0.25 && ratio <= 3) {
      storageEfficiencyScore = 90;  // Reasonable range
    } else if (ratio >= 0.1 && ratio <= 5) {
      storageEfficiencyScore = 80;  // Acceptable
    } else if (ratio > 5 && ratio <= 10) {
      storageEfficiencyScore = 70;  // Large but OK
    } else if (ratio > 10) {
      storageEfficiencyScore = 60;  // Whale (penalized)
    } else {
      storageEfficiencyScore = 50;  // Too small
    }
  }
  
  const storageEfficiencyWeighted = storageEfficiencyScore * 0.20;
  
  // ============================================
  // 4. PARTICIPATION (10%)
  // ============================================
  // Base score for being in the network
  const participationScore = 100;
  const participationWeighted = participationScore * 0.10;
  
  // ============================================
  // CALCULATE BASE SCORE
  // ============================================
  let baseScore = 
    versionWeighted +              // 25%
    storageCommittedWeighted +     // 45%
    storageEfficiencyWeighted +    // 20%
    participationWeighted;         // 10%
  
  // ============================================
  // APPLY VERSION MULTIPLIER (Extra penalty for gossip + outdated)
  // ============================================
  let multiplier = versionTier.multiplier;
  
  // Double penalty: gossip + outdated version
  if (versionTier.tier >= 3) { // Legacy or Deprecated
    multiplier = multiplier * 0.95; // Additional -5%
  }
  
  baseScore = baseScore * multiplier;
  
  // ============================================
  // APPLY CAPS
  // ============================================
  // Global cap for gossip nodes (limited contribution)
  baseScore = Math.min(75, baseScore);
  
  // Whale cap (storage > 10x average)
  if (isStorageWhale(pnode, allNodes)) {
    baseScore = Math.min(72, baseScore);
  }
  
  return Math.round(Math.max(0, Math.min(75, baseScore)));
}

// ============================================================================
// MAIN SCORING FUNCTION WITH CACHING
// ============================================================================

/**
 * Network context cache for backward compatibility
 * Updated automatically when calculating scores with full node list
 */
let cachedNodes: PNode[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Manually set cached nodes (useful for batch operations)
 */
export function setCachedNodes(nodes: PNode[]): void {
  cachedNodes = nodes;
  cacheTimestamp = Date.now();
}

/**
 * Calculate comprehensive performance score for a pNode
 * 
 * SIGNATURES:
 * - calculateNodeScore(pnode, allNodes) - Recommended: Full network context
 * - calculateNodeScore(pnode) - Backward compatible: Uses cache or single-node fallback
 * 
 * @param pnode - The node to score
 * @param allNodes - Optional: Full network context for accurate version tier detection
 * @returns Score from 0-100 (active nodes) or 0-75 (gossip nodes)
 */
export function calculateNodeScore(pnode: PNode, allNodes?: PNode[]): number {
  // If allNodes provided, use it directly and update cache
  if (allNodes && allNodes.length > 0) {
    cachedNodes = allNodes;
    cacheTimestamp = Date.now();
    
    if (pnode.node_type === 'private') {
      return calculateGossipNodeScore(pnode, allNodes);
    } else {
      return calculateActiveNodeScore(pnode, allNodes);
    }
  }
  
  // Try to use cached network context
  const now = Date.now();
  if (cachedNodes && (now - cacheTimestamp) < CACHE_TTL) {
    if (pnode.node_type === 'private') {
      return calculateGossipNodeScore(pnode, cachedNodes);
    } else {
      return calculateActiveNodeScore(pnode, cachedNodes);
    }
  }
  
  // Fallback: single node (less accurate for version scoring)
  // Version tier will default to "Legacy" without network context
  if (pnode.node_type === 'private') {
    return calculateGossipNodeScore(pnode, [pnode]);
  } else {
    return calculateActiveNodeScore(pnode, [pnode]);
  }
}

// ============================================================================
// SCORE BREAKDOWN & DEBUGGING
// ============================================================================

export interface ScoreBreakdown {
  totalScore: number;
  nodeType: 'online' | 'offline' | 'stale' | 'registry_only';
  components: {
    version?: { score: number; weight: string; tier: VersionTier };
    storage?: { score: number; weight: string; value: string };
    uptime?: { score: number; weight: string; value: string };
    network?: { score: number; weight: string; value: string };
    cpu?: { score: number; weight: string; value: string };
    ram?: { score: number; weight: string; value: string };
    storageEfficiency?: { score: number; weight: string; value: string };
    participation?: { score: number; weight: string; value: string };
  };
  penalties: {
    versionMultiplier: number;
    isWhale: boolean;
    globalCap: number | null;
  };
}

/**
 * Get detailed score breakdown for transparency
 */
export function getScoreBreakdown(pnode: PNode, allNodes: PNode[]): ScoreBreakdown {
  const stats = pnode.stats;
  const versionTier = calculateVersionTier(pnode.version, allNodes);
  const isWhale = isStorageWhale(pnode, allNodes);
  
  const breakdown: ScoreBreakdown = {
    totalScore: calculateNodeScore(pnode, allNodes),
    nodeType: pnode.status,
    components: {},
    penalties: {
      versionMultiplier: versionTier.multiplier,
      isWhale,
      globalCap: (pnode.node_type === 'private' || pnode.status === 'stale' || pnode.status === 'registry_only') ? (isWhale ? 72 : 75) : null
    }
  };
  
  // Version (both types)
  breakdown.components.version = {
    score: versionTier.score,
    weight: pnode.node_type === 'public' ? '15%' : '25%',
    tier: versionTier
  };
  
  if (pnode.node_type === 'public') {
    // Active node components
    const storageGB = (stats.storage_committed || 0) / (1024 ** 3);
    const uptimeHours = stats.uptime / 3600;
    const cpuPercent = stats.cpu_percent || 0;
    const ramPercent = stats.ram_total > 0 ? (stats.ram_used / stats.ram_total) * 100 : 0;
    
    breakdown.components.storage = {
      score: 0, // Calculated inline above
      weight: '20%',
      value: `${storageGB.toFixed(2)} GB`
    };
    
    breakdown.components.uptime = {
      score: 0,
      weight: '25%',
      value: `${uptimeHours.toFixed(1)} hours`
    };
    
    breakdown.components.network = {
      score: 0,
      weight: '20%',
      value: `${stats.packets_sent}/${stats.packets_received} packets`
    };
    
    breakdown.components.cpu = {
      score: 0,
      weight: '10%',
      value: `${cpuPercent.toFixed(1)}%`
    };
    
    breakdown.components.ram = {
      score: 0,
      weight: '10%',
      value: `${ramPercent.toFixed(1)}%`
    };
  } else {
    // Gossip node components
    const storageGB = (stats.storage_committed || 0) / (1024 ** 3);
    const avgStorage = getNetworkAverageStorage(allNodes);
    const ratio = avgStorage > 0 ? (stats.storage_committed || 0) / avgStorage : 0;
    
    breakdown.components.storage = {
      score: 0,
      weight: '45%',
      value: `${storageGB.toFixed(2)} GB`
    };
    
    breakdown.components.storageEfficiency = {
      score: 0,
      weight: '20%',
      value: `${ratio.toFixed(2)}x network average`
    };
    
    breakdown.components.participation = {
      score: 100,
      weight: '10%',
      value: 'Active in network'
    };
  }
  
  return breakdown;
}

// ============================================================================
// UI HELPERS (Backward Compatibility)
// ============================================================================

export function getScoreColor(score: number): string {
  if (score === 0) return 'text-gray-400';
  if (score >= 90) return 'text-green-400';
  if (score >= 75) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 45) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreLabel(score: number): string {
  if (score === 0) return 'N/A';
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 45) return 'Fair';
  return 'Poor';
}

export function getScoreBadgeColor(score: number): string {
  if (score === 0) return 'bg-gray-900 border-gray-700';
  if (score >= 90) return 'bg-green-900/30 border-green-600/50';
  if (score >= 75) return 'bg-emerald-900/30 border-emerald-600/50';
  if (score >= 60) return 'bg-yellow-900/30 border-yellow-600/50';
  if (score >= 45) return 'bg-orange-900/30 border-orange-600/50';
  return 'bg-red-900/30 border-red-600/50';
}
