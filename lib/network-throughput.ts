/**
 * Network Throughput Utilities
 * 
 * Provides functions to calculate and analyze network throughput metrics
 * including bandwidth, latency, packet loss, and trends.
 */

import { type PNode, type NetworkType } from './types';

// Constants
const DEFAULT_PACKET_SIZE_BYTES = 1500; // Standard Ethernet MTU
const BYTES_TO_BITS = 8;
const BITS_TO_MEGABITS = 1_000_000;

/**
 * Network Throughput Metrics
 */
export interface NetworkThroughputMetrics {
  // Basic metrics
  packetsPerSecond: number;
  reportingNodes: number;
  totalActiveNodes: number;
  
  // Bandwidth metrics
  bandwidth: {
    current: number;        // Mbps
    perNode: number;        // Mbps per reporting node
    formattedCurrent: string;
  };
  
  // Trend analysis
  trend: {
    direction: 'up' | 'down' | 'stable';
    changePercent: number;
    indicator: '↑' | '↓' | '→';
  };
  
  // Network breakdown
  breakdown: {
    mainnet: NetworkBreakdown;
    devnet: NetworkBreakdown;
  };
}

export interface NetworkBreakdown {
  packetsPerSecond: number;
  bandwidth: number;           // Mbps
  activeNodes: number;
  reportingNodes: number;
  formattedBandwidth: string;
}

/**
 * Calculate bandwidth in Mbps from packets per second
 */
export function calculateBandwidth(
  packetsPerSecond: number, 
  avgPacketSizeBytes: number = DEFAULT_PACKET_SIZE_BYTES
): number {
  if (packetsPerSecond <= 0) return 0;
  
  const bytesPerSecond = packetsPerSecond * avgPacketSizeBytes;
  const bitsPerSecond = bytesPerSecond * BYTES_TO_BITS;
  const megabitsPerSecond = bitsPerSecond / BITS_TO_MEGABITS;
  
  return megabitsPerSecond;
}

/**
 * Format bandwidth for display
 */
export function formatBandwidth(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(2)} Gbps`;
  } else if (mbps >= 1) {
    return `${mbps.toFixed(1)} Mbps`;
  } else if (mbps >= 0.001) {
    return `${(mbps * 1000).toFixed(0)} Kbps`;
  } else {
    return `${(mbps * 1000000).toFixed(0)} bps`;
  }
}

/**
 * Calculate trend direction and percentage change
 */
export function calculateTrend(
  current: number,
  previous: number
): {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
  indicator: '↑' | '↓' | '→';
} {
  if (previous === 0) {
    return {
      direction: current > 0 ? 'up' : 'stable',
      changePercent: current > 0 ? 100 : 0,
      indicator: current > 0 ? '↑' : '→'
    };
  }
  
  const change = current - previous;
  const changePercent = (change / previous) * 100;
  
  // Consider < 5% change as stable
  const threshold = 5;
  
  if (Math.abs(changePercent) < threshold) {
    return {
      direction: 'stable',
      changePercent: 0,
      indicator: '→'
    };
  }
  
  return {
    direction: changePercent > 0 ? 'up' : 'down',
    changePercent: Math.abs(changePercent),
    indicator: changePercent > 0 ? '↑' : '↓'
  };
}

/**
 * Calculate network breakdown by MAINNET and DEVNET
 */
export function calculateNetworkBreakdown(
  nodes: PNode[]
): {
  mainnet: NetworkBreakdown;
  devnet: NetworkBreakdown;
} {
  const mainnetNodes = nodes.filter(n => n.network === 'MAINNET' && n.status === 'online');
  const devnetNodes = nodes.filter(n => n.network === 'DEVNET' && n.status === 'online');
  
  const calculateBreakdown = (networkNodes: PNode[]): NetworkBreakdown => {
    const reportingNodes = networkNodes.filter(n => 
      n.stats?.active_streams !== undefined && 
      n.stats.active_streams > 0
    );
    
    const totalPackets = reportingNodes.reduce((sum, node) => {
      // Estimate packets from active_streams (rough approximation)
      // Assume each stream generates ~100 packets/sec
      const streams = node.stats?.active_streams || 0;
      return sum + (streams * 100);
    }, 0);
    
    const bandwidth = calculateBandwidth(totalPackets);
    
    return {
      packetsPerSecond: totalPackets,
      bandwidth,
      activeNodes: networkNodes.length,
      reportingNodes: reportingNodes.length,
      formattedBandwidth: formatBandwidth(bandwidth)
    };
  };
  
  return {
    mainnet: calculateBreakdown(mainnetNodes),
    devnet: calculateBreakdown(devnetNodes)
  };
}

/**
 * Calculate comprehensive network throughput metrics
 */
export function calculateNetworkThroughput(
  nodes: PNode[],
  previousPacketsPerSecond?: number
): NetworkThroughputMetrics {
  const activeNodes = nodes.filter(n => n.status === 'online');
  
  // Count reporting nodes (those with active_streams data)
  const reportingNodes = activeNodes.filter(n => 
    n.stats?.active_streams !== undefined
  );
  
  // Calculate total packets per second
  // This is an estimation based on active_streams
  const packetsPerSecond = reportingNodes.reduce((sum, node) => {
    const streams = node.stats?.active_streams || 0;
    // Rough estimate: each stream generates ~100 packets/sec
    return sum + (streams * 100);
  }, 0);
  
  // Calculate bandwidth
  const currentBandwidth = calculateBandwidth(packetsPerSecond);
  const perNodeBandwidth = reportingNodes.length > 0 
    ? currentBandwidth / reportingNodes.length 
    : 0;
  
  // Calculate trend
  const trend = previousPacketsPerSecond !== undefined
    ? calculateTrend(packetsPerSecond, previousPacketsPerSecond)
    : { direction: 'stable' as const, changePercent: 0, indicator: '→' as const };
  
  // Calculate network breakdown
  const breakdown = calculateNetworkBreakdown(nodes);
  
  return {
    packetsPerSecond,
    reportingNodes: reportingNodes.length,
    totalActiveNodes: activeNodes.length,
    bandwidth: {
      current: currentBandwidth,
      perNode: perNodeBandwidth,
      formattedCurrent: formatBandwidth(currentBandwidth)
    },
    trend,
    breakdown
  };
}

/**
 * Calculate average latency (P50 - median)
 */
export function calculateLatencyP50(latencies: number[]): number {
  if (latencies.length === 0) return 0;
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  }
  
  return sorted[midpoint];
}

/**
 * Calculate P95 latency (95th percentile)
 */
export function calculateLatencyP95(latencies: number[]): number {
  if (latencies.length === 0) return 0;
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;
  
  return sorted[Math.max(0, index)];
}

/**
 * Calculate P99 latency (99th percentile)
 */
export function calculateLatencyP99(latencies: number[]): number {
  if (latencies.length === 0) return 0;
  
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.99) - 1;
  
  return sorted[Math.max(0, index)];
}

/**
 * Calculate packet loss rate
 */
export function calculatePacketLoss(
  packetsSent: number,
  packetsReceived: number
): {
  rate: number;
  percentage: string;
} {
  if (packetsSent === 0) {
    return { rate: 0, percentage: '0.00%' };
  }
  
  const lostPackets = packetsSent - packetsReceived;
  const lossRate = (lostPackets / packetsSent) * 100;
  
  return {
    rate: Math.max(0, lossRate),
    percentage: `${Math.max(0, lossRate).toFixed(2)}%`
  };
}

/**
 * Determine network quality based on metrics
 */
export function assessNetworkQuality(metrics: {
  bandwidth: number;
  latencyP95?: number;
  packetLossRate?: number;
}): 'excellent' | 'good' | 'fair' | 'poor' {
  const { bandwidth, latencyP95 = 0, packetLossRate = 0 } = metrics;
  
  // Scoring criteria
  let score = 0;
  
  // Bandwidth scoring (40 points max)
  if (bandwidth >= 100) score += 40;
  else if (bandwidth >= 50) score += 30;
  else if (bandwidth >= 10) score += 20;
  else if (bandwidth >= 1) score += 10;
  
  // Latency scoring (30 points max)
  if (latencyP95 === 0 || latencyP95 <= 50) score += 30;
  else if (latencyP95 <= 100) score += 20;
  else if (latencyP95 <= 200) score += 10;
  
  // Packet loss scoring (30 points max)
  if (packetLossRate <= 0.1) score += 30;
  else if (packetLossRate <= 0.5) score += 20;
  else if (packetLossRate <= 1.0) score += 10;
  
  // Convert score to quality rating
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}
