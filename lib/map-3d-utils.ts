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
/**
 * Get globe theme matching the 2D map design
 * Dark mode uses aqua accent (#00D4AA), light mode uses orange (#EA580C)
 */
export function getGlobeTheme(theme: 'light' | 'dark'): Globe3DTheme {
  const isDark = theme === 'dark';
  
  return {
    // Background matches map container
    background: isDark ? '#020204' : '#f5f5f7',
    
    // Atmosphere uses theme accent colors
    atmosphere: isDark ? '#00D4AA' : '#EA580C',
    
    // Countries match GeoJSON style from NodesMap
    countries: {
      fill: isDark ? '#0A0E1A' : '#FEF3E2', // fillColor from getGeoJsonStyleForTheme
      stroke: isDark ? '#00D4AA' : '#EA580C', // color from getGeoJsonStyleForTheme
    },
    
    // Nodes use KPI colors (CSS variables)
    nodes: {
      healthy: '#10B981',    // --kpi-excellent
      warning: '#F59E0B',    // --kpi-warning
      critical: '#EF4444',   // --kpi-critical
    },
    
    // Arcs use theme accent with transparency
    arcs: isDark ? 'rgba(0, 212, 170, 0.3)' : 'rgba(234, 88, 12, 0.3)',
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

/**
 * Label data for dynamic globe labels
 */
export type GlobeLabel = {
  lat: number;
  lng: number;
  text: string;
  size: number;
  type: 'city' | 'country';
  priority: number;
  count: number;
};

/**
 * Get dynamic labels based on camera distance - pGlobe strategy
 * 4 zoom levels with smart grouping
 */
export function getDynamicLabels(nodes: Node3DData[], cameraDistance: number): GlobeLabel[] {
  const labelMap = new Map<string, { lat: number; lng: number; text: string; size: number; type: 'city' | 'country'; priority: number }>();
  
  // Group nodes by location to avoid duplicate labels
  const locationGroups = new Map<string, Node3DData[]>();
  nodes.forEach((node) => {
    if (!node) return;
    const { city, country } = node;
    const key = city ? `${city}, ${country}` : country || 'Unknown';
    if (!locationGroups.has(key)) {
      locationGroups.set(key, []);
    }
    locationGroups.get(key)!.push(node);
  });
  
  locationGroups.forEach((groupNodes, key) => {
    const node = groupNodes[0];
    if (!node) return;
    
    const { city, country, lat, lng } = node;
    
    // Very zoomed in (< 1.2): Show all cities with node counts
    if (cameraDistance < 1.2 && city) {
      const cityKey = `${city}-${country}`;
      if (!labelMap.has(cityKey)) {
        labelMap.set(cityKey, {
          lat: lat,
          lng: lng,
          text: `${city} (${groupNodes.length})`,
          size: 1.0,
          type: 'city',
          priority: groupNodes.length,
        });
      }
    }
    // Moderately zoomed (1.2-1.8): Show major cities only
    else if (cameraDistance < 1.8 && city && groupNodes.length > 1) {
      const cityKey = `${city}-${country}`;
      if (!labelMap.has(cityKey)) {
        labelMap.set(cityKey, {
          lat: lat,
          lng: lng,
          text: city,
          size: 0.9,
          type: 'city',
          priority: groupNodes.length,
        });
      }
    }
    // Zoomed out (1.8-2.5): Show countries with node counts
    else if (cameraDistance < 2.5 && country) {
      const countryKey = country;
      if (!labelMap.has(countryKey)) {
        // Calculate average position for country
        const avgLat = groupNodes.reduce((sum, n) => sum + n.lat, 0) / groupNodes.length;
        const avgLng = groupNodes.reduce((sum, n) => sum + n.lng, 0) / groupNodes.length;
        labelMap.set(countryKey, {
          lat: avgLat,
          lng: avgLng,
          text: `${country} (${groupNodes.length})`,
          size: 1.3,
          type: 'country',
          priority: groupNodes.length,
        });
      }
    }
    // Very zoomed out (> 2.5): Show only countries with many nodes
    else if (cameraDistance >= 2.5 && country && groupNodes.length >= 3) {
      const countryKey = country;
      if (!labelMap.has(countryKey)) {
        const avgLat = groupNodes.reduce((sum, n) => sum + n.lat, 0) / groupNodes.length;
        const avgLng = groupNodes.reduce((sum, n) => sum + n.lng, 0) / groupNodes.length;
        labelMap.set(countryKey, {
          lat: avgLat,
          lng: avgLng,
          text: country,
          size: 1.5,
          type: 'country',
          priority: groupNodes.length,
        });
      }
    }
  });
  
  return Array.from(labelMap.values())
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 30)
    .map(label => ({ ...label, count: label.priority }));
}

/**
 * Get view level based on camera distance
 */
export function getViewLevel(cameraDistance: number): 'City' | 'Country' | 'Global' {
  if (cameraDistance < 250) return 'City';
  if (cameraDistance < 450) return 'Country';
  return 'Global';
}

/**
 * Get flag emoji for country code
 */
export function getFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
}
