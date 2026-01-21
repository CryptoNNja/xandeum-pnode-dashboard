/**
 * Manager Mapping
 * 
 * Provides the mapping between node pubkeys and manager wallet addresses
 * Source: XanDash managers_node_data.json
 */

import managersData from '../config/managers_node_data.json';

interface ManagerNode {
  pnode_pubkey: string;
  registered_time: string;
  node_label: string;
}

interface Manager {
  manager_index: number;
  manager_address: string;
  nodes: ManagerNode[];
}

interface ManagersData {
  summary: {
    total_managers: number;
    total_pnode_pubkeys: number;
  };
  managers: Manager[];
}

// Type the imported JSON
const data = managersData as ManagersData;

// Create a fast lookup map: pubkey → manager_address
const pubkeyToManagerMap = new Map<string, string>();

// Build the map
for (const manager of data.managers) {
  for (const node of manager.nodes) {
    pubkeyToManagerMap.set(node.pnode_pubkey, manager.manager_address);
  }
}

console.log(`[ManagerMapping] Loaded ${pubkeyToManagerMap.size} pubkey→manager mappings`);

/**
 * Get the manager wallet address for a given node pubkey
 * 
 * @param nodePubkey - The pNode pubkey
 * @returns Manager wallet address, or null if not found
 */
export function getManagerWallet(nodePubkey: string): string | null {
  return pubkeyToManagerMap.get(nodePubkey) || null;
}

/**
 * Get all nodes for a given manager wallet
 * 
 * @param managerWallet - The manager wallet address
 * @returns Array of node pubkeys
 */
export function getManagerNodes(managerWallet: string): string[] {
  const manager = data.managers.find(m => m.manager_address === managerWallet);
  return manager ? manager.nodes.map(n => n.pnode_pubkey) : [];
}

/**
 * Get all managers
 */
export function getAllManagers(): Manager[] {
  return data.managers;
}

/**
 * Get summary statistics
 */
export function getManagerStats() {
  return data.summary;
}

/**
 * Check if a pubkey has a known manager
 */
export function hasManagerWallet(nodePubkey: string): boolean {
  return pubkeyToManagerMap.has(nodePubkey);
}
