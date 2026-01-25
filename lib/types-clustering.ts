/**
 * Types for Multi-Level Adaptive Clustering System
 * Google Maps-style hierarchical clustering with Supercluster
 */

import type { Node3DData } from './types-3d';

// ============================================================================
// GeoJSON Types for Supercluster
// ============================================================================

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [lng, lat]
}

export interface NodeFeature {
  type: 'Feature';
  geometry: GeoJSONPoint;
  properties: NodeProperties;
}

export interface NodeProperties {
  // Original node data
  nodeId: string;
  node: Node3DData;
  
  // For Supercluster
  cluster: false;
}

export interface ClusterProperties {
  // Supercluster built-in
  cluster: true;
  cluster_id: number;
  point_count: number;
  point_count_abbreviated: string | number;
  
  // Custom aggregated properties
  avgHealth: number;
  minHealth: number;
  maxHealth: number;
  totalStorage: number;
  countries: string[];
  cities: string[];
  primaryCountry: string;
  primaryCity: string;
  operators: number;
}

export type ClusterFeature = {
  type: 'Feature';
  geometry: GeoJSONPoint;
  properties: ClusterProperties;
  id?: number;
};

export type PointOrCluster = NodeFeature | ClusterFeature;

// ============================================================================
// Zoom Level System (Google Maps compatible)
// ============================================================================

/**
 * Zoom levels 0-20 matching Google Maps/Mapbox standards
 * Each level doubles the precision
 */
export type ZoomLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

export interface ZoomLevelConfig {
  zoom: ZoomLevel;
  name: string;
  description: string;
  altitudeRange: [number, number]; // [min, max] globe altitude
  clusterRadius: number; // Supercluster radius at this level
  showLabels: 'none' | 'continents' | 'countries' | 'regions' | 'cities' | 'streets';
  showBorders: 'none' | 'countries' | 'regions' | 'cities';
}

export const ZOOM_LEVELS: ZoomLevelConfig[] = [
  // Global view - Mega clusters
  { zoom: 0, name: 'World', description: 'Full globe view', altitudeRange: [3.0, Infinity], clusterRadius: 120, showLabels: 'continents', showBorders: 'none' },
  { zoom: 1, name: 'World', description: 'Globe overview', altitudeRange: [2.5, 3.0], clusterRadius: 100, showLabels: 'continents', showBorders: 'none' },
  { zoom: 2, name: 'Continental', description: 'Continental view', altitudeRange: [2.0, 2.5], clusterRadius: 80, showLabels: 'continents', showBorders: 'countries' },
  
  // Continental view - Country clusters
  { zoom: 3, name: 'Continental', description: 'Multi-country view', altitudeRange: [1.5, 2.0], clusterRadius: 60, showLabels: 'countries', showBorders: 'countries' },
  { zoom: 4, name: 'Sub-continental', description: 'Large region view', altitudeRange: [1.2, 1.5], clusterRadius: 50, showLabels: 'countries', showBorders: 'countries' },
  { zoom: 5, name: 'Country', description: 'Country overview', altitudeRange: [1.0, 1.2], clusterRadius: 40, showLabels: 'countries', showBorders: 'countries' },
  
  // Country view - Regional clusters
  { zoom: 6, name: 'Country', description: 'Full country view', altitudeRange: [0.8, 1.0], clusterRadius: 35, showLabels: 'countries', showBorders: 'regions' },
  { zoom: 7, name: 'Region', description: 'Multi-region view', altitudeRange: [0.6, 0.8], clusterRadius: 30, showLabels: 'regions', showBorders: 'regions' },
  { zoom: 8, name: 'Region', description: 'Regional view', altitudeRange: [0.5, 0.6], clusterRadius: 25, showLabels: 'regions', showBorders: 'regions' },
  
  // Regional view - City clusters
  { zoom: 9, name: 'Metro', description: 'Metro area view', altitudeRange: [0.4, 0.5], clusterRadius: 20, showLabels: 'cities', showBorders: 'regions' },
  { zoom: 10, name: 'Metro', description: 'Large city view', altitudeRange: [0.3, 0.4], clusterRadius: 16, showLabels: 'cities', showBorders: 'cities' },
  { zoom: 11, name: 'City', description: 'City view', altitudeRange: [0.25, 0.3], clusterRadius: 12, showLabels: 'cities', showBorders: 'cities' },
  
  // City view - Neighborhood clusters
  { zoom: 12, name: 'City', description: 'City detail', altitudeRange: [0.2, 0.25], clusterRadius: 10, showLabels: 'cities', showBorders: 'cities' },
  { zoom: 13, name: 'District', description: 'District view', altitudeRange: [0.15, 0.2], clusterRadius: 8, showLabels: 'cities', showBorders: 'cities' },
  { zoom: 14, name: 'Neighborhood', description: 'Neighborhood view', altitudeRange: [0.12, 0.15], clusterRadius: 6, showLabels: 'streets', showBorders: 'cities' },
  
  // Street view - Individual nodes
  { zoom: 15, name: 'Street', description: 'Street level', altitudeRange: [0.1, 0.12], clusterRadius: 4, showLabels: 'streets', showBorders: 'none' },
  { zoom: 16, name: 'Street', description: 'Detailed street', altitudeRange: [0.08, 0.1], clusterRadius: 3, showLabels: 'streets', showBorders: 'none' },
  { zoom: 17, name: 'Building', description: 'Building level', altitudeRange: [0.06, 0.08], clusterRadius: 2, showLabels: 'streets', showBorders: 'none' },
  { zoom: 18, name: 'Building', description: 'Close detail', altitudeRange: [0.04, 0.06], clusterRadius: 1, showLabels: 'streets', showBorders: 'none' },
  { zoom: 19, name: 'Node', description: 'Individual nodes', altitudeRange: [0.02, 0.04], clusterRadius: 0.5, showLabels: 'none', showBorders: 'none' },
  { zoom: 20, name: 'Node', description: 'Maximum detail', altitudeRange: [0, 0.02], clusterRadius: 0, showLabels: 'none', showBorders: 'none' },
];

// ============================================================================
// Cluster Visual Types
// ============================================================================

export type ClusterLevel = 
  | 'mega'      // 500+ nodes - Continental scale
  | 'large'     // 100-499 nodes - Country scale  
  | 'medium'    // 30-99 nodes - Regional scale
  | 'small'     // 10-29 nodes - City scale
  | 'micro'     // 3-9 nodes - Neighborhood scale
  | 'mini'      // 2 nodes - Small cluster
  | 'node';     // 1 node - Individual

export interface ClusterVisualConfig {
  level: ClusterLevel;
  minCount: number;
  maxCount: number;
  baseSize: number;        // Base size in pixels
  fontSize: number;        // Label font size
  borderWidth: number;     // Border thickness
  showCount: boolean;      // Show node count
  showLabel: boolean;      // Show location label
  pulseAnimation: boolean; // Animated pulse effect
  glowIntensity: number;   // 0-1 glow strength
}

export const CLUSTER_VISUAL_CONFIG: ClusterVisualConfig[] = [
  { level: 'mega', minCount: 500, maxCount: Infinity, baseSize: 50, fontSize: 14, borderWidth: 3, showCount: true, showLabel: true, pulseAnimation: true, glowIntensity: 0.6 },
  { level: 'large', minCount: 100, maxCount: 499, baseSize: 42, fontSize: 13, borderWidth: 3, showCount: true, showLabel: true, pulseAnimation: false, glowIntensity: 0.5 },
  { level: 'medium', minCount: 30, maxCount: 99, baseSize: 36, fontSize: 12, borderWidth: 2, showCount: true, showLabel: false, pulseAnimation: false, glowIntensity: 0.4 },
  { level: 'small', minCount: 10, maxCount: 29, baseSize: 30, fontSize: 11, borderWidth: 2, showCount: true, showLabel: false, pulseAnimation: false, glowIntensity: 0.3 },
  { level: 'micro', minCount: 3, maxCount: 9, baseSize: 24, fontSize: 10, borderWidth: 2, showCount: true, showLabel: false, pulseAnimation: false, glowIntensity: 0.2 },
  { level: 'mini', minCount: 2, maxCount: 2, baseSize: 20, fontSize: 9, borderWidth: 2, showCount: true, showLabel: false, pulseAnimation: false, glowIntensity: 0.1 },
  { level: 'node', minCount: 1, maxCount: 1, baseSize: 14, fontSize: 0, borderWidth: 2, showCount: false, showLabel: false, pulseAnimation: false, glowIntensity: 0.15 },
];

// ============================================================================
// Clustering State & Events
// ============================================================================

export interface ClusteringState {
  // Current view state
  currentZoom: ZoomLevel;
  currentAltitude: number;
  visibleBounds: BoundingBox | null;
  
  // Cluster data
  clusters: PointOrCluster[];
  totalNodes: number;
  visibleNodes: number;
  
  // Navigation history for breadcrumb
  navigationPath: NavigationStep[];
  
  // Performance metrics
  lastUpdateMs: number;
  isIndexReady: boolean;
}

export interface NavigationStep {
  type: 'global' | 'continent' | 'country' | 'region' | 'city' | 'cluster' | 'node';
  label: string;
  center: [number, number]; // [lng, lat]
  zoom: ZoomLevel;
  clusterId?: number;
  nodeId?: string;
}

export interface BoundingBox {
  west: number;   // Min longitude
  south: number;  // Min latitude
  east: number;   // Max longitude
  north: number;  // Max latitude
}

// ============================================================================
// Event Types
// ============================================================================

export interface ClusterClickEvent {
  cluster: ClusterFeature;
  expansionZoom: ZoomLevel;
  center: [number, number];
  nodes: Node3DData[];
}

export interface NodeClickEvent {
  node: Node3DData;
  feature: NodeFeature;
  position: [number, number];
}

export interface ZoomChangeEvent {
  previousZoom: ZoomLevel;
  currentZoom: ZoomLevel;
  altitude: number;
  source: 'user' | 'programmatic' | 'cluster-click';
}

// ============================================================================
// Utility Functions Types
// ============================================================================

export interface ClusterExpansionResult {
  targetZoom: ZoomLevel;
  targetAltitude: number;
  center: [number, number];
  willFullyExpand: boolean; // True if this zoom will show individual nodes
}

export interface ClusterMetrics {
  count: number;
  avgHealth: number;
  healthDistribution: {
    excellent: number; // 80-100
    good: number;      // 60-79
    warning: number;   // 40-59
    critical: number;  // 0-39
  };
  countries: Map<string, number>;
  cities: Map<string, number>;
  bounds: BoundingBox;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get cluster level from node count
 */
export function getClusterLevel(count: number): ClusterLevel {
  const config = CLUSTER_VISUAL_CONFIG.find(
    c => count >= c.minCount && count <= c.maxCount
  );
  return config?.level || 'node';
}

/**
 * Get visual config for a cluster level
 */
export function getClusterVisualConfig(count: number): ClusterVisualConfig {
  return CLUSTER_VISUAL_CONFIG.find(
    c => count >= c.minCount && count <= c.maxCount
  ) || CLUSTER_VISUAL_CONFIG[CLUSTER_VISUAL_CONFIG.length - 1];
}

/**
 * Get zoom level config from altitude
 */
export function getZoomLevelFromAltitude(altitude: number): ZoomLevelConfig {
  // Find the zoom level that matches this altitude
  for (const config of ZOOM_LEVELS) {
    const [min, max] = config.altitudeRange;
    if (altitude >= min && altitude < max) {
      return config;
    }
  }
  // Default to highest zoom if very close
  return ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
}

/**
 * Get altitude from zoom level
 */
export function getAltitudeFromZoom(zoom: ZoomLevel): number {
  const config = ZOOM_LEVELS[zoom];
  if (!config) return 2.5;
  
  const [min, max] = config.altitudeRange;
  // Return middle of the range, capped for infinity
  return Math.min(min + (Math.min(max, 10) - min) / 2, 5);
}

/**
 * Check if a feature is a cluster
 */
export function isCluster(feature: PointOrCluster): feature is ClusterFeature {
  return feature.properties.cluster === true;
}

/**
 * Check if a feature is an individual node
 */
export function isNode(feature: PointOrCluster): feature is NodeFeature {
  return feature.properties.cluster === false;
}

/**
 * Format cluster count for display
 */
export function formatClusterCount(count: number): string {
  if (count >= 10000) return `${(count / 1000).toFixed(0)}k`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

/**
 * Calculate bounding box from points
 */
export function calculateBounds(points: Array<{ lat: number; lng: number }>): BoundingBox {
  if (points.length === 0) {
    return { west: -180, south: -90, east: 180, north: 90 };
  }
  
  return points.reduce(
    (bounds, point) => ({
      west: Math.min(bounds.west, point.lng),
      south: Math.min(bounds.south, point.lat),
      east: Math.max(bounds.east, point.lng),
      north: Math.max(bounds.north, point.lat),
    }),
    { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity }
  );
}
