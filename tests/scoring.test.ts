
import { describe, it, expect } from 'vitest';
import { 
  calculateNodeScore, 
  getScoreColor, 
  getScoreLabel, 
  getScoreBadgeColor,
  detectConsensusVersion,
  calculateVersionTier,
  getNetworkAverageStorage,
  isStorageWhale
} from '../lib/scoring';
import type { PNode, PNodeStats } from '../lib/types';
import { EMPTY_STATS } from '../lib/types';

// Helper to create a mock PNode object
const createMockNode = (stats: Partial<PNodeStats>, status: PNode['status'] = 'active', version: string = '0.8.0'): PNode => ({
  ip: '127.0.0.1',
  status,
  version,
  stats: {
    ...EMPTY_STATS,
    ram_total: 16 * 1e9, // 16GB
    uptime: 30 * 24 * 3600 + 1, // > 30 days
    packets_sent: 1000,
    packets_received: 1000,
    storage_committed: 100 * 1e9, // 100GB default
    ...stats,
  },
});

// Helper to create a network of nodes for testing
const createMockNetwork = (count: number, consensusVersion: string = '0.8.0'): PNode[] => {
  const nodes: PNode[] = [];
  for (let i = 0; i < count; i++) {
    const version = i < count * 0.7 ? consensusVersion : '0.7.3'; // 70% on consensus
    nodes.push(createMockNode({
      storage_committed: (100 + i * 10) * 1e9,
    }, 'active', version));
  }
  return nodes;
};

describe('calculateNodeScore', () => {
  describe('Active Nodes', () => {
    it('should return 0 for a node with 0 uptime and no storage', () => {
      const network = createMockNetwork(10);
      const node = createMockNode({ uptime: 0, storage_committed: 0 });
      expect(calculateNodeScore(node, network)).toBe(0);
    });

    it('should return a high score for a healthy node on consensus version', () => {
      const network = createMockNetwork(10, '0.8.0');
      const node = createMockNode({
        cpu_percent: 10,
        ram_used: 4 * 1e9, // 25% ram
        uptime: 31 * 24 * 3600, // >30 days
        packets_sent: 10000,
        packets_received: 9000, // ratio ~1.1
        storage_committed: 200 * 1e9, // 200GB
      }, 'active', '0.8.0');
      
      const score = calculateNodeScore(node, network);
      // Should be high (85+) with: version 100, good storage, perfect uptime, good network, low CPU/RAM
      expect(score).toBeGreaterThanOrEqual(85);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize outdated versions', () => {
      const network = createMockNetwork(10, '0.8.0');
      const nodeConsensus = createMockNode({
        cpu_percent: 10,
        uptime: 31 * 24 * 3600,
      }, 'active', '0.8.0');
      const nodeOutdated = createMockNode({
        cpu_percent: 10,
        uptime: 31 * 24 * 3600,
      }, 'active', '0.7.3'); // Outdated
      
      const scoreConsensus = calculateNodeScore(nodeConsensus, network);
      const scoreOutdated = calculateNodeScore(nodeOutdated, network);
      
      // Outdated should score lower due to version penalty
      expect(scoreOutdated).toBeLessThan(scoreConsensus);
    });

    it('should penalize trynet builds', () => {
      const network = createMockNetwork(10, '0.8.0');
      const nodeStable = createMockNode({}, 'active', '0.8.0');
      const nodeTrynet = createMockNode({}, 'active', '0.8.0-trynet.20251212183600');
      
      const scoreStable = calculateNodeScore(nodeStable, network);
      const scoreTrynet = calculateNodeScore(nodeTrynet, network);
      
      // Trynet should score lower (0.85x multiplier)
      expect(scoreTrynet).toBeLessThan(scoreStable);
    });

    it('should reward storage contribution', () => {
      const network = createMockNetwork(10);
      const nodeSmallStorage = createMockNode({ storage_committed: 50 * 1e9 }); // 50GB
      const nodeLargeStorage = createMockNode({ storage_committed: 500 * 1e9 }); // 500GB
      
      const scoreSmall = calculateNodeScore(nodeSmallStorage, network);
      const scoreLarge = calculateNodeScore(nodeLargeStorage, network);
      
      // Larger storage should contribute to higher score
      expect(scoreLarge).toBeGreaterThan(scoreSmall);
    });

    it('should penalize high CPU usage', () => {
      const network = createMockNetwork(10);
      const nodeLowCpu = createMockNode({ cpu_percent: 20 });
      const nodeHighCpu = createMockNode({ cpu_percent: 90 });
      
      const scoreLow = calculateNodeScore(nodeLowCpu, network);
      const scoreHigh = calculateNodeScore(nodeHighCpu, network);
      
      expect(scoreHigh).toBeLessThan(scoreLow);
    });

    it('should reward high uptime', () => {
      const network = createMockNetwork(10);
      const nodeShortUptime = createMockNode({ uptime: 6 * 3600 }); // 6 hours
      const nodeLongUptime = createMockNode({ uptime: 30 * 24 * 3600 }); // 30 days
      
      const scoreShort = calculateNodeScore(nodeShortUptime, network);
      const scoreLong = calculateNodeScore(nodeLongUptime, network);
      
      expect(scoreLong).toBeGreaterThan(scoreShort);
    });
  });

  describe('Gossip-Only Nodes', () => {
    it('should cap gossip nodes at 75 maximum', () => {
      const network = createMockNetwork(10);
      const gossipNode = createMockNode({
        storage_committed: 5000 * 1e9, // 5TB - huge
      }, 'gossip_only', '0.8.0');
      
      const score = calculateNodeScore(gossipNode, network);
      expect(score).toBeLessThanOrEqual(75);
    });

    it('should cap whale gossip nodes at 72', () => {
      const network = createMockNetwork(10);
      const avgStorage = getNetworkAverageStorage(network);
      
      const whaleNode = createMockNode({
        storage_committed: avgStorage * 15, // 15x average (whale!)
      }, 'gossip_only', '0.8.0');
      
      expect(isStorageWhale(whaleNode, network)).toBe(true);
      
      const score = calculateNodeScore(whaleNode, network);
      expect(score).toBeLessThanOrEqual(72);
    });

    it('should give minimal score for gossip node without storage', () => {
      const network = createMockNetwork(10);
      const node = createMockNode({ storage_committed: 0 }, 'gossip_only');
      
      const score = calculateNodeScore(node, network);
      expect(score).toBe(15); // Base participation score
    });

    it('should penalize gossip nodes with outdated versions more', () => {
      const network = createMockNetwork(10, '0.8.0');
      const nodeConsensus = createMockNode({
        storage_committed: 200 * 1e9,
      }, 'gossip_only', '0.8.0');
      const nodeOutdated = createMockNode({
        storage_committed: 200 * 1e9,
      }, 'gossip_only', '0.7.3');
      
      const scoreConsensus = calculateNodeScore(nodeConsensus, network);
      const scoreOutdated = calculateNodeScore(nodeOutdated, network);
      
      // Double penalty for gossip + outdated
      expect(scoreOutdated).toBeLessThan(scoreConsensus);
    });
  });

  describe('Network Context', () => {
    it('should work without network context (backward compatibility)', () => {
      const node = createMockNode({});
      const score = calculateNodeScore(node); // No network context
      
      // Should still calculate a score
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});

describe('Version Consensus Detection', () => {
  it('should detect the most common version as consensus', () => {
    const network = createMockNetwork(10, '0.8.0');
    const consensus = detectConsensusVersion(network);
    
    expect(consensus).toBe('0.8.0');
  });

  it('should return null for empty network', () => {
    const consensus = detectConsensusVersion([]);
    expect(consensus).toBeNull();
  });

  it('should ignore gossip-only nodes when detecting consensus', () => {
    const nodes: PNode[] = [
      createMockNode({}, 'active', '0.8.0'),
      createMockNode({}, 'active', '0.8.0'),
      createMockNode({}, 'gossip_only', '0.7.3'),
      createMockNode({}, 'gossip_only', '0.7.3'),
      createMockNode({}, 'gossip_only', '0.7.3'),
    ];
    
    const consensus = detectConsensusVersion(nodes);
    expect(consensus).toBe('0.8.0'); // Based on active nodes only
  });
});

describe('Version Tier Calculation', () => {
  it('should assign Tier 1 (Consensus) for majority version', () => {
    const network = createMockNetwork(10, '0.8.0');
    const tier = calculateVersionTier('0.8.0', network);
    
    expect(tier.tier).toBe(1);
    expect(tier.name).toBe('Consensus');
    expect(tier.score).toBe(100);
    expect(tier.multiplier).toBe(1.0);
  });

  it('should assign Tier 4 (Deprecated) for trynet builds', () => {
    const network = createMockNetwork(10, '0.8.0');
    const tier = calculateVersionTier('0.8.0-trynet.123', network);
    
    expect(tier.tier).toBe(4);
    expect(tier.name).toBe('Deprecated');
    expect(tier.multiplier).toBe(0.85);
  });

  it('should assign Tier 4 for unknown version', () => {
    const network = createMockNetwork(10);
    const tier = calculateVersionTier(undefined, network);
    
    expect(tier.tier).toBe(4);
    expect(tier.name).toBe('Deprecated');
    expect(tier.multiplier).toBe(0.75);
  });
});

describe('Storage Whale Detection', () => {
  it('should detect nodes with 10x average storage', () => {
    const network = createMockNetwork(10);
    const avgStorage = getNetworkAverageStorage(network);
    
    const whaleNode = createMockNode({ storage_committed: avgStorage * 12 });
    const normalNode = createMockNode({ storage_committed: avgStorage * 1.5 });
    
    expect(isStorageWhale(whaleNode, network)).toBe(true);
    expect(isStorageWhale(normalNode, network)).toBe(false);
  });

  it('should return false when network has no storage', () => {
    const network = [createMockNode({ storage_committed: 0 })];
    const node = createMockNode({ storage_committed: 1000 * 1e9 });
    
    expect(isStorageWhale(node, network)).toBe(false);
  });
});

describe('getScoreColor', () => {
  it('should return the correct color for different scores', () => {
    expect(getScoreColor(0)).toBe('text-gray-400');
    expect(getScoreColor(95)).toBe('text-green-400');
    expect(getScoreColor(80)).toBe('text-emerald-400');
    expect(getScoreColor(65)).toBe('text-yellow-400');
    expect(getScoreColor(50)).toBe('text-orange-400');
    expect(getScoreColor(30)).toBe('text-red-400');
  });
});

describe('getScoreLabel', () => {
    it('should return the correct label for different scores', () => {
        expect(getScoreLabel(0)).toBe('N/A');
        expect(getScoreLabel(95)).toBe('Excellent');
        expect(getScoreLabel(80)).toBe('Very Good');
        expect(getScoreLabel(65)).toBe('Good');
        expect(getScoreLabel(50)).toBe('Fair');
        expect(getScoreLabel(30)).toBe('Poor');
    });
});

describe('getScoreBadgeColor', () => {
    it('should return the correct badge color class for different scores', () => {
        expect(getScoreBadgeColor(0)).toBe('bg-gray-900 border-gray-700');
        expect(getScoreBadgeColor(95)).toBe('bg-green-900/30 border-green-600/50');
        expect(getScoreBadgeColor(80)).toBe('bg-emerald-900/30 border-emerald-600/50');
        expect(getScoreBadgeColor(65)).toBe('bg-yellow-900/30 border-yellow-600/50');
        expect(getScoreBadgeColor(50)).toBe('bg-orange-900/30 border-orange-600/50');
        expect(getScoreBadgeColor(30)).toBe('bg-red-900/30 border-red-600/50');
    });
});
