/**
 * Multi-Source Confidence Scoring System
 * 
 * Calculates confidence scores based on multiple data sources:
 * - Official APIs (MAINNET/DEVNET registries)
 * - Gossip Discovery (P2P network)
 * - RPC Verification (Direct metrics)
 */

export type ConfidenceSource = 'official_api' | 'gossip' | 'rpc' | 'mainnet_registry' | 'devnet_registry';

export interface ConfidenceData {
  score: number;                    // 0-100
  sources: ConfidenceSource[];      // Array of sources
  primary: 'api' | 'discovery';     // Primary source
  verified: boolean;                // Has RPC metrics
  level: 'confirmed' | 'validated' | 'discovered' | 'uncertain';
}

export interface PNodeForScoring {
  ip: string;
  pubkey?: string | null;
  network: 'MAINNET' | 'DEVNET';
  stats?: any;
  storage_committed?: number;
  storage_used?: number;
}

/**
 * Calculate confidence score for a node
 */
export function calculateConfidence(
  node: PNodeForScoring,
  mainnetRegistry: Set<string>,
  devnetRegistry: Set<string>
): ConfidenceData {
  const sources: ConfidenceSource[] = [];
  let score = 0;
  let primary: 'api' | 'discovery' = 'discovery';

  const pubkey = node.pubkey || '';
  const hasRPCMetrics = hasValidRPCMetrics(node);
  const isPrivate = node.ip.startsWith('PRIVATE-');

  if (node.network === 'MAINNET') {
    // MAINNET: API-driven (strict validation)
    primary = 'api';

    if (mainnetRegistry.has(pubkey)) {
      sources.push('official_api', 'mainnet_registry');
      score += 70; // API is mandatory for MAINNET
    } else {
      // Not in official MAINNET API = likely misclassified
      return {
        score: 0,
        sources: [],
        primary: 'api',
        verified: false,
        level: 'uncertain'
      };
    }

    // Gossip discovery (public node)
    if (!isPrivate) {
      sources.push('gossip');
      score += 15;
    }

    // RPC verification
    if (hasRPCMetrics) {
      sources.push('rpc');
      score += 15;
    }

  } else {
    // DEVNET: Discovery-driven (permissive)
    primary = 'discovery';

    // Gossip discovery (primary source)
    if (!isPrivate) {
      sources.push('gossip');
      score += 50;
    }

    // RPC verification
    if (hasRPCMetrics) {
      sources.push('rpc');
      score += 30;
    }

    // Official API (bonus confirmation)
    if (devnetRegistry.has(pubkey)) {
      sources.push('official_api', 'devnet_registry');
      score += 20;
    }
  }

  // Determine confidence level
  const level = getConfidenceLevel(score);

  return {
    score,
    sources,
    primary,
    verified: hasRPCMetrics,
    level
  };
}

/**
 * Check if node has valid RPC metrics
 */
function hasValidRPCMetrics(node: PNodeForScoring): boolean {
  if (!node.stats) return false;

  // Check if node has meaningful metrics (not all zeros)
  const hasStats = 
    (node.stats.uptime && node.stats.uptime > 0) ||
    (node.stats.cpu_percent && node.stats.cpu_percent > 0) ||
    (node.stats.ram_used && node.stats.ram_used > 0) ||
    (node.storage_committed && node.storage_committed > 0);

  return hasStats;
}

/**
 * Get confidence level label based on score
 */
function getConfidenceLevel(score: number): 'confirmed' | 'validated' | 'discovered' | 'uncertain' {
  if (score >= 85) return 'confirmed';    // 🟢 Multiple sources
  if (score >= 70) return 'validated';    // 🟡 At least 2 sources
  if (score >= 50) return 'discovered';   // 🔵 Discovery-only (valid)
  return 'uncertain';                      // ⚠️ Low confidence
}

/**
 * Get badge color for confidence level
 */
export function getConfidenceBadgeColor(level: ConfidenceData['level']): {
  bg: string;
  text: string;
  icon: string;
} {
  switch (level) {
    case 'confirmed':
      return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: '✓✓✓' };
    case 'validated':
      return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: '✓✓' };
    case 'discovered':
      return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: '✓' };
    case 'uncertain':
      return { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-400', icon: '?' };
  }
}

/**
 * Get human-readable description of sources
 */
export function getSourcesDescription(sources: ConfidenceSource[]): string {
  const labels: Record<ConfidenceSource, string> = {
    official_api: 'Official API',
    mainnet_registry: 'MAINNET Registry',
    devnet_registry: 'DEVNET Registry',
    gossip: 'Gossip Discovery',
    rpc: 'RPC Verified'
  };

  return sources.map(s => labels[s] || s).join(' + ');
}
