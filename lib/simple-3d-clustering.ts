/**
 * Simple manual clustering system for 3D globe
 * Groups nodes by proximity based on zoom level
 */

export interface Node3D {
  ip: string;
  lat: number;
  lng: number;
  health: number;
  [key: string]: any;
}

export interface Cluster3D {
  id: string;
  lat: number;
  lng: number;
  count: number;
  nodes: Node3D[];
  avgHealth: number;
}

/**
 * Calculate distance between two points (simple euclidean for clustering)
 */
function distance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dlat = lat1 - lat2;
  const dlng = lng1 - lng2;
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

/**
 * Get clustering threshold based on altitude
 * Higher altitude = larger threshold = bigger clusters
 */
function getClusterThreshold(altitude: number): number {
  if (altitude > 2.0) return 15; // Global view - cluster by country
  if (altitude > 1.5) return 10; // Continental
  if (altitude > 1.0) return 5;  // Regional
  if (altitude > 0.5) return 2;  // City-level
  if (altitude > 0.3) return 1;  // Street-level
  return 0.5; // Very close - almost no clustering
}

/**
 * Simple clustering algorithm
 * Groups nodes that are within threshold distance
 */
export function clusterNodes(nodes: Node3D[], altitude: number): (Node3D | Cluster3D)[] {
  const threshold = getClusterThreshold(altitude);
  const clusters: Cluster3D[] = [];
  const processed = new Set<string>();
  const result: (Node3D | Cluster3D)[] = [];

  console.log('[Simple Cluster] Altitude:', altitude, 'Threshold:', threshold);

  for (let i = 0; i < nodes.length; i++) {
    if (processed.has(nodes[i].ip)) continue;

    const nearby: Node3D[] = [nodes[i]];
    processed.add(nodes[i].ip);

    // Find all nodes within threshold
    for (let j = i + 1; j < nodes.length; j++) {
      if (processed.has(nodes[j].ip)) continue;
      
      const dist = distance(nodes[i].lat, nodes[i].lng, nodes[j].lat, nodes[j].lng);
      if (dist < threshold) {
        nearby.push(nodes[j]);
        processed.add(nodes[j].ip);
      }
    }

    // If multiple nodes nearby, create cluster
    if (nearby.length > 1) {
      const avgLat = nearby.reduce((sum, n) => sum + n.lat, 0) / nearby.length;
      const avgLng = nearby.reduce((sum, n) => sum + n.lng, 0) / nearby.length;
      const avgHealth = nearby.reduce((sum, n) => sum + n.health, 0) / nearby.length;

      clusters.push({
        id: `cluster_${avgLat}_${avgLng}`,
        lat: avgLat,
        lng: avgLng,
        count: nearby.length,
        nodes: nearby,
        avgHealth,
      });
    } else {
      // Single node, add directly
      result.push(nearby[0]);
    }
  }

  result.push(...clusters);
  
  console.log('[Simple Cluster] Created', clusters.length, 'clusters,', result.length - clusters.length, 'individual nodes');
  
  return result;
}

/**
 * Check if item is a cluster
 */
export function isCluster3D(item: any): item is Cluster3D {
  return item.count !== undefined && item.count > 1 && item.nodes !== undefined;
}

/**
 * Spiderfy nodes at same location
 */
export function spiderfyNodes(nodes: Node3D[], centerLat: number, centerLng: number): Node3D[] {
  const radius = 0.3; // degrees
  const angleStep = (2 * Math.PI) / nodes.length;
  
  return nodes.map((node, index) => {
    const angle = index * angleStep;
    return {
      ...node,
      lat: centerLat + radius * Math.cos(angle),
      lng: centerLng + radius * Math.sin(angle),
      isSpiderfied: true,
    };
  });
}
