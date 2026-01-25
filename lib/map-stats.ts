import type { PNode } from './types';
import { getHealthStatus, type HealthStatus } from './health';

/**
 * Stats uniformes pour les vues 2D et 3D de la carte
 * Utilise getHealthStatus() pour être cohérent avec le dashboard
 */
export interface MapStats {
  total: number;
  excellent: number;
  good: number;
  warning: number;
  critical: number;
  private: number;
  
  // Pour NetworkOverview
  active: number;      // nodes avec status === 'active'
  gossipOnly: number;  // nodes avec status === 'gossip_only'
  stale: number;       // nodes avec status === 'stale'
  
  // Métriques réseau
  totalStorage: number;        // en bytes
  totalStorageTB: string;      // formaté en TB
  avgHealthScore: number;      // 0-100
  topCountry: { name: string; count: number } | null;
  countryDistribution: Map<string, number>;
}

/**
 * Calcule toutes les stats de manière unifiée
 * @param nodes - Tous les PNodes du réseau
 * @returns MapStats - Stats complètes pour la sidebar et l'overview
 */
export function calculateMapStats(nodes: PNode[]): MapStats {
  const stats: MapStats = {
    total: nodes.length,
    excellent: 0,
    good: 0,
    warning: 0,
    critical: 0,
    private: 0,
    active: 0,
    gossipOnly: 0,
    stale: 0,
    totalStorage: 0,
    totalStorageTB: '0',
    avgHealthScore: 0,
    topCountry: null,
    countryDistribution: new Map(),
  };

  if (nodes.length === 0) return stats;

  let healthScoreSum = 0;
  let healthScoreCount = 0;

  nodes.forEach(node => {
    // Utilise getHealthStatus() - LA MÊME FONCTION que le dashboard
    const health = getHealthStatus(node, nodes);
    
    switch (health) {
      case 'Excellent':
        stats.excellent++;
        healthScoreSum += 95;
        healthScoreCount++;
        break;
      case 'Good':
        stats.good++;
        healthScoreSum += 75;
        healthScoreCount++;
        break;
      case 'Warning':
        stats.warning++;
        healthScoreSum += 45;
        healthScoreCount++;
        break;
      case 'Critical':
        stats.critical++;
        healthScoreSum += 15;
        healthScoreCount++;
        break;
      case 'Private':
        stats.private++;
        // Les nodes privés ne contribuent pas au score moyen
        break;
    }

    // Stats par statut réseau
    switch (node.status) {
      case 'online':
        stats.active++;
        break;
      case 'registry_only':
        stats.gossipOnly++;
        break;
      case 'stale':
        stats.stale++;
        break;
    }

    // Stockage
    stats.totalStorage += node.stats?.storage_committed || 0;

    // Distribution par pays
    if (node.country) {
      const current = stats.countryDistribution.get(node.country) || 0;
      stats.countryDistribution.set(node.country, current + 1);
    }
  });

  // Score de santé moyen
  stats.avgHealthScore = healthScoreCount > 0 
    ? Math.round(healthScoreSum / healthScoreCount) 
    : 0;

  // Stockage formaté en TB
  stats.totalStorageTB = (stats.totalStorage / (1024 ** 4)).toFixed(1);

  // Top pays
  let maxCount = 0;
  stats.countryDistribution.forEach((count, country) => {
    if (count > maxCount) {
      maxCount = count;
      stats.topCountry = { name: country, count };
    }
  });

  return stats;
}

/**
 * Convertit les stats pour la sidebar Map3D (format actuel)
 */
export function toMap3DSidebarStats(mapStats: MapStats) {
  return {
    totalNodes: mapStats.total,
    healthyNodes: mapStats.excellent + mapStats.good,
    warningNodes: mapStats.warning,
    criticalNodes: mapStats.critical,
    avgHealth: mapStats.avgHealthScore,
    totalStorage: mapStats.totalStorage / (1024 ** 3), // en GB pour la sidebar
    activeStreams: mapStats.active, // utilise le compte des nodes actifs
  };
}

/**
 * Convertit les stats pour NetworkOverview (format actuel)
 */
export function toNetworkOverviewStats(mapStats: MapStats) {
  return {
    total: mapStats.total,
    active: mapStats.active,
    gossip: mapStats.gossipOnly,
    stale: mapStats.stale,
    privateNodes: mapStats.private,
    totalStorage: mapStats.totalStorage,
    topCountry: mapStats.topCountry 
      ? [mapStats.topCountry.name, mapStats.topCountry.count] as [string, number]
      : undefined,
    avgPerformance: mapStats.avgHealthScore,
  };
}

/**
 * Obtient la couleur basée sur le HealthStatus
 */
export function getColorForHealthStatus(status: HealthStatus): string {
  switch (status) {
    case 'Excellent': return '#10B981'; // kpi-excellent
    case 'Good': return '#60A5FA';      // kpi-good
    case 'Warning': return '#F59E0B';   // kpi-warning
    case 'Critical': return '#EF4444';  // kpi-critical
    case 'Private': return '#64748B';   // kpi-private
    default: return '#64748B';
  }
}
