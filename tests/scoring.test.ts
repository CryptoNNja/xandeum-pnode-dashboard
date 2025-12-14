
import { describe, it, expect } from 'vitest';
import { calculateNodeScore, getScoreColor, getScoreLabel, getScoreBadgeColor } from '../lib/scoring';
import type { PNode } from '../lib/types';

// Helper to create a mock PNode object
const createMockNode = (stats: Partial<PNode['stats']>, status: PNode['status'] = 'active'): PNode => ({
  ip: '127.0.0.1',
  status,
  version: 'v0.7.0',
  stats: {
    cpu_percent: 0,
    ram_used: 0,
    ram_total: 16 * 1e9, // 16GB
    uptime: 30 * 24 * 3600 + 1, // > 30 days
    packets_sent: 1000,
    packets_received: 1000,
    ...stats,
  },
});

describe('calculateNodeScore', () => {
  it('should return 0 for a gossip_only node', () => {
    const node = createMockNode({}, 'gossip_only');
    expect(calculateNodeScore(node)).toBe(0);
  });

  it('should return 0 for a node with 0 uptime', () => {
    const node = createMockNode({ uptime: 0 });
    expect(calculateNodeScore(node)).toBe(0);
  });

  it('should return a high score for a healthy node', () => {
    const node = createMockNode({
      cpu_percent: 10, // low cpu
      ram_used: 4 * 1e9, // 25% ram usage
      uptime: 31 * 24 * 3600, // > 30 days
      packets_sent: 10000,
      packets_received: 9000, // ratio ~1.1
    });
    // cpu: (100-10)*0.4 = 36
    // ram: (100-25)*0.25 = 18.75
    // uptime: 100 * 0.2 = 20
    // stability: 100 * 0.15 = 15
    // total = 36 + 18.75 + 20 + 15 = 89.75 -> rounded to 90
    expect(calculateNodeScore(node)).toBe(90);
  });

  it('should penalize high CPU usage', () => {
    const node = createMockNode({ cpu_percent: 95 });
    // cpu: (100-95)*0.4 = 2
    // ram: (100-0)*0.25 = 25
    // uptime: 100*0.2 = 20
    // stability: 100*0.15 = 15
    // total = 2 + 25 + 20 + 15 = 62
    expect(calculateNodeScore(node)).toBe(62);
  });

  it('should penalize high RAM usage', () => {
    const node = createMockNode({ ram_used: 15 * 1e9 }); // ~94% ram
    // cpu: 100*0.4 = 40
    // ram: (100-94)*0.25 = 1.5
    // uptime: 100*0.2 = 20
    // stability: 100*0.15 = 15
    // total = 40 + 1.5 + 20 + 15 = 76.5 -> 77
    expect(calculateNodeScore(node)).toBe(77);
  });

  it('should handle zero RAM total gracefully', () => {
    const node = createMockNode({ ram_total: 0, ram_used: 0 });
     // cpu: 100*0.4 = 40
    // ram: (100-0)*0.25 = 25
    // uptime: 100*0.2 = 20
    // stability: 100*0.15 = 15
    // total = 40 + 25 + 20 + 15 = 100
    expect(calculateNodeScore(node)).toBe(100);
  });

  it('should penalize low uptime', () => {
    const node = createMockNode({ uptime: 2 * 3600 }); // 2 hours
    // cpu: 100*0.4 = 40
    // ram: 100*0.25 = 25
    // uptime: 25 * 0.2 = 5
    // stability: 100*0.15 = 15
    // total = 40 + 25 + 5 + 15 = 85
    expect(calculateNodeScore(node)).toBe(85);
  });

  it('should penalize network instability', () => {
    const node = createMockNode({ packets_sent: 10000, packets_received: 1000 }); // ratio 10
    // cpu: 100*0.4 = 40
    // ram: 100*0.25 = 25
    // uptime: 100*0.2 = 20
    // stability: 40 * 0.15 = 6
    // total = 40 + 25 + 20 + 6 = 91
    expect(calculateNodeScore(node)).toBe(91);
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
