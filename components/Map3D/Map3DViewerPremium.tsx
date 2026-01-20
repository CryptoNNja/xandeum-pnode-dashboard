'use client';

/**
 * Map3DViewerPremium - Premium Multi-Level Clustering Globe
 * Google Maps-style adaptive clustering with Supercluster
 * 
 * Features:
 * - 20+ zoom levels with smooth transitions
 * - Hierarchical clustering (Continent → Country → City → Node)
 * - Animated cluster markers with Framer Motion
 * - Spiderfying for overlapping nodes at max zoom
 * - Navigation breadcrumb
 * - Performance optimized with R-tree spatial indexing
 */

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getMapTheme, getNodeColorByHealth, getStatusColors } from '@/lib/map-theme';
import { pnodeToNode3D, getFlagEmoji } from '@/lib/map-3d-utils';
import { useAdaptiveClustering, isCluster, isNode } from '@/hooks/useAdaptiveClustering';
import { ClusterMarker, ClusterTooltip } from './ClusterMarker';
import { Map3DControlsEnhanced } from './Map3DControlsEnhanced';
import { 
  altitudeToZoom, 
  zoomToAltitude,
  getVisibleBounds,
} from '@/lib/adaptive-clustering';
import {
  type ClusterFeature,
  type NodeFeature,
  type PointOrCluster,
  type NavigationStep,
  getClusterVisualConfig,
  formatClusterCount,
  ZOOM_LEVELS,
} from '@/lib/types-clustering';
import type { PNode } from '@/lib/types';
import type { Node3DData, Globe3DMode, Globe3DFilter } from '@/lib/types-3d';

// Dynamic import for Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent border-current rounded-full animate-spin mx-auto mb-4" />
        <p>Loading globe...</p>
      </div>
    </div>
  ),
});

// ============================================================================
// Types
// ============================================================================

interface Map3DViewerPremiumProps {
  allNodes: PNode[];
  onClose: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

export function Map3DViewerPremium({ allNodes, onClose }: Map3DViewerPremiumProps) {
  const router = useRouter();
  const { theme: appTheme } = useTheme();
  const globeRef = useRef<any>(null);
  
  // Client-side rendering check
  const [isClient, setIsClient] = useState(false);
  const [themeMounted, setThemeMounted] = useState(false);
  
  // Globe state
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [hoveredCluster, setHoveredCluster] = useState<PointOrCluster | null>(null);
  const [countriesData, setCountriesData] = useState<any>({ features: [] });
  
  // View state
  const [filter, setFilter] = useState<Globe3DFilter>({
    health: 'all',
    network: 'all',
    activeOnly: false,
  });
  
  const [showOperatorConnections, setShowOperatorConnections] = useState(false); // Disabled by default
  
  // Convert PNodes to Node3DData
  const nodes3D = useMemo(() => {
    return allNodes
      .map(pnodeToNode3D)
      .filter((node): node is Node3DData => node !== null);
  }, [allNodes]);
  
  // Apply filters
  const filteredNodes = useMemo(() => {
    return nodes3D.filter(node => {
      if (filter.health !== 'all') {
        if (filter.health === 'healthy' && node.health < 70) return false;
        if (filter.health === 'warning' && (node.health < 40 || node.health >= 70)) return false;
        if (filter.health === 'critical' && node.health >= 40) return false;
      }
      if (filter.network !== 'all') {
        if (filter.network === 'public' && !node.isPublic) return false;
        if (filter.network === 'private' && node.isPublic) return false;
      }
      if (filter.activeOnly && node.status !== 'active') return false;
      return true;
    });
  }, [nodes3D, filter]);
  
  // Initialize adaptive clustering - STABLE config to prevent re-renders
  const clusterConfig = useMemo(() => ({
    debounceMs: 300, // MAXIMUM debounce for smoothness
    prefetchAdjacent: false,
    clusterRadius: 40,
    maxZoom: 16,
    enableSpiderfying: true,
    spiderfyZoomThreshold: 15,
    spiderfyDistance: 0.01, // 1km - balanced
  }), []);
  
  const [clusterState, clusterActions] = useAdaptiveClustering([], clusterConfig);
  
  // Theme
  const mapTheme = useMemo(() => {
    if (!themeMounted) return null;
    return getMapTheme(appTheme);
  }, [appTheme, themeMounted]);
  
  const statusColors = useMemo(() => {
    if (!themeMounted) return null;
    return getStatusColors(appTheme);
  }, [appTheme, themeMounted]);
  
  // ============================================================================
  // Initialization
  // ============================================================================
  
  useEffect(() => {
    setIsClient(true);
    setThemeMounted(true);
    
    // Load countries GeoJSON
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountriesData)
      .catch(console.error);
  }, []);
  
  // Load nodes into cluster index - use ref to avoid infinite loop
  const loadNodesRef = useRef(clusterActions.loadNodes);
  loadNodesRef.current = clusterActions.loadNodes;
  
  useEffect(() => {
    if (filteredNodes.length > 0) {
      loadNodesRef.current(filteredNodes);
    }
  }, [filteredNodes]);
  
  // ============================================================================
  // Globe Event Handlers
  // ============================================================================
  
  const handleGlobeReady = useCallback(() => {
    if (!globeRef.current) return;
    
    // Set initial view
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
    
    // Setup controls - SMOOTH ROTATION
    const controls = globeRef.current.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.2; // Slower for smoothness
      controls.enableDamping = true;
      controls.dampingFactor = 0.05; // More damping = smoother
      controls.rotateSpeed = 0.3; // Slower manual rotation
      controls.zoomSpeed = 1.0;
      controls.minDistance = 101;
      controls.maxDistance = 1000;
      
      // Stop auto-rotation on interaction
      const handleInteraction = () => {
        if (!hasUserInteracted) {
          setHasUserInteracted(true);
          controls.autoRotate = false;
        }
      };
      
      controls.addEventListener('start', handleInteraction);
    }
  }, [hasUserInteracted]);
  
  // Store actions in refs to avoid dependency issues
  const setAltitudeRef = useRef(clusterActions.setAltitude);
  const setCenterRef = useRef(clusterActions.setCenter);
  setAltitudeRef.current = clusterActions.setAltitude;
  setCenterRef.current = clusterActions.setCenter;
  
  const handleZoom = useCallback((pov: any) => {
    if (pov && typeof pov.altitude === 'number') {
      setAltitudeRef.current(pov.altitude);
      
      // Update center for cluster calculations
      if (typeof pov.lat === 'number' && typeof pov.lng === 'number') {
        setCenterRef.current(pov.lat, pov.lng);
      }
    }
  }, []);
  
  // ============================================================================
  // Cluster Interaction
  // ============================================================================
  
  const handleClusterClick = useCallback((cluster: ClusterFeature) => {
    if (!globeRef.current) {
      console.error('[Cluster Click] globeRef is null!');
      return;
    }
    
    const [lng, lat] = cluster.geometry.coordinates;
    const count = cluster.properties.point_count;
    
    console.log('[Cluster Click] ========== CLUSTER CLICKED ==========');
    console.log('[Cluster Click] Cluster details:', {
      clusterId: cluster.properties.cluster_id,
      count,
      position: { lat, lng },
      currentZoom: clusterState.currentZoom,
      currentAltitude: clusterState.currentAltitude,
      willSpiderfy: count <= 20,
    });
    
    // For small clusters (≤20 nodes), force spiderfying immediately
    if (count <= 20) {
      console.log('[Cluster Click] ✅ Small cluster - will spiderfy');
      // Get all nodes in this cluster
      const leaves = clusterActions.getClusterLeaves(cluster.properties.cluster_id);
      
      // Calculate TRUE centroid from actual node positions
      const centerLat = leaves.reduce((s, n) => s + n.lat, 0) / leaves.length;
      const centerLng = leaves.reduce((s, n) => s + n.lng, 0) / leaves.length;
      
      console.log('[Cluster Click] 📍 POSITIONS CRITICAL DEBUG:');
      console.log('  Cluster position from Supercluster:', lat, lng);
      console.log('  True center calculated from nodes:', centerLat, centerLng);
      console.log('  Nodes in cluster:', leaves.map(n => `${n.ip} @ (${n.lat.toFixed(4)}, ${n.lng.toFixed(4)})`));
      console.log('  Will zoom to:', { lat: centerLat, lng: centerLng, altitude: 0.08 });
      
      console.log('[Cluster Click] 🚀 Executing pointOfView animation...');
      
      // ZOOM TO TRUE CENTER - VERY CLOSE to see spider
      try {
        globeRef.current.pointOfView(
          { lat: centerLat, lng: centerLng, altitude: 0.05 }, // VERY close = nodes fill screen
          1200 // Shorter animation = less lag
        );
        console.log('[Cluster Click] ✅ pointOfView executed successfully');
      } catch (error) {
        console.error('[Cluster Click] ❌ Error calling pointOfView:', error);
      }
      
      // Focus this cluster for navigation
      clusterActions.focusCluster(cluster);
      
      return;
    }
    
    // For larger clusters (>20), use normal expansion logic
    console.log('[Cluster Click] ✅ Large cluster - will use expansion zoom');
    
    const expansion = clusterActions.expandCluster(cluster);
    let targetAltitude = expansion.targetAltitude;
    
    if (count > 100) {
      targetAltitude = Math.max(0.04, targetAltitude * 0.3);
    } else if (count > 50) {
      targetAltitude = Math.max(0.05, targetAltitude * 0.4);
    } else {
      targetAltitude = Math.max(0.06, targetAltitude * 0.5);
    }
    
    console.log('[Cluster Click] Expansion details:', {
      expansionZoom: expansion.targetZoom,
      targetAltitude,
      targetPosition: { lat, lng }
    });
    
    console.log('[Cluster Click] 🚀 Executing pointOfView animation...');
    
    // Animate to the cluster
    try {
      globeRef.current.pointOfView(
        { lat, lng, altitude: targetAltitude },
        1200
      );
      console.log('[Cluster Click] ✅ pointOfView executed successfully');
    } catch (error) {
      console.error('[Cluster Click] ❌ Error calling pointOfView:', error);
    }
  }, [clusterActions, clusterState.currentZoom, clusterState.currentAltitude]);
  
  const handleNodeClick = useCallback((feature: NodeFeature) => {
    const node = feature.properties.node;
    clusterActions.selectNode(node);
  }, [clusterActions]);
  
  const handleNavigate = useCallback((step: NavigationStep) => {
    if (!globeRef.current) return;
    
    const [lng, lat] = step.center;
    const altitude = zoomToAltitude(step.zoom);
    
    globeRef.current.pointOfView({ lat, lng, altitude }, 1000);
    clusterActions.navigateTo(step);
  }, [clusterActions]);
  
  // ============================================================================
  // Zoom Controls
  // ============================================================================
  
  const handleZoomIn = useCallback(() => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    globeRef.current.pointOfView(
      { ...pov, altitude: Math.max(0.05, pov.altitude * 0.6) },
      300
    );
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (!globeRef.current) return;
    const pov = globeRef.current.pointOfView();
    globeRef.current.pointOfView(
      { ...pov, altitude: Math.min(4, pov.altitude * 1.5) },
      300
    );
  }, []);
  
  const handleReset = useCallback(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
    clusterActions.resetView();
  }, [clusterActions]);
  
  // ============================================================================
  // Prepare Globe Data
  // ============================================================================
  
  // Spider legs - calculate center and connections (memoized)
  const spiderLegs = useMemo(() => {
    if (clusterState.spiderfiedNodes.length === 0) return [];
    
    // Calculate center of all spiderfied nodes (cluster centroid)
    const centerLat = clusterState.spiderfiedNodes.reduce((s, n) => s + n.originalNode.lat, 0) / clusterState.spiderfiedNodes.length;
    const centerLng = clusterState.spiderfiedNodes.reduce((s, n) => s + n.originalNode.lng, 0) / clusterState.spiderfiedNodes.length;
    
    return clusterState.spiderfiedNodes
      .filter(s => s.legLength > 0)
      .map(s => ({
        startLat: centerLat,  // Spider starts from cluster center
        startLng: centerLng,
        endLat: s.displayLat, // Spider ends at node position
        endLng: s.displayLng,
      }));
  }, [clusterState.spiderfiedNodes]);
  
  // Generate operator arcs - connect nodes from same operator at high zoom
  const operatorArcs = useMemo(() => {
    if (!showOperatorConnections || clusterState.currentZoom < 12 || !mapTheme) return [];
    
    // Only show arcs for individual nodes (not clusters)
    const individualNodes = clusterState.clusters
      .filter(c => !isCluster(c))
      .map(c => (c as NodeFeature).properties.node);
    
    // Group by operator
    const operatorGroups = new Map<string, Node3DData[]>();
    individualNodes.forEach(node => {
      const operator = node.operator || 'Unknown';
      if (!operatorGroups.has(operator)) {
        operatorGroups.set(operator, []);
      }
      operatorGroups.get(operator)!.push(node);
    });
    
    // Create arcs between nodes of the same operator (max 5 connections per node)
    const arcs: any[] = [];
    operatorGroups.forEach((nodes, operator) => {
      if (nodes.length < 2 || nodes.length > 50) return; // Skip if too few or too many
      
      // Connect each node to its 2 nearest neighbors in the same operator
      nodes.forEach((node, i) => {
        const nearestNeighbors = nodes
          .filter((_, j) => j !== i)
          .map(other => ({
            node: other,
            distance: Math.sqrt(
              Math.pow(node.lat - other.lat, 2) + 
              Math.pow(node.lng - other.lng, 2)
            )
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 2); // Only 2 nearest
        
        nearestNeighbors.forEach(({ node: other }) => {
          arcs.push({
            startLat: node.lat,
            startLng: node.lng,
            endLat: other.lat,
            endLng: other.lng,
            operator,
            color: getNodeColorByHealth(node.health, mapTheme!),
          });
        });
      });
    });
    
    return arcs;
  }, [clusterState.clusters, clusterState.currentZoom, showOperatorConnections, mapTheme]);
  
  const htmlElementsData = useMemo(() => {
    if (!mapTheme || !clusterState.isReady) return [];
    
    const elements: any[] = [];
    
    // Build set of IPs that are spiderfied for quick lookup
    const spiderfiedIPs = new Set(
      clusterState.spiderfiedNodes.map(s => s.originalNode.ip)
    );
    
    // Add clusters and individual nodes
    clusterState.clusters.forEach((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isClusterPoint = isCluster(cluster);
      const count = isClusterPoint ? cluster.properties.point_count : 1;
      
      // FORCE SKIP small clusters when spider mode is active
      if (isClusterPoint && spiderfiedIPs.size > 0 && count <= 20) {
        console.log('[Render] ❌ Hiding cluster (spider active):', {
          clusterId: cluster.properties.cluster_id,
          count
        });
        return; // Hide ALL small clusters when spiderfying
      }
      
      // Skip individual nodes that are being spiderfied (they'll be shown at spider positions)
      if (!isClusterPoint) {
        const node = (cluster as NodeFeature).properties.node;
        if (spiderfiedIPs.has(node.ip)) {
          return;
        }
      }
      
      // Determine color - NEUTRAL for clusters, HEALTH-BASED for individual nodes only
      let color: string;
      if (isClusterPoint) {
        // Clusters are neutral (white/gray) - they don't represent health
        color = '#94A3B8'; // Neutral slate gray
      } else {
        // Only individual nodes show health color
        const node = (cluster as NodeFeature).properties.node;
        color = getNodeColorByHealth(node.health, mapTheme);
      }
      
      elements.push({
        id: isClusterPoint ? `cluster-${cluster.properties.cluster_id}` : `node-${(cluster as NodeFeature).properties.nodeId}`,
        lat,
        lng,
        cluster,
        color,
        count,
        isCluster: isClusterPoint,
      });
    });
    
    // Add CENTER POINT for spider (clickable to close)
    if (clusterState.spiderfiedNodes.length > 0) {
      const centerLat = clusterState.spiderfiedNodes[0].originalNode.lat;
      const centerLng = clusterState.spiderfiedNodes[0].originalNode.lng;
      
      elements.push({
        id: 'spider-center',
        lat: centerLat,
        lng: centerLng,
        cluster: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [centerLng, centerLat],
          },
          properties: {
            cluster: true,
            cluster_id: -1, // Special ID for spider center
            point_count: clusterState.spiderfiedNodes.length,
            point_count_abbreviated: clusterState.spiderfiedNodes.length,
            avgHealth: 50,
            minHealth: 0,
            maxHealth: 100,
            totalStorage: 0,
            countries: [],
            cities: [],
            primaryCountry: 'Spider Center',
            primaryCity: '',
            operators: 0,
          },
        } as ClusterFeature,
        color: '#94A3B8', // Gray center
        count: clusterState.spiderfiedNodes.length,
        isCluster: true,
        isSpiderCenter: true,
      });
    }
    
    // Add spiderfied nodes (these replace clusters at high zoom)
    clusterState.spiderfiedNodes.forEach((spiderfied, index) => {
      const node = spiderfied.originalNode;
      const color = getNodeColorByHealth(node.health, mapTheme);
      
      elements.push({
        id: `spiderfied-${node.ip}-${index}`,
        lat: spiderfied.displayLat,
        lng: spiderfied.displayLng,
        cluster: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [spiderfied.displayLng, spiderfied.displayLat],
          },
          properties: {
            nodeId: node.ip,
            node: node,
            cluster: false,
          },
        } as NodeFeature,
        color,
        count: 1,
        isCluster: false,
        isSpiderfied: true,
      });
    });
    
    return elements;
  }, [clusterState.clusters, clusterState.spiderfiedNodes, clusterState.isReady, mapTheme, statusColors]);
  
  // ============================================================================
  // Render Helpers
  // ============================================================================
  
  const getViewLevelLabel = useCallback(() => {
    const zoom = clusterState.currentZoom;
    const config = ZOOM_LEVELS[zoom];
    return config?.name || 'Global';
  }, [clusterState.currentZoom]);
  
  // ============================================================================
  // Loading State
  // ============================================================================
  
  if (!isClient || !themeMounted || !mapTheme) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: '#020204' }}>
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-t-transparent border-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg">Initializing Globe...</p>
          <p className="text-sm text-gray-400 mt-2">{allNodes.length} nodes to render</p>
        </div>
      </div>
    );
  }
  
  // ============================================================================
  // Main Render
  // ============================================================================
  
  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: mapTheme.background }}>
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-[10000] px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl"
        style={{
          background: `${mapTheme.ui.card}ee`,
          borderColor: mapTheme.ui.cardBorder,
        }}
      >
        <div>
          <h2 className="text-xl font-bold" style={{ color: mapTheme.ui.text }}>
            Network Globe
            <span className="ml-2 text-sm font-normal px-2 py-0.5 rounded-full" style={{ background: mapTheme.ui.accent + '20', color: mapTheme.ui.accent }}>
              Premium
            </span>
          </h2>
          <p className="text-sm" style={{ color: mapTheme.ui.textSecondary }}>
            {filteredNodes.length} nodes • {clusterState.visibleClusters} clusters • {clusterState.lastUpdateMs.toFixed(1)}ms
          </p>
        </div>
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          {clusterState.navigationPath.map((step, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <span className="mx-1 text-gray-500">›</span>}
              <button
                onClick={() => handleNavigate(step)}
                className="px-2 py-1 rounded text-sm hover:bg-white/10 transition-colors"
                style={{
                  color: index === clusterState.navigationPath.length - 1 
                    ? mapTheme.ui.accent 
                    : mapTheme.ui.textSecondary,
                }}
              >
                {step.label}
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Removed operator connections toggle - feature disabled */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-white/10 transition-colors"
            style={{
              borderColor: mapTheme.ui.cardBorder,
              color: mapTheme.ui.text,
            }}
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Globe Container */}
      <div className="w-full h-full pt-[72px]">
        <Globe
          ref={globeRef}
          globeImageUrl={null}
          backgroundColor={mapTheme.background}
          
          // Country polygons
          polygonsData={countriesData.features}
          polygonCapColor={() => mapTheme.countries.fill}
          polygonSideColor={() => mapTheme.background}
          polygonStrokeColor={() => mapTheme.countries.stroke}
          polygonAltitude={0.005}
          
          // Atmosphere
          showAtmosphere={true}
          atmosphereColor={mapTheme.countries.stroke}
          atmosphereAltitude={0.15}
          
          // Spider legs - DISABLED (causing gray blob)
          arcsData={[]} // Empty = no spider legs
          
          // HTML elements for clusters (main interaction layer)
          htmlElementsData={htmlElementsData}
          htmlElement={(d: any) => {
            const el = document.createElement('div');
            el.style.cssText = 'transform: translate(-50%, -50%); pointer-events: none;';
            
            const { cluster, color, count, isCluster: isClusterPoint } = d;
            const config = getClusterVisualConfig(count);
            
            // Calculate size - MUCH LARGER for spiderfied nodes
            let size: number;
            if (!isClusterPoint) {
              // Check if this is a spiderfied node (VERY large)
              const isSpiderfiedNode = d.isSpiderfied === true;
              size = isSpiderfiedNode ? 25 : 15; // Spiderfied nodes are 66% bigger
            } else {
              // Use cube root for even more subtle scaling - feels more natural
              const cubeRoot = Math.pow(count, 1/3);
              size = Math.max(22, Math.min(20 + cubeRoot * 3.5, 48)); // Range: 22-48px
            }
            
            const inner = document.createElement('div');
            // Enable pointer events on the inner element
            inner.style.pointerEvents = 'auto';
            
            if (isClusterPoint) {
              // Cluster marker - PREMIUM NEUTRAL glass morphism effect
              inner.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(148,163,184,0.08) 100%);
                border: ${config.borderWidth}px solid rgba(148,163,184,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: ${Math.max(config.fontSize - 1, 9)}px;
                color: rgba(255,255,255,0.95);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                box-shadow: 
                  0 4px 16px rgba(0,0,0,0.3), 
                  0 0 ${size/3}px rgba(148,163,184,0.2), 
                  inset 0 1px 0 rgba(255,255,255,0.15),
                  inset 0 -1px 0 rgba(0,0,0,0.1);
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                text-shadow: 0 1px 2px rgba(0,0,0,0.6);
                backdrop-filter: blur(12px) saturate(1.2);
                pointer-events: auto;
              `;
              
              if (config.showCount) {
                inner.textContent = formatClusterCount(count);
              }
              
              // Pulse animation for large clusters
              if (config.pulseAnimation) {
                inner.style.animation = 'pulse 2s ease-in-out infinite';
              }
            } else {
              // Individual node marker - PREMIUM HEALTH COLOR with glow
              inner.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${color} 0%, ${color}DD 100%);
                border: 2.5px solid rgba(255,255,255,0.95);
                box-shadow: 
                  0 3px 12px rgba(0,0,0,0.35), 
                  0 0 ${size * 1.8}px ${color}70,
                  inset 0 1px 0 rgba(255,255,255,0.2);
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
              `;
            }
            
            // Hover effects - use data attribute to avoid React state updates causing re-renders
            inner.dataset.clusterId = d.id;
            
            inner.addEventListener('mouseenter', () => {
              if (isClusterPoint) {
                inner.style.transform = 'scale(1.15)';
                inner.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4), 0 0 24px rgba(148,163,184,0.4), inset 0 1px 0 rgba(255,255,255,0.25)';
                inner.style.borderColor = 'rgba(255,255,255,0.7)';
                inner.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(148,163,184,0.12) 100%)';
              } else {
                inner.style.transform = 'scale(1.4)';
                inner.style.boxShadow = `0 4px 20px rgba(0,0,0,0.45), 0 0 ${size * 2.5}px ${color}`;
                inner.style.borderWidth = '3px';
              }
              // Don't update React state on hover - causes re-render loops
            });
            
            inner.addEventListener('mouseleave', () => {
              inner.style.transform = 'scale(1)';
              if (isClusterPoint) {
                inner.style.boxShadow = `0 4px 16px rgba(0,0,0,0.3), 0 0 ${size/3}px rgba(148,163,184,0.2), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)`;
                inner.style.borderColor = 'rgba(148,163,184,0.4)';
                inner.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(148,163,184,0.08) 100%)';
              } else {
                inner.style.boxShadow = `0 3px 12px rgba(0,0,0,0.35), 0 0 ${size * 1.8}px ${color}70, inset 0 1px 0 rgba(255,255,255,0.2)`;
                inner.style.borderWidth = '2.5px';
              }
            });
            
            // Click handler
            inner.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              console.log('[Globe] Click on:', isClusterPoint ? 'cluster' : 'node', d.id);
              if (isClusterPoint) {
                handleClusterClick(cluster as ClusterFeature);
              } else {
                handleNodeClick(cluster as NodeFeature);
              }
            });
            
            el.appendChild(inner);
            return el;
          }}
          htmlLat={(d: any) => d.lat}
          htmlLng={(d: any) => d.lng}
          htmlAltitude={0.01}
          
          // Globe events
          onGlobeReady={handleGlobeReady}
          onZoom={handleZoom}
          
          // Performance optimization - disable unnecessary animations
          animateIn={false}
          rendererConfig={{
            antialias: false, // Disable for better FPS
            powerPreference: 'high-performance'
          }}
        />
      </div>
      
      {/* Zoom Controls */}
      <Map3DControlsEnhanced
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        viewLevel={
          clusterState.currentZoom <= 5 ? 'global' 
          : clusterState.currentZoom <= 12 ? 'regional' 
          : 'node'
        }
        viewContext={getViewLevelLabel()}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* View Level Indicator */}
      <div
        className="absolute bottom-4 left-4 z-[10000] px-4 py-2 rounded-xl backdrop-blur-xl border"
        style={{
          background: `${mapTheme.ui.card}dd`,
          borderColor: mapTheme.ui.cardBorder,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium" style={{ color: mapTheme.ui.text }}>
            {getViewLevelLabel()} View
          </div>
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: mapTheme.ui.accent + '20', color: mapTheme.ui.accent }}>
            Zoom {clusterState.currentZoom}
          </div>
          {clusterState.spiderfiedNodes.length > 0 && (
            <div className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: '#3B82F620', color: '#3B82F6' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="1.5"/>
                <circle cx="6" cy="2" r="0.8"/>
                <circle cx="10" cy="6" r="0.8"/>
                <circle cx="6" cy="10" r="0.8"/>
                <circle cx="2" cy="6" r="0.8"/>
                <line x1="6" y1="6" x2="6" y2="2" stroke="currentColor" strokeWidth="0.5"/>
                <line x1="6" y1="6" x2="10" y2="6" stroke="currentColor" strokeWidth="0.5"/>
                <line x1="6" y1="6" x2="6" y2="10" stroke="currentColor" strokeWidth="0.5"/>
                <line x1="6" y1="6" x2="2" y2="6" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
              Spider Mode ({clusterState.spiderfiedNodes.length})
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div
        className="absolute bottom-4 left-40 z-[10000] px-4 py-3 rounded-xl backdrop-blur-xl border"
        style={{
          background: `${mapTheme.ui.card}dd`,
          borderColor: mapTheme.ui.cardBorder,
        }}
      >
        <div className="text-xs font-bold mb-2" style={{ color: mapTheme.ui.accent }}>
          NODE HEALTH
        </div>
        <div className="flex items-center gap-4">
          {[
            { label: 'Excellent', color: statusColors?.excellent },
            { label: 'Good', color: statusColors?.good },
            { label: 'Warning', color: statusColors?.warning },
            { label: 'Critical', color: statusColors?.critical },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
              <span className="text-[10px]" style={{ color: mapTheme.ui.textSecondary }}>
                {item.label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hover Tooltip - Disabled to prevent render loops */}
      {/* 
      <AnimatePresence>
        {hoveredCluster && (
          <motion.div
            className="absolute z-[10001] pointer-events-none"
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -120%)' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <ClusterTooltip
              cluster={hoveredCluster}
              color={mapTheme.ui.accent}
            />
          </motion.div>
        )}
      </AnimatePresence>
      */}
      
      {/* Selected Node Panel */}
      <AnimatePresence>
        {clusterState.selectedNode && (
          <motion.div
            className="absolute top-24 right-6 z-[10001] w-80"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div
              className="rounded-2xl border overflow-hidden backdrop-blur-xl"
              style={{
                background: `linear-gradient(135deg, ${mapTheme.ui.card}ee 0%, ${mapTheme.ui.card}dd 100%)`,
                borderColor: getNodeColorByHealth(clusterState.selectedNode.health, mapTheme) + '40',
                boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${getNodeColorByHealth(clusterState.selectedNode.health, mapTheme)}20`,
              }}
            >
              {/* Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: mapTheme.ui.cardBorder }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse flex-shrink-0"
                    style={{
                      background: getNodeColorByHealth(clusterState.selectedNode.health, mapTheme),
                      boxShadow: `0 0 12px ${getNodeColorByHealth(clusterState.selectedNode.health, mapTheme)}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold" style={{ color: mapTheme.ui.accent }}>
                      {clusterState.selectedNode.ip}
                    </div>
                    <div className="text-xs" style={{ color: mapTheme.ui.textSecondary }}>
                      {getFlagEmoji(clusterState.selectedNode.country_code)} {clusterState.selectedNode.city}, {clusterState.selectedNode.country}
                    </div>
                    {clusterState.selectedNode.pubkey && (
                      <div 
                        className="text-[10px] font-mono mt-1 truncate" 
                        style={{ color: mapTheme.ui.textSecondary }}
                        title={clusterState.selectedNode.pubkey}
                      >
                        🔑 {clusterState.selectedNode.pubkey.slice(0, 12)}...{clusterState.selectedNode.pubkey.slice(-8)}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => clusterActions.selectNode(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
                  style={{ color: mapTheme.ui.textSecondary }}
                >
                  ✕
                </button>
              </div>
              
              {/* Stats */}
              <div className="p-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Health', value: `${clusterState.selectedNode.health.toFixed(0)}%`, color: getNodeColorByHealth(clusterState.selectedNode.health, mapTheme) },
                  { label: 'Uptime', value: `${clusterState.selectedNode.uptime.toFixed(1)}h`, color: mapTheme.ui.text },
                  { label: 'Version', value: clusterState.selectedNode.version || 'N/A', color: mapTheme.ui.text },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: mapTheme.ui.textSecondary }}>
                      {stat.label}
                    </div>
                    <div className="text-lg font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => router.push(`/pnode/${clusterState.selectedNode!.ip}`)}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${mapTheme.ui.accent} 0%, ${mapTheme.ui.accent}CC 100%)`,
                    color: '#000',
                    boxShadow: `0 4px 20px ${mapTheme.ui.accent}40`,
                  }}
                >
                  View Full Details →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Performance Stats (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="absolute bottom-4 right-4 z-[10000] px-3 py-2 rounded-lg text-[10px] font-mono"
          style={{
            background: `${mapTheme.ui.card}cc`,
            color: mapTheme.ui.textSecondary,
          }}
        >
          <div>Clusters: {clusterState.visibleClusters}</div>
          <div>Zoom: {clusterState.currentZoom}</div>
          <div>Alt: {clusterState.currentAltitude.toFixed(3)}</div>
          <div>Update: {clusterState.lastUpdateMs.toFixed(2)}ms</div>
        </div>
      )}
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 20px currentColor; }
          50% { box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 40px currentColor; }
        }
      `}</style>
    </div>
  );
}

export default Map3DViewerPremium;
