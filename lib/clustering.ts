import type { Node3DData } from './types-3d';

export interface ClusterPoint {
  lat: number;
  lng: number;
  nodes: Node3DData[];
  avgHealth: number;
  isCluster: boolean;
}

/**
 * Calcule la distance Haversine entre deux points en km
 * Plus précis que la distance euclidienne pour les coordonnées géographiques
 */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Rayon de clustering basé sur l'altitude du globe
 * Plus on est loin, plus on agrège les nodes
 */
export function getClusterRadius(altitude: number): number {
  if (altitude > 2.5) return 2000;     // Vue globale: 2000km
  if (altitude > 1.5) return 800;      // Vue continentale: 800km
  if (altitude > 0.8) return 300;      // Vue régionale: 300km
  if (altitude > 0.4) return 100;      // Vue pays: 100km
  return 30;                            // Vue ville: 30km
}

/**
 * Clustering spatial des nodes avec Haversine
 * @param nodes - Nodes à clusteriser
 * @param altitude - Altitude actuelle du globe (pour déterminer le rayon)
 * @returns Array de points (clusters ou nodes individuels)
 */
export function clusterNodes(
  nodes: Node3DData[],
  altitude: number
): ClusterPoint[] {
  if (nodes.length === 0) return [];

  const radius = getClusterRadius(altitude);
  const clustered: boolean[] = new Array(nodes.length).fill(false);
  const results: ClusterPoint[] = [];

  // O(n²) mais optimisé avec early exit
  for (let i = 0; i < nodes.length; i++) {
    if (clustered[i]) continue;

    const node = nodes[i];
    const clusterNodes: Node3DData[] = [node];
    clustered[i] = true;

    // Cherche les voisins dans le rayon
    for (let j = i + 1; j < nodes.length; j++) {
      if (clustered[j]) continue;

      const other = nodes[j];
      const distance = haversineDistance(
        node.lat, node.lng,
        other.lat, other.lng
      );

      if (distance <= radius) {
        clusterNodes.push(other);
        clustered[j] = true;
      }
    }

    // Calcule le centroïde et la santé moyenne
    const avgLat = clusterNodes.reduce((s, n) => s + n.lat, 0) / clusterNodes.length;
    const avgLng = clusterNodes.reduce((s, n) => s + n.lng, 0) / clusterNodes.length;
    const avgHealth = clusterNodes.reduce((s, n) => s + n.health, 0) / clusterNodes.length;

    results.push({
      lat: avgLat,
      lng: avgLng,
      nodes: clusterNodes,
      avgHealth,
      isCluster: clusterNodes.length > 1,
    });
  }

  return results;
}

/**
 * Calcule l'altitude cible pour zoomer sur un cluster
 * Plus le cluster est dense, plus on zoom
 */
export function getZoomTargetAltitude(clusterSize: number, currentAltitude: number): number {
  // Zoom proportionnel à la taille du cluster
  const baseAltitude = currentAltitude * 0.4; // Zoom 60%
  
  // Ajustement pour les gros clusters - zoom encore plus
  if (clusterSize > 50) return Math.min(baseAltitude, 0.3);
  if (clusterSize > 20) return Math.min(baseAltitude, 0.5);
  if (clusterSize > 10) return Math.min(baseAltitude, 0.7);
  
  return Math.max(0.2, baseAltitude);
}

/**
 * Convertit un ClusterPoint en GlobePoint pour react-globe.gl
 */
export function clusterToGlobePoint(
  cluster: ClusterPoint,
  getColor: (health: number) => string
) {
  return {
    lat: cluster.lat,
    lng: cluster.lng,
    size: cluster.isCluster 
      ? Math.min(0.5, 0.15 + cluster.nodes.length * 0.015) 
      : 0.15,
    color: getColor(cluster.avgHealth),
    altitude: 0.01,
    node: cluster.isCluster
      ? {
          ip: `Cluster (${cluster.nodes.length} nodes)`,
          lat: cluster.lat,
          lng: cluster.lng,
          health: cluster.avgHealth,
          city: cluster.nodes[0]?.city || 'Unknown',
          country: cluster.nodes[0]?.country || 'Unknown',
          clusterCount: cluster.nodes.length,
          clusterNodes: cluster.nodes,
        }
      : cluster.nodes[0],
  };
}
