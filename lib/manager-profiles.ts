/**
 * Manager Board - Track multi-node operators
 * 
 * A "manager" is an operator who runs multiple nodes.
 * This module groups nodes by pubkey and provides aggregate statistics.
 */

import type { PNode } from './types';

export interface ManagerProfile {
  pubkey: string;
  nodes: PNode[];
  nodeCount: number;
  totalCredits: number;
  totalStorage: number;
  averageUptime: number;
  networks: Set<string>;
  countries: Set<string>;
  healthStatus: {
    active: number;
    gossipOnly: number;
    stale: number;
  };
  // Blockchain data (to be fetched separately)
  balance?: number;
  nfts?: string[];
  sbts?: string[];
}

export interface ManagerStats {
  totalManagers: number;
  multiNodeOperators: number;
  singleNodeOperators: number;
  largestOperator: {
    pubkey: string;
    nodeCount: number;
  };
  totalNodesManaged: number;
}

/**
 * Group nodes by pubkey (manager) and calculate aggregate statistics
 */
export function groupNodesByManager(nodes: PNode[]): Map<string, ManagerProfile> {
  const managers = new Map<string, ManagerProfile>();

  nodes.forEach((node) => {
    // Skip nodes without pubkey (can't identify manager)
    if (!node.pubkey) return;

    const pubkey = node.pubkey;

    if (!managers.has(pubkey)) {
      managers.set(pubkey, {
        pubkey,
        nodes: [],
        nodeCount: 0,
        totalCredits: 0,
        totalStorage: 0,
        averageUptime: 0,
        networks: new Set(),
        countries: new Set(),
        healthStatus: {
          active: 0,
          gossipOnly: 0,
          stale: 0,
        },
      });
    }

    const manager = managers.get(pubkey)!;
    manager.nodes.push(node);
    manager.nodeCount++;

    // Aggregate statistics
    manager.totalCredits += node.credits || 0;
    manager.totalStorage += (node.stats as any)?.storage_committed || 0;

    // Track networks
    if (node.network) {
      manager.networks.add(node.network);
    }

    // Track countries
    if (node.country) {
      manager.countries.add(node.country);
    }

    // Health status breakdown
    if (node.status === 'active') {
      manager.healthStatus.active++;
    } else if (node.status === 'gossip_only') {
      manager.healthStatus.gossipOnly++;
    } else if (node.status === 'stale') {
      manager.healthStatus.stale++;
    }
  });

  // Calculate average uptime for each manager
  managers.forEach((manager) => {
    const totalUptime = manager.nodes.reduce((sum, node) => {
      return sum + ((node.stats as any)?.uptime || 0);
    }, 0);
    manager.averageUptime = totalUptime / manager.nodeCount;
  });

  return managers;
}

/**
 * Get overall manager statistics
 */
export function getManagerStats(managers: Map<string, ManagerProfile>): ManagerStats {
  let largestOperator = { pubkey: '', nodeCount: 0 };
  let multiNodeOperators = 0;
  let singleNodeOperators = 0;
  let totalNodesManaged = 0;

  managers.forEach((manager) => {
    totalNodesManaged += manager.nodeCount;

    if (manager.nodeCount > 1) {
      multiNodeOperators++;
    } else {
      singleNodeOperators++;
    }

    if (manager.nodeCount > largestOperator.nodeCount) {
      largestOperator = {
        pubkey: manager.pubkey,
        nodeCount: manager.nodeCount,
      };
    }
  });

  return {
    totalManagers: managers.size,
    multiNodeOperators,
    singleNodeOperators,
    largestOperator,
    totalNodesManaged,
  };
}

/**
 * Get top managers by node count
 */
export function getTopManagers(
  managers: Map<string, ManagerProfile>,
  limit: number = 10
): ManagerProfile[] {
  return Array.from(managers.values())
    .sort((a, b) => b.nodeCount - a.nodeCount)
    .slice(0, limit);
}

/**
 * Get multi-node operators only (2+ nodes)
 */
export function getMultiNodeOperators(
  managers: Map<string, ManagerProfile>
): ManagerProfile[] {
  return Array.from(managers.values())
    .filter((manager) => manager.nodeCount > 1)
    .sort((a, b) => b.nodeCount - a.nodeCount);
}

/**
 * Format storage size for display
 */
export function formatStorageSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format uptime for display
 */
export function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return '0s';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Truncate pubkey for display
 */
export function truncatePubkey(pubkey: string, length: number = 8): string {
  if (pubkey.length <= length * 2) return pubkey;
  return `${pubkey.slice(0, length)}...${pubkey.slice(-length)}`;
}
