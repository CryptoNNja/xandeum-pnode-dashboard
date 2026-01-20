/**
 * Adaptive Multi-Level Clustering Engine
 * Uses Supercluster for O(log n) spatial indexing with R-tree
 * Google Maps-style hierarchical clustering
 */

import Supercluster from 'supercluster';
import type { Node3DData } from './types-3d';
import {
  type NodeFeature,
  type ClusterFeature,
  type PointOrCluster,
  type ClusterProperties,
  type NodeProperties,
  type ZoomLevel,
  type BoundingBox,
  type ClusterExpansionResult,
  type ClusterMetrics,
  type ClusteringState,
  type NavigationStep,
  ZOOM_LEVELS,
  getZoomLevelFromAltitude,
  getAltitudeFromZoom,
  isCluster,
  calculateBounds,
} from './types-clustering';

// ============================================================================
// Supercluster Configuration
// ============================================================================

export interface AdaptiveClusterConfig {
  // Supercluster options
  radius: number;          // Cluster radius in pixels (default: 60)
  maxZoom: number;         // Max zoom to cluster points (default: 18)
  minZoom: number;         // Min zoom level (default: 0)
  minPoints: number;       // Min points to form a cluster (default: 2)
  
  // Custom options
  nodeExtent: number;      // Tile extent for clustering (default: 512)
  enableSpiderfying: boolean; // Enable spider layout for overlapping nodes
  spiderfyDistance: number;   // Distance between spiderfied nodes
}

const DEFAULT_CONFIG: AdaptiveClusterConfig = {
  radius: 40, // Reduced from 60 - smaller radius = more granular clusters
  maxZoom: 16, // Stop clustering at zoom 16 to show individual nodes
  minZoom: 0,
  minPoints: 2,
  nodeExtent: 512,
  enableSpiderfying: true,
  spiderfyDistance: 30,
};

// ============================================================================
// Cluster Index Class
// ============================================================================

export class AdaptiveClusterIndex {
  private supercluster: Supercluster<NodeProperties, any>;
  private nodes: Node3DData[] = [];
  private config: AdaptiveClusterConfig;
  private isReady = false;
  private clusterCache = new Map<string, PointOrCluster[]>();
  
  constructor(config: Partial<AdaptiveClusterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize Supercluster with custom reduce function for aggregation
    this.supercluster = new Supercluster<NodeProperties, any>({
      radius: this.config.radius,
      maxZoom: this.config.maxZoom,
      minZoom: this.config.minZoom,
      minPoints: this.config.minPoints,
      extent: this.config.nodeExtent,
      
      // Map function: transform each point's properties
      map: (props: NodeProperties) => ({
        health: props.node.health,
        storage: props.node.storage,
        country: props.node.country || 'Unknown',
        city: props.node.city || 'Unknown',
        countryCode: props.node.country_code || '',
        operator: props.node.operator || '',
      }),
      
      // Reduce function: aggregate cluster properties
      reduce: (accumulated: any, props: any) => {
        // Health aggregation
        accumulated.healthSum = (accumulated.healthSum || accumulated.health || 0) + props.health;
        accumulated.healthCount = (accumulated.healthCount || 1) + 1;
        accumulated.healthMin = Math.min(accumulated.healthMin ?? props.health, props.health);
        accumulated.healthMax = Math.max(accumulated.healthMax ?? props.health, props.health);
        
        // Storage aggregation
        accumulated.storageSum = (accumulated.storageSum || accumulated.storage || 0) + props.storage;
        
        // Location tracking (keep unique values)
        if (!accumulated.countriesSet) {
          accumulated.countriesSet = new Set([accumulated.country]);
          accumulated.citiesSet = new Set([accumulated.city]);
          accumulated.operatorsSet = new Set([accumulated.operator].filter(Boolean));
        }
        accumulated.countriesSet.add(props.country);
        accumulated.citiesSet.add(props.city);
        if (props.operator) accumulated.operatorsSet.add(props.operator);
      },
    });
  }
  
  /**
   * Load nodes into the spatial index
   */
  load(nodes: Node3DData[]): void {
    this.nodes = nodes;
    this.clusterCache.clear();
    
    // Convert nodes to GeoJSON features
    const features: NodeFeature[] = nodes
      .filter(node => this.isValidNode(node))
      .map(node => this.nodeToFeature(node));
    
    // Build the spatial index
    this.supercluster.load(features as any);
    this.isReady = true;
  }
  
  /**
   * Validate node coordinates
   */
  private isValidNode(node: Node3DData): boolean {
    return (
      node &&
      typeof node.lat === 'number' &&
      typeof node.lng === 'number' &&
      !isNaN(node.lat) &&
      !isNaN(node.lng) &&
      node.lat >= -90 &&
      node.lat <= 90 &&
      node.lng >= -180 &&
      node.lng <= 180
    );
  }
  
  /**
   * Convert a Node3DData to a GeoJSON Feature
   */
  private nodeToFeature(node: Node3DData): NodeFeature {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [node.lng, node.lat],
      },
      properties: {
        nodeId: node.ip,
        node: node,
        cluster: false,
      },
    };
  }
  
  /**
   * Get clusters for a specific zoom level and bounding box
   */
  getClusters(
    bounds: BoundingBox,
    zoom: ZoomLevel
  ): PointOrCluster[] {
    if (!this.isReady) return [];
    
    // Check cache
    const cacheKey = `${bounds.west},${bounds.south},${bounds.east},${bounds.north},${zoom}`;
    if (this.clusterCache.has(cacheKey)) {
      return this.clusterCache.get(cacheKey)!;
    }
    
    // Get clusters from Supercluster
    const rawClusters = this.supercluster.getClusters(
      [bounds.west, bounds.south, bounds.east, bounds.north],
      zoom
    );
    
    // Transform to our format with enhanced properties
    const clusters: PointOrCluster[] = rawClusters.map(feature => {
      if (feature.properties.cluster) {
        return this.enhanceClusterFeature(feature as any);
      }
      return feature as unknown as NodeFeature;
    });
    
    // Cache the result
    this.clusterCache.set(cacheKey, clusters);
    
    // Limit cache size
    if (this.clusterCache.size > 100) {
      const firstKey = this.clusterCache.keys().next().value;
      if (firstKey) this.clusterCache.delete(firstKey);
    }
    
    return clusters;
  }
  
  /**
   * Enhance cluster feature with computed properties
   */
  private enhanceClusterFeature(feature: any): ClusterFeature {
    const props = feature.properties;
    const count = props.point_count || 1;
    
    // Calculate averages from aggregated values
    const avgHealth = props.healthSum 
      ? props.healthSum / (props.healthCount || count)
      : props.health || 0;
    
    // Extract unique locations
    const countries = props.countriesSet 
      ? Array.from(props.countriesSet).filter(Boolean) 
      : [props.country].filter(Boolean);
    const cities = props.citiesSet 
      ? Array.from(props.citiesSet).filter(Boolean)
      : [props.city].filter(Boolean);
    const operators = props.operatorsSet?.size || 1;
    
    // Find primary (most common) location
    const primaryCountry = countries[0] || 'Unknown';
    const primaryCity = cities[0] || 'Unknown';
    
    return {
      type: 'Feature',
      id: props.cluster_id,
      geometry: feature.geometry,
      properties: {
        cluster: true,
        cluster_id: props.cluster_id,
        point_count: count,
        point_count_abbreviated: this.abbreviateCount(count),
        avgHealth: Math.round(avgHealth * 10) / 10,
        minHealth: props.healthMin ?? avgHealth,
        maxHealth: props.healthMax ?? avgHealth,
        totalStorage: props.storageSum || 0,
        countries,
        cities,
        primaryCountry,
        primaryCity,
        operators,
      },
    };
  }
  
  /**
   * Abbreviate large numbers
   */
  private abbreviateCount(count: number): string {
    if (count >= 10000) return `${Math.round(count / 1000)}k`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return String(count);
  }
  
  /**
   * Get the zoom level needed to expand a cluster
   */
  getClusterExpansionZoom(clusterId: number): ZoomLevel {
    if (!this.isReady) return 20 as ZoomLevel;
    
    const zoom = this.supercluster.getClusterExpansionZoom(clusterId);
    return Math.min(zoom, 20) as ZoomLevel;
  }
  
  /**
   * Get all nodes (leaves) within a cluster
   */
  getClusterLeaves(
    clusterId: number,
    limit: number = 1000,
    offset: number = 0
  ): Node3DData[] {
    if (!this.isReady) return [];
    
    const leaves = this.supercluster.getLeaves(clusterId, limit, offset);
    return leaves
      .map((leaf: any) => leaf.properties?.node)
      .filter(Boolean);
  }
  
  /**
   * Get cluster children (one level down)
   */
  getClusterChildren(clusterId: number): PointOrCluster[] {
    if (!this.isReady) return [];
    
    try {
      const children = this.supercluster.getChildren(clusterId);
      return children.map((child: any) => {
        if (child.properties.cluster) {
          return this.enhanceClusterFeature(child);
        }
        return child as NodeFeature;
      });
    } catch {
      return [];
    }
  }
  
  /**
   * Calculate optimal zoom to fully expand a cluster
   */
  getOptimalExpansion(cluster: ClusterFeature, currentZoom: ZoomLevel): ClusterExpansionResult {
    const clusterId = cluster.properties.cluster_id;
    const baseExpansionZoom = this.getClusterExpansionZoom(clusterId);
    const [lng, lat] = cluster.geometry.coordinates;
    
    // Always go at least 2 zoom levels deeper to ensure declustering
    const targetZoom = Math.min(20, baseExpansionZoom + 2) as ZoomLevel;
    
    // Check if this will fully expand
    const childrenAtExpansion = this.getClusters(
      { west: lng - 5, south: lat - 5, east: lng + 5, north: lat + 5 },
      targetZoom
    );
    
    const willFullyExpand = childrenAtExpansion.every(
      child => !isCluster(child) || child.properties.point_count <= 2
    );
    
    console.log('[Supercluster] Expansion calculation:', {
      clusterId,
      nodeCount: cluster.properties.point_count,
      currentZoom,
      baseExpansionZoom,
      targetZoom,
      willFullyExpand,
      childrenCount: childrenAtExpansion.length
    });
    
    return {
      targetZoom,
      targetAltitude: getAltitudeFromZoom(targetZoom),
      center: [lng, lat],
      willFullyExpand,
    };
  }
  
  /**
   * Get detailed metrics for a cluster
   */
  getClusterMetrics(clusterId: number): ClusterMetrics {
    const nodes = this.getClusterLeaves(clusterId);
    
    // Calculate health distribution
    const healthDistribution = {
      excellent: 0,
      good: 0,
      warning: 0,
      critical: 0,
    };
    
    const countries = new Map<string, number>();
    const cities = new Map<string, number>();
    
    nodes.forEach(node => {
      // Health distribution
      if (node.health >= 80) healthDistribution.excellent++;
      else if (node.health >= 60) healthDistribution.good++;
      else if (node.health >= 40) healthDistribution.warning++;
      else healthDistribution.critical++;
      
      // Location counting
      const country = node.country || 'Unknown';
      const city = node.city || 'Unknown';
      countries.set(country, (countries.get(country) || 0) + 1);
      cities.set(city, (cities.get(city) || 0) + 1);
    });
    
    return {
      count: nodes.length,
      avgHealth: nodes.reduce((s, n) => s + n.health, 0) / nodes.length || 0,
      healthDistribution,
      countries,
      cities,
      bounds: calculateBounds(nodes.map(n => ({ lat: n.lat, lng: n.lng }))),
    };
  }
  
  /**
   * Check if index is ready
   */
  get ready(): boolean {
    return this.isReady;
  }
  
  /**
   * Get total node count
   */
  get totalNodes(): number {
    return this.nodes.length;
  }
}

// ============================================================================
// Altitude <-> Zoom Conversion Utilities
// ============================================================================

/**
 * Convert globe altitude to Supercluster zoom level
 * Uses logarithmic scale for smooth transitions
 */
export function altitudeToZoom(altitude: number): ZoomLevel {
  // Clamp altitude to valid range
  const clampedAlt = Math.max(0.01, Math.min(5, altitude));
  
  // Logarithmic conversion: higher altitude = lower zoom
  // altitude 2.5 -> zoom 2, altitude 0.1 -> zoom 16
  const zoom = Math.round(20 - Math.log2(clampedAlt * 10 + 1) * 3);
  
  return Math.max(0, Math.min(20, zoom)) as ZoomLevel;
}

/**
 * Convert Supercluster zoom level to globe altitude
 */
export function zoomToAltitude(zoom: ZoomLevel): number {
  // Inverse of altitudeToZoom
  const altitude = (Math.pow(2, (20 - zoom) / 3) - 1) / 10;
  return Math.max(0.02, Math.min(5, altitude));
}

/**
 * Get smooth altitude for animation
 */
export function getAnimationAltitude(
  currentAltitude: number,
  targetAltitude: number,
  progress: number // 0-1
): number {
  // Ease-out cubic for smooth deceleration
  const eased = 1 - Math.pow(1 - progress, 3);
  return currentAltitude + (targetAltitude - currentAltitude) * eased;
}

// ============================================================================
// Bounding Box Utilities
// ============================================================================

/**
 * Get visible bounds from globe camera position
 */
export function getVisibleBounds(
  centerLat: number,
  centerLng: number,
  altitude: number
): BoundingBox {
  // Approximate visible area based on altitude
  // Higher altitude = larger visible area
  const latSpan = Math.min(180, altitude * 60);
  const lngSpan = Math.min(360, altitude * 90);
  
  return {
    south: Math.max(-90, centerLat - latSpan / 2),
    north: Math.min(90, centerLat + latSpan / 2),
    west: centerLng - lngSpan / 2,
    east: centerLng + lngSpan / 2,
  };
}

/**
 * Expand bounds by a percentage for prefetching
 */
export function expandBounds(bounds: BoundingBox, factor: number = 0.2): BoundingBox {
  const latPadding = (bounds.north - bounds.south) * factor;
  const lngPadding = (bounds.east - bounds.west) * factor;
  
  return {
    south: Math.max(-90, bounds.south - latPadding),
    north: Math.min(90, bounds.north + latPadding),
    west: bounds.west - lngPadding,
    east: bounds.east + lngPadding,
  };
}

// ============================================================================
// Navigation Path Builder
// ============================================================================

/**
 * Build navigation breadcrumb from current view state
 */
export function buildNavigationPath(
  currentZoom: ZoomLevel,
  centerLat: number,
  centerLng: number,
  focusedCluster?: ClusterFeature,
  focusedNode?: Node3DData
): NavigationStep[] {
  const path: NavigationStep[] = [];
  
  // Always start with global
  path.push({
    type: 'global',
    label: 'Global',
    center: [0, 0],
    zoom: 0 as ZoomLevel,
  });
  
  // Add continent level if zoomed in enough
  if (currentZoom >= 3) {
    const continent = getContinent(centerLat, centerLng);
    path.push({
      type: 'continent',
      label: continent,
      center: [centerLng, centerLat],
      zoom: 3 as ZoomLevel,
    });
  }
  
  // Add country if we have cluster info
  if (focusedCluster && currentZoom >= 5) {
    path.push({
      type: 'country',
      label: focusedCluster.properties.primaryCountry,
      center: focusedCluster.geometry.coordinates,
      zoom: 5 as ZoomLevel,
      clusterId: focusedCluster.properties.cluster_id,
    });
  }
  
  // Add city if available
  if (focusedCluster && focusedCluster.properties.primaryCity !== 'Unknown' && currentZoom >= 10) {
    path.push({
      type: 'city',
      label: focusedCluster.properties.primaryCity,
      center: focusedCluster.geometry.coordinates,
      zoom: 10 as ZoomLevel,
      clusterId: focusedCluster.properties.cluster_id,
    });
  }
  
  // Add specific node if selected
  if (focusedNode) {
    path.push({
      type: 'node',
      label: focusedNode.ip,
      center: [focusedNode.lng, focusedNode.lat],
      zoom: 18 as ZoomLevel,
      nodeId: focusedNode.ip,
    });
  }
  
  return path;
}

/**
 * Get continent name from coordinates
 */
function getContinent(lat: number, lng: number): string {
  // Simplified continent detection
  if (lat > 35 && lng > -30 && lng < 60) return 'Europe';
  if (lat > 0 && lat < 35 && lng > -20 && lng < 60) return 'Africa';
  if (lat < 0 && lng > -20 && lng < 60) return 'Africa';
  if (lat > 10 && lng > 60 && lng < 180) return 'Asia';
  if (lat < 10 && lat > -50 && lng > 90 && lng < 180) return 'Oceania';
  if (lat > 15 && lng > -170 && lng < -30) return 'North America';
  if (lat < 15 && lng > -90 && lng < -30) return 'South America';
  return 'Global';
}

// ============================================================================
// Spiderfying for Overlapping Nodes
// ============================================================================

export interface SpiderfiedNode {
  originalNode: Node3DData;
  displayLat: number;
  displayLng: number;
  legAngle: number;
  legLength: number;
}

/**
 * Calculate spider layout for overlapping nodes at max zoom
 */
export function spiderfyNodes(
  nodes: Node3DData[],
  centerLat: number,
  centerLng: number,
  distance: number = 0.001 // In degrees, ~100m at equator
): SpiderfiedNode[] {
  if (nodes.length <= 1) {
    return nodes.map(node => ({
      originalNode: node,
      displayLat: node.lat,
      displayLng: node.lng,
      legAngle: 0,
      legLength: 0,
    }));
  }
  
  const count = nodes.length;
  const angleStep = (2 * Math.PI) / count;
  
  // ALWAYS use spiral for aesthetic distribution
  const useSpiral = count > 4;
  
  return nodes.map((node, index) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    
    // MUCH MORE AGGRESSIVE spiral for visual separation
    const spiralFactor = useSpiral 
      ? 1 + (index / count) * 1.5 // Increased from 0.5 to 1.5
      : 1;
    const legLength = distance * spiralFactor;
    
    // Calculate offset position with LATITUDE CORRECTION
    const latOffset = Math.cos(angle) * legLength;
    const lngOffset = Math.sin(angle) * legLength / Math.cos(centerLat * Math.PI / 180);
    
    // Only log first and last node to reduce spam
    if (index === 0 || index === nodes.length - 1) {
      console.log(`[Spiderfying] Node ${index + 1}/${nodes.length}:`, {
        ip: node.ip,
        angle: (angle * 180 / Math.PI).toFixed(0) + '°',
        legLength: legLength.toFixed(5),
        fromLat: centerLat.toFixed(6),
        fromLng: centerLng.toFixed(6),
        toLat: (centerLat + latOffset).toFixed(6),
        toLng: (centerLng + lngOffset).toFixed(6),
        offsetLat: latOffset.toFixed(6),
        offsetLng: lngOffset.toFixed(6)
      });
    }
    
    return {
      originalNode: node,
      displayLat: centerLat + latOffset,
      displayLng: centerLng + lngOffset,
      legAngle: angle,
      legLength,
    };
  });
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new adaptive cluster index
 */
export function createClusterIndex(
  config?: Partial<AdaptiveClusterConfig>
): AdaptiveClusterIndex {
  return new AdaptiveClusterIndex(config);
}

// ============================================================================
// Singleton Instance for Global Use
// ============================================================================

let globalIndex: AdaptiveClusterIndex | null = null;

/**
 * Get or create the global cluster index
 */
export function getGlobalClusterIndex(): AdaptiveClusterIndex {
  if (!globalIndex) {
    globalIndex = createClusterIndex();
  }
  return globalIndex;
}

/**
 * Reset the global cluster index
 */
export function resetGlobalClusterIndex(): void {
  globalIndex = null;
}
