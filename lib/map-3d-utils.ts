/**
 * Utilities for 3D Globe Map
 */

import type { Node3DData, Globe3DTheme, CameraPosition } from './types-3d';

/**
 * Convert PNode to Node3DData for 3D visualization
 */
export function pnodeToNode3D(pnode: any): Node3DData | null {
  // Skip nodes without geolocation
  if (!pnode.lat || !pnode.lng) {
    return null;
  }
  
  return {
    ip: pnode.ip,
    lat: pnode.lat,
    lng: pnode.lng,
    
    // Health score (0-100)
    health: (pnode as any)._score || 0,
    
    // Storage in GB
    storage: (pnode.stats?.storage_committed || 0) / (1024 * 1024 * 1024),
    
    // Metadata
    city: pnode.city,
    country: pnode.country,
    country_code: pnode.country_code,
    
    // Stats
    uptime: pnode.stats?.uptime || 0,
    cpu: pnode.stats?.cpu_percent || 0,
    ram: pnode.stats?.ram_used && pnode.stats?.ram_total
      ? (pnode.stats.ram_used / pnode.stats.ram_total) * 100
      : 0,
    version: pnode.stats?.version,
    
    // Activity
    hasActiveStreams: (pnode.stats?.active_streams || 0) > 0,
    operator: pnode.pubkey, // Use pubkey as operator ID
    
    // Status
    status: pnode.status || 'inactive',
    isPublic: pnode.status === 'active',
  };
}

/**
 * Get globe theme based on current theme
 */
export function getGlobeTheme(theme: 'light' | 'dark'): Globe3DTheme {
  const isDark = theme === 'dark';
  
  return {
    background: isDark ? 'rgba(10, 14, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    atmosphere: isDark ? '#14f195' : '#10b981',
    countries: {
      fill: isDark ? '#1e293b' : '#f1f5f9',
      stroke: isDark ? '#334155' : '#cbd5e1',
    },
    nodes: {
      healthy: isDark ? '#14f195' : '#10b981',
      warning: isDark ? '#fbbf24' : '#f59e0b',
      critical: isDark ? '#ef4444' : '#dc2626',
    },
    arcs: isDark ? 'rgba(20, 241, 149, 0.3)' : 'rgba(16, 185, 129, 0.3)',
  };
}

/**
 * Get node color based on storage capacity
 */
export function getNodeColor(node: Node3DData, theme: Globe3DTheme): string {
  // Color based on health score
  if (node.health >= 70) return theme.nodes.healthy;
  if (node.health >= 40) return theme.nodes.warning;
  return theme.nodes.critical;
}

/**
 * Get node height based on health score
 * Height ranges from 0.01 to 0.5 (relative to globe radius)
 */
export function getNodeHeight(health: number): number {
  // Normalize health (0-100) to height (0.01-0.5)
  return 0.01 + (health / 100) * 0.49;
}

/**
 * Get node size based on uptime
 * Size ranges from 0.3 to 1.2
 */
export function getNodeSize(uptime: number): number {
  // Normalize uptime (0-1000h+) to size (0.3-1.2)
  const normalized = Math.min(uptime / 1000, 1);
  return 0.3 + normalized * 0.9;
}

/**
 * Format node data for tooltip display
 */
export function formatNodeTooltip(node: Node3DData): string {
  return `
    <div style="font-family: system-ui; font-size: 12px; padding: 8px;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #14f195;">
        ${node.ip}
      </div>
      <div style="color: #94a3b8;">
        ${node.city ? `📍 ${node.city}, ` : ''}${node.country || 'Unknown'}
      </div>
      <div style="margin-top: 8px; color: #cbd5e1;">
        <div>💚 Health: ${node.health.toFixed(0)}/100</div>
        <div>💾 Storage: ${node.storage.toFixed(2)} GB</div>
        <div>⏱️ Uptime: ${node.uptime.toFixed(1)}h</div>
        <div>🖥️ CPU: ${node.cpu.toFixed(1)}%</div>
        <div>💿 RAM: ${node.ram.toFixed(1)}%</div>
        ${node.version ? `<div>📦 Version: ${node.version}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Calculate camera position to focus on a node
 */
export function getCameraPositionForNode(node: Node3DData, altitude: number = 2): CameraPosition {
  return {
    lat: node.lat,
    lng: node.lng,
    altitude,
  };
}

/**
 * Filter nodes based on criteria
 */
export function filterNodes(nodes: Node3DData[], filter: any): Node3DData[] {
  return nodes.filter(node => {
    // Health filter
    if (filter.health !== 'all') {
      if (filter.health === 'healthy' && node.health < 70) return false;
      if (filter.health === 'warning' && (node.health < 40 || node.health >= 70)) return false;
      if (filter.health === 'critical' && node.health >= 40) return false;
    }
    
    // Network filter
    if (filter.network !== 'all') {
      if (filter.network === 'public' && !node.isPublic) return false;
      if (filter.network === 'private' && node.isPublic) return false;
    }
    
    // Active only filter
    if (filter.activeOnly && node.status !== 'active') return false;
    
    return true;
  });
}

/**
 * Group nodes by operator for arc connections
 */
export function getOperatorArcs(nodes: Node3DData[]): Array<{ startLat: number; startLng: number; endLat: number; endLng: number }> {
  const operatorNodes = new Map<string, Node3DData[]>();
  
  // Group nodes by operator
  nodes.forEach(node => {
    if (node.operator) {
      if (!operatorNodes.has(node.operator)) {
        operatorNodes.set(node.operator, []);
      }
      operatorNodes.get(node.operator)!.push(node);
    }
  });
  
  // Create arcs between nodes of same operator
  const arcs: Array<{ startLat: number; startLng: number; endLat: number; endLng: number }> = [];
  
  operatorNodes.forEach((opNodes) => {
    // Only show arcs for operators with 2+ nodes
    if (opNodes.length >= 2) {
      // Connect each node to the next one (ring pattern)
      for (let i = 0; i < opNodes.length - 1; i++) {
        arcs.push({
          startLat: opNodes[i].lat,
          startLng: opNodes[i].lng,
          endLat: opNodes[i + 1].lat,
          endLng: opNodes[i + 1].lng,
        });
      }
    }
  });
  
  return arcs;
}
