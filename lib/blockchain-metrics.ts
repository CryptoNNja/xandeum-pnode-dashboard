import type { PNode } from "./types";

/**
 * Network-wide blockchain synchronization metrics
 */
export interface NetworkSyncMetrics {
  maxBlockHeight: number;
  avgBlockHeight: number;
  syncedCount: number;
  laggingCount: number;
  behindCount: number;
  totalActive: number;
  syncPercent: number;
  laggingNodes: Array<{
    ip: string | null;
    currentIndex: number;
    blocksBehind: number;
    syncPercent: number;
  }>;
}

/**
 * Network participation metrics based on Xandeum credits
 */
export interface NetworkParticipationMetrics {
  totalPods: number;
  podsEarning: number;
  podsInactive: number;
  participationRate: number;
  totalCredits: number;
  avgCredits: number;
  medianCredits: number;
}

/**
 * Individual node sync status
 */
export type SyncStatus = "synced" | "lagging" | "behind";

export interface NodeSyncInfo {
  status: SyncStatus;
  currentIndex: number;
  maxNetworkIndex: number;
  blocksBehind: number;
  syncPercent: number;
}

/**
 * Calculate network-wide synchronization metrics
 * 
 * @param pnodes - All pNodes in the network
 * @returns Network sync statistics
 */
export function calculateNetworkSyncMetrics(pnodes: PNode[]): NetworkSyncMetrics {
  const activeNodes = pnodes.filter(p => p.node_type === "public");
  
  if (activeNodes.length === 0) {
    return {
      maxBlockHeight: 0,
      avgBlockHeight: 0,
      syncedCount: 0,
      laggingCount: 0,
      behindCount: 0,
      totalActive: 0,
      syncPercent: 0,
      laggingNodes: []
    };
  }

  // Find max block height in the network
  const maxBlockHeight = Math.max(
    ...activeNodes.map(p => p.stats?.current_index ?? 0)
  );

  // Calculate average block height
  const totalBlocks = activeNodes.reduce(
    (sum, p) => sum + (p.stats?.current_index ?? 0),
    0
  );
  const avgBlockHeight = Math.round(totalBlocks / activeNodes.length);

  // Categorize nodes by sync status
  const thresholds = {
    synced: 1_000,      // < 1K blocks behind = synced
    lagging: 10_000,    // 1K-10K blocks behind = lagging
    // > 10K blocks behind = behind
  };

  let syncedCount = 0;
  let laggingCount = 0;
  let behindCount = 0;
  const laggingNodes: NetworkSyncMetrics["laggingNodes"] = [];

  activeNodes.forEach(node => {
    const currentIndex = node.stats?.current_index ?? 0;
    const blocksBehind = maxBlockHeight - currentIndex;
    const syncPercent = maxBlockHeight > 0 
      ? (currentIndex / maxBlockHeight) * 100 
      : 100;

    if (blocksBehind < thresholds.synced) {
      syncedCount++;
    } else if (blocksBehind < thresholds.lagging) {
      laggingCount++;
      laggingNodes.push({
        ip: node.ip,
        currentIndex,
        blocksBehind,
        syncPercent
      });
    } else {
      behindCount++;
      laggingNodes.push({
        ip: node.ip,
        currentIndex,
        blocksBehind,
        syncPercent
      });
    }
  });

  // Sort lagging nodes by blocks behind (worst first)
  laggingNodes.sort((a, b) => b.blocksBehind - a.blocksBehind);

  const syncPercent = activeNodes.length > 0
    ? (syncedCount / activeNodes.length) * 100
    : 0;

  return {
    maxBlockHeight,
    avgBlockHeight,
    syncedCount,
    laggingCount,
    behindCount,
    totalActive: activeNodes.length,
    syncPercent,
    laggingNodes
  };
}

/**
 * Get sync status for an individual node
 * 
 * @param node - The pNode to check
 * @param maxNetworkIndex - Maximum block height in the network
 * @returns Node sync information
 */
export function getNodeSyncInfo(
  node: PNode,
  maxNetworkIndex: number
): NodeSyncInfo {
  if (node.node_type !== "public") {
    return {
      status: "behind",
      currentIndex: 0,
      maxNetworkIndex,
      blocksBehind: maxNetworkIndex,
      syncPercent: 0
    };
  }

  const currentIndex = node.stats?.current_index ?? 0;
  const blocksBehind = Math.max(0, maxNetworkIndex - currentIndex);
  const syncPercent = maxNetworkIndex > 0 
    ? (currentIndex / maxNetworkIndex) * 100 
    : 100;

  let status: SyncStatus = "synced";
  if (blocksBehind >= 10_000) {
    status = "behind";
  } else if (blocksBehind >= 1_000) {
    status = "lagging";
  }

  return {
    status,
    currentIndex,
    maxNetworkIndex,
    blocksBehind,
    syncPercent
  };
}

/**
 * Format block count for display
 * 
 * @param blocks - Number of blocks
 * @returns Formatted string (e.g., "1.2K", "150K", "2.5M")
 */
export function formatBlocks(blocks: number): string {
  if (blocks === 0) return "0";
  
  if (blocks >= 1_000_000) {
    return `${(blocks / 1_000_000).toFixed(1)}M`;
  }
  
  if (blocks >= 1_000) {
    return `${(blocks / 1_000).toFixed(blocks >= 10_000 ? 0 : 1)}K`;
  }
  
  return blocks.toString();
}

/**
 * Get color for sync status
 * 
 * @param status - Sync status
 * @returns Tailwind color class
 */
export function getSyncStatusColor(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "text-green-400";
    case "lagging":
      return "text-yellow-400";
    case "behind":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

/**
 * Get background color for sync status badge
 * 
 * @param status - Sync status
 * @returns Tailwind background class
 */
export function getSyncStatusBg(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "bg-green-900/20";
    case "lagging":
      return "bg-yellow-900/20";
    case "behind":
      return "bg-red-900/20";
    default:
      return "bg-gray-900/20";
  }
}

/**
 * Get border color for sync status badge
 * 
 * @param status - Sync status
 * @returns Tailwind border class
 */
export function getSyncStatusBorder(status: SyncStatus): string {
  switch (status) {
    case "synced":
      return "border-green-600/30";
    case "lagging":
      return "border-yellow-600/30";
    case "behind":
      return "border-red-600/30";
    default:
      return "border-gray-600/30";
  }
}

/**
 * Fetch network participation metrics from credits API
 */
export async function fetchNetworkParticipation(): Promise<NetworkParticipationMetrics | null> {
  try {
    const response = await fetch('/api/pods-credits', { 
      cache: 'no-store',
      next: { revalidate: 300 } 
    });
    
    if (!response.ok) {
      console.error('Failed to fetch participation metrics');
      return null;
    }
    
    const data = await response.json();
    
    return {
      totalPods: data.totalPods,
      podsEarning: data.podsEarning,
      podsInactive: data.podsInactive,
      participationRate: data.participationRate,
      totalCredits: data.totalCredits,
      avgCredits: data.avgCredits,
      medianCredits: data.medianCredits,
    };
  } catch (error) {
    console.error('Error fetching participation metrics:', error);
    return null;
  }
}
