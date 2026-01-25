import { useMemo } from 'react';
import type { Node3DData } from '@/lib/types-3d';

interface ClusteredNode extends Node3DData {
  displayLat: number;
  displayLng: number;
  clusterKey: string;
  clusterSize: number;
  clusterIndex: number;
}

interface ClusterGroup {
  key: string;
  nodes: Node3DData[];
  centerLat: number;
  centerLng: number;
}

/**
 * Smart clustering hook that spreads co-located nodes in a circular pattern
 * Based on competitor's approach but enhanced with better spacing and animations
 */
export function useNodeClustering(nodes: Node3DData[], zoom: number) {
  return useMemo(() => {
    // Group nodes by approximate location (precision ~100m)
    const locationGroups = new Map<string, Node3DData[]>();
    
    nodes.forEach(node => {
      // Round coordinates to 0.001° precision (~111m at equator)
      const key = `${node.lat.toFixed(3)},${node.lng.toFixed(3)}`;
      
      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(node);
    });

    // Calculate optimal offset based on zoom level
    // Higher zoom = smaller offsets (nodes spread less)
    const getOffsetRadius = (clusterSize: number, zoom: number): number => {
      const baseRadius = 0.005; // ~550m at equator (increased from 0.002)
      const zoomFactor = Math.max(0.2, 1 / (zoom + 1)); // Smaller at high zoom
      
      // Progressive scaling: bigger clusters spread much more
      let sizeFactor;
      if (clusterSize <= 3) {
        sizeFactor = 1.0;
      } else if (clusterSize <= 10) {
        sizeFactor = 1.5 + (clusterSize - 3) * 0.2; // 1.5 to 2.9
      } else {
        sizeFactor = 3.0 + (clusterSize - 10) * 0.15; // 3.0+
      }
      
      return baseRadius * zoomFactor * sizeFactor;
    };

    // Create clustered nodes with circular offsets
    const clusteredNodes: ClusteredNode[] = [];
    const clusterGroups: ClusterGroup[] = [];
    const connectionLines: [number, number, number, number][] = []; // [lat1, lng1, lat2, lng2]

    locationGroups.forEach((groupNodes, key) => {
      const [lat, lng] = key.split(',').map(Number);
      const clusterSize = groupNodes.length;

      // Store cluster info
      clusterGroups.push({
        key,
        nodes: groupNodes,
        centerLat: lat,
        centerLng: lng,
      });

      if (clusterSize === 1) {
        // Single node - no offset needed
        clusteredNodes.push({
          ...groupNodes[0],
          displayLat: groupNodes[0].lat,
          displayLng: groupNodes[0].lng,
          clusterKey: key,
          clusterSize: 1,
          clusterIndex: 0,
        });
      } else {
        // Multiple nodes - spread in circle
        const radius = getOffsetRadius(clusterSize, zoom);
        
        groupNodes.forEach((node, index) => {
          // Circular distribution
          const angle = (index / clusterSize) * 2 * Math.PI;
          const offsetLat = Math.cos(angle) * radius;
          const offsetLng = Math.sin(angle) * radius;

          const displayLat = lat + offsetLat;
          const displayLng = lng + offsetLng;

          clusteredNodes.push({
            ...node,
            displayLat,
            displayLng,
            clusterKey: key,
            clusterSize,
            clusterIndex: index,
          });

          // Add connection line from center to node (for visual effect)
          if (zoom > 6) { // Only show connection lines when zoomed in
            connectionLines.push([lat, lng, displayLat, displayLng]);
          }
        });
      }
    });

    return {
      clusteredNodes,
      clusterGroups,
      connectionLines,
      totalClusters: clusterGroups.filter(g => g.nodes.length > 1).length,
    };
  }, [nodes, zoom]);
}
