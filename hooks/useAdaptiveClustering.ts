/**
 * React Hook for Adaptive Multi-Level Clustering
 * Manages cluster state, zoom transitions, and prefetching
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AdaptiveClusterIndex,
  createClusterIndex,
  altitudeToZoom,
  zoomToAltitude,
  getVisibleBounds,
  expandBounds,
  buildNavigationPath,
  spiderfyNodes,
  type SpiderfiedNode,
} from '@/lib/adaptive-clustering';
import type { Node3DData } from '@/lib/types-3d';
import type {
  PointOrCluster,
  ClusterFeature,
  NodeFeature,
  ZoomLevel,
  BoundingBox,
  NavigationStep,
  ClusterMetrics,
  ClusterExpansionResult,
} from '@/lib/types-clustering';
import { isCluster, isNode, getClusterLevel } from '@/lib/types-clustering';

// ============================================================================
// Hook Configuration
// ============================================================================

export interface UseAdaptiveClusteringOptions {
  // Performance
  debounceMs?: number;           // Debounce zoom changes (default: 50)
  prefetchAdjacent?: boolean;    // Prefetch adjacent zoom levels (default: true)
  maxCacheSize?: number;         // Max cached zoom levels (default: 5)
  
  // Clustering
  clusterRadius?: number;        // Supercluster radius (default: 60)
  minZoom?: number;              // Min clustering zoom (default: 0)
  maxZoom?: number;              // Max clustering zoom (default: 18)
  
  // Spiderfying
  enableSpiderfying?: boolean;   // Enable spider layout (default: true)
  spiderfyZoomThreshold?: number; // Zoom level to start spiderfying (default: 16)
  spiderfyDistance?: number;     // Distance between spiderfied nodes (default: 0.0005)
}

const DEFAULT_OPTIONS: Required<UseAdaptiveClusteringOptions> = {
  debounceMs: 50,
  prefetchAdjacent: true,
  maxCacheSize: 5,
  clusterRadius: 60,
  minZoom: 0,
  maxZoom: 18,
  enableSpiderfying: true,
  spiderfyZoomThreshold: 16,
  spiderfyDistance: 0.0005,
};

// ============================================================================
// Hook State Types
// ============================================================================

export interface ClusteringState {
  // Cluster data
  clusters: PointOrCluster[];
  spiderfiedNodes: SpiderfiedNode[];
  
  // View state
  currentZoom: ZoomLevel;
  currentAltitude: number;
  visibleBounds: BoundingBox | null;
  
  // Navigation
  navigationPath: NavigationStep[];
  focusedCluster: ClusterFeature | null;
  selectedNode: Node3DData | null;
  
  // Status
  isReady: boolean;
  isLoading: boolean;
  totalNodes: number;
  visibleClusters: number;
  
  // Performance
  lastUpdateMs: number;
}

export interface ClusteringActions {
  // Data management
  loadNodes: (nodes: Node3DData[]) => void;
  
  // View control
  setAltitude: (altitude: number) => void;
  setCenter: (lat: number, lng: number) => void;
  
  // Cluster interaction
  expandCluster: (cluster: ClusterFeature) => ClusterExpansionResult;
  getClusterMetrics: (clusterId: number) => ClusterMetrics | null;
  getClusterChildren: (clusterId: number) => PointOrCluster[];
  getClusterLeaves: (clusterId: number) => Node3DData[];
  
  // Node interaction
  selectNode: (node: Node3DData | null) => void;
  focusCluster: (cluster: ClusterFeature | null) => void;
  
  // Navigation
  navigateTo: (step: NavigationStep) => void;
  resetView: () => void;
}

// ============================================================================
// Main Hook
// ============================================================================

export function useAdaptiveClustering(
  initialNodes: Node3DData[] = [],
  options: UseAdaptiveClusteringOptions = {}
): [ClusteringState, ClusteringActions] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Refs for stable references
  const indexRef = useRef<AdaptiveClusterIndex | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const prefetchRef = useRef<Set<number>>(new Set());
  
  // State
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAltitude, setCurrentAltitudeState] = useState(2.5);
  const [centerLat, setCenterLat] = useState(0);
  const [centerLng, setCenterLng] = useState(0);
  const [clusters, setClusters] = useState<PointOrCluster[]>([]);
  const [spiderfiedNodes, setSpiderfiedNodes] = useState<SpiderfiedNode[]>([]);
  const [focusedCluster, setFocusedCluster] = useState<ClusterFeature | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [lastUpdateMs, setLastUpdateMs] = useState(0);
  
  // Derived state
  const currentZoom = useMemo(() => altitudeToZoom(currentAltitude), [currentAltitude]);
  
  const visibleBounds = useMemo(
    () => getVisibleBounds(centerLat, centerLng, currentAltitude),
    [centerLat, centerLng, currentAltitude]
  );
  
  const navigationPath = useMemo(
    () => buildNavigationPath(currentZoom, centerLat, centerLng, focusedCluster || undefined, selectedNode || undefined),
    [currentZoom, centerLat, centerLng, focusedCluster, selectedNode]
  );
  
  // ============================================================================
  // Index Initialization
  // ============================================================================
  
  useEffect(() => {
    // Create cluster index
    indexRef.current = createClusterIndex({
      radius: opts.clusterRadius,
      minZoom: opts.minZoom,
      maxZoom: opts.maxZoom,
    });
    
    // Load initial nodes if provided
    if (initialNodes.length > 0) {
      indexRef.current.load(initialNodes);
      setIsReady(true);
      updateClusters();
    }
    
    return () => {
      indexRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ============================================================================
  // Cluster Update Logic
  // ============================================================================
  
  const updateClusters = useCallback(() => {
    if (!indexRef.current?.ready) return;
    
    const startTime = performance.now();
    
    // Get clusters for current view
    const bounds = getVisibleBounds(centerLat, centerLng, currentAltitude);
    const zoom = altitudeToZoom(currentAltitude);
    const newClusters = indexRef.current.getClusters(bounds, zoom);
    
    setClusters(newClusters);
    
    // Handle spiderfying at high zoom levels OR for small clusters
    const shouldSpiderfy = opts.enableSpiderfying && (
      zoom >= opts.spiderfyZoomThreshold || 
      currentAltitude < 0.05 // Force spiderfying at very close zoom
    );
    
    if (shouldSpiderfy) {
      // Collect all nodes - including those inside small clusters
      const allNodes: Node3DData[] = [];
      const clusterCenters = new Map<number, {lat: number, lng: number}>();
      
      newClusters.forEach(c => {
        if (!isCluster(c)) {
          // Individual node
          allNodes.push((c as NodeFeature).properties.node);
        } else if (c.properties.point_count <= 20) {
          // Small cluster at high zoom - extract all leaves for spiderfying
          const leaves = indexRef.current?.getClusterLeaves(c.properties.cluster_id) || [];
          const [lng, lat] = c.geometry.coordinates;
          
          // Store cluster center for spider layout
          leaves.forEach(leaf => {
            allNodes.push(leaf);
          });
          
          clusterCenters.set(c.properties.cluster_id, { lat, lng });
          
          console.log('[Spiderfying] Expanding cluster:', {
            clusterId: c.properties.cluster_id,
            count: c.properties.point_count,
            leavesFound: leaves.length,
            center: { lat, lng }
          });
        }
      });
      
      // Group overlapping nodes with aggressive threshold
      const overlappingGroups = groupOverlappingNodes(allNodes, opts.spiderfyDistance * 10);
      
      const spiderfied: SpiderfiedNode[] = [];
      overlappingGroups.forEach(group => {
        if (group.length > 1) {
          const center = {
            lat: group.reduce((s, n) => s + n.lat, 0) / group.length,
            lng: group.reduce((s, n) => s + n.lng, 0) / group.length,
          };
          const spread = spiderfyNodes(group, center.lat, center.lng, opts.spiderfyDistance);
          spiderfied.push(...spread);
          
          console.log('[Spiderfying] Group:', {
            nodeCount: group.length,
            center,
            nodes: group.map(n => n.ip)
          });
        }
      });
      
      console.log('[Spiderfying] Summary:', {
        zoom,
        altitude: currentAltitude,
        totalNodes: allNodes.length,
        overlappingGroups: overlappingGroups.length,
        spiderfiedCount: spiderfied.length,
        shouldSpiderfy
      });
      
      setSpiderfiedNodes(spiderfied);
    } else {
      setSpiderfiedNodes([]);
    }
    
    const endTime = performance.now();
    setLastUpdateMs(endTime - startTime);
    
    // Prefetch adjacent zoom levels
    if (opts.prefetchAdjacent) {
      prefetchAdjacentLevels(zoom, bounds);
    }
  }, [centerLat, centerLng, currentAltitude, opts]);
  
  // Debounced update on altitude change
  useEffect(() => {
    if (!isReady) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      updateClusters();
    }, opts.debounceMs);
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAltitude, centerLat, centerLng, isReady, opts.debounceMs]); // updateClusters is stable via useCallback
  
  // ============================================================================
  // Prefetching
  // ============================================================================
  
  const prefetchAdjacentLevels = useCallback((zoom: ZoomLevel, bounds: BoundingBox) => {
    if (!indexRef.current?.ready) return;
    
    const expandedBounds = expandBounds(bounds, 0.3);
    const adjacentZooms = [
      Math.max(0, zoom - 1) as ZoomLevel,
      Math.min(20, zoom + 1) as ZoomLevel,
    ];
    
    adjacentZooms.forEach(z => {
      const key = z;
      if (!prefetchRef.current.has(key)) {
        prefetchRef.current.add(key);
        // Prefetch in next tick to not block current render
        setTimeout(() => {
          indexRef.current?.getClusters(expandedBounds, z);
        }, 0);
      }
    });
    
    // Clear old prefetch keys
    if (prefetchRef.current.size > opts.maxCacheSize * 2) {
      prefetchRef.current.clear();
    }
  }, [opts.maxCacheSize]);
  
  // ============================================================================
  // Actions
  // ============================================================================
  
  const loadNodes = useCallback((nodes: Node3DData[]) => {
    if (!indexRef.current) {
      indexRef.current = createClusterIndex({
        radius: opts.clusterRadius,
        minZoom: opts.minZoom,
        maxZoom: opts.maxZoom,
      });
    }
    
    setIsLoading(true);
    
    // Use requestIdleCallback for large datasets
    const load = () => {
      indexRef.current!.load(nodes);
      setIsReady(true);
      setIsLoading(false);
      // Don't call updateClusters here - let the useEffect handle it
    };
    
    if (nodes.length > 5000 && typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(load, { timeout: 1000 });
    } else {
      load();
    }
  }, [opts.clusterRadius, opts.minZoom, opts.maxZoom]);
  
  const setAltitude = useCallback((altitude: number) => {
    setCurrentAltitudeState(Math.max(0.02, Math.min(5, altitude)));
  }, []);
  
  const setCenter = useCallback((lat: number, lng: number) => {
    setCenterLat(lat);
    setCenterLng(lng);
  }, []);
  
  const expandCluster = useCallback((cluster: ClusterFeature): ClusterExpansionResult => {
    if (!indexRef.current?.ready) {
      return {
        targetZoom: 20 as ZoomLevel,
        targetAltitude: 0.02,
        center: cluster.geometry.coordinates,
        willFullyExpand: true,
      };
    }
    
    const result = indexRef.current.getOptimalExpansion(cluster, currentZoom);
    setFocusedCluster(cluster);
    return result;
  }, [currentZoom]);
  
  const getClusterMetrics = useCallback((clusterId: number): ClusterMetrics | null => {
    if (!indexRef.current?.ready) return null;
    return indexRef.current.getClusterMetrics(clusterId);
  }, []);
  
  const getClusterChildren = useCallback((clusterId: number): PointOrCluster[] => {
    if (!indexRef.current?.ready) return [];
    return indexRef.current.getClusterChildren(clusterId);
  }, []);
  
  const getClusterLeaves = useCallback((clusterId: number): Node3DData[] => {
    if (!indexRef.current?.ready) return [];
    return indexRef.current.getClusterLeaves(clusterId);
  }, []);
  
  const selectNode = useCallback((node: Node3DData | null) => {
    setSelectedNode(node);
  }, []);
  
  const focusCluster = useCallback((cluster: ClusterFeature | null) => {
    setFocusedCluster(cluster);
  }, []);
  
  const navigateTo = useCallback((step: NavigationStep) => {
    const [lng, lat] = step.center;
    setCenterLat(lat);
    setCenterLng(lng);
    setCurrentAltitudeState(zoomToAltitude(step.zoom));
    
    if (step.clusterId !== undefined) {
      // Find and focus the cluster
      const bounds = getVisibleBounds(lat, lng, zoomToAltitude(step.zoom));
      const clusters = indexRef.current?.getClusters(bounds, step.zoom) || [];
      const cluster = clusters.find(
        c => isCluster(c) && c.properties.cluster_id === step.clusterId
      ) as ClusterFeature | undefined;
      setFocusedCluster(cluster || null);
    } else {
      setFocusedCluster(null);
    }
    
    if (step.nodeId) {
      const nodes = indexRef.current?.getClusterLeaves(0) || [];
      const node = nodes.find(n => n.ip === step.nodeId);
      setSelectedNode(node || null);
    } else {
      setSelectedNode(null);
    }
  }, []);
  
  const resetView = useCallback(() => {
    setCurrentAltitudeState(2.5);
    setCenterLat(0);
    setCenterLng(0);
    setFocusedCluster(null);
    setSelectedNode(null);
  }, []);
  
  // ============================================================================
  // Return State and Actions
  // ============================================================================
  
  const state: ClusteringState = {
    clusters,
    spiderfiedNodes,
    currentZoom,
    currentAltitude,
    visibleBounds,
    navigationPath,
    focusedCluster,
    selectedNode,
    isReady,
    isLoading,
    totalNodes: indexRef.current?.totalNodes || 0,
    visibleClusters: clusters.length,
    lastUpdateMs,
  };
  
  const actions: ClusteringActions = {
    loadNodes,
    setAltitude,
    setCenter,
    expandCluster,
    getClusterMetrics,
    getClusterChildren,
    getClusterLeaves,
    selectNode,
    focusCluster,
    navigateTo,
    resetView,
  };
  
  return [state, actions];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Group nodes that are very close together
 */
function groupOverlappingNodes(nodes: Node3DData[], threshold: number): Node3DData[][] {
  const groups: Node3DData[][] = [];
  const used = new Set<string>();
  
  nodes.forEach(node => {
    if (used.has(node.ip)) return;
    
    const group = [node];
    used.add(node.ip);
    
    nodes.forEach(other => {
      if (used.has(other.ip)) return;
      
      const latDiff = Math.abs(node.lat - other.lat);
      const lngDiff = Math.abs(node.lng - other.lng);
      
      if (latDiff < threshold && lngDiff < threshold) {
        group.push(other);
        used.add(other.ip);
      }
    });
    
    groups.push(group);
  });
  
  return groups;
}

// ============================================================================
// Utility Hook for Cluster Color
// ============================================================================

export function useClusterColor(
  cluster: PointOrCluster,
  theme: { excellent: string; good: string; warning: string; critical: string }
): string {
  return useMemo(() => {
    if (!isCluster(cluster)) {
      const node = (cluster as NodeFeature).properties.node;
      const health = node.health;
      if (health >= 80) return theme.excellent;
      if (health >= 60) return theme.good;
      if (health >= 40) return theme.warning;
      return theme.critical;
    }
    
    const avgHealth = cluster.properties.avgHealth;
    if (avgHealth >= 80) return theme.excellent;
    if (avgHealth >= 60) return theme.good;
    if (avgHealth >= 40) return theme.warning;
    return theme.critical;
  }, [cluster, theme]);
}

// ============================================================================
// Export utilities
// ============================================================================

export { isCluster, isNode, getClusterLevel };
