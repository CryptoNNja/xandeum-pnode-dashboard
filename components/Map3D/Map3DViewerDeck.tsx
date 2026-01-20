'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { ScatterplotLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { GeoJsonLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/hooks/useTheme';
import { getMapTheme, getNodeColorByHealth } from '@/lib/map-theme';
import { pnodeToNode3D, filterNodes, getFlagEmoji } from '@/lib/map-3d-utils';
import { useAdaptiveClustering, isCluster } from '@/hooks/useAdaptiveClustering';
import type { PNode } from '@/lib/types';
import type { Globe3DFilter, Node3DData } from '@/lib/types-3d';
import type { ClusterFeature, NodeFeature } from '@/lib/types-clustering';

interface Map3DViewerDeckProps {
  allNodes: PNode[];
  onClose: () => void;
}

export function Map3DViewerDeck({ allNodes, onClose }: Map3DViewerDeckProps) {
  const router = useRouter();
  const { theme: appTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // State - Globe projection needs specific zoom levels
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 0, // For GlobeView, zoom 0 = see whole earth
    minZoom: -2,
    maxZoom: 10,
  });
  
  const [hoveredNode, setHoveredNode] = useState<Node3DData | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [filter] = useState<Globe3DFilter>({
    health: 'all',
    network: 'all',
    activeOnly: false,
  });

  useEffect(() => {
    setIsClient(true);
    setThemeMounted(true);
    
    // Auto-rotate globe on mount
    const interval = setInterval(() => {
      setViewState(prev => ({
        ...prev,
        longitude: (prev.longitude + 0.2) % 360,
      }));
    }, 50);
    
    // Stop auto-rotate after 5 seconds
    const timeout = setTimeout(() => clearInterval(interval), 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const mapTheme = useMemo(() => {
    if (!themeMounted) return null;
    return getMapTheme(appTheme);
  }, [appTheme, themeMounted]);

  // Convert PNodes to 3D data
  const nodes3D = useMemo(() => {
    return allNodes.map(pnodeToNode3D).filter((node): node is Node3DData => node !== null);
  }, [allNodes]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    return filterNodes(nodes3D, filter);
  }, [nodes3D, filter]);
  
  // Initialize clustering
  const clusterConfig = useMemo(() => ({
    debounceMs: 100,
    prefetchAdjacent: false,
    clusterRadius: 40,
    maxZoom: 16,
    enableSpiderfying: false, // Disable for Deck.gl (we'll use native expansion)
    spiderfyZoomThreshold: 15,
    spiderfyDistance: 0.01,
  }), []);
  
  const [clusterState, clusterActions] = useAdaptiveClustering([], clusterConfig);
  
  // Load nodes into cluster index
  useEffect(() => {
    if (filteredNodes.length > 0) {
      clusterActions.loadNodes(filteredNodes);
    }
  }, [filteredNodes]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Update cluster center when view changes
  useEffect(() => {
    clusterActions.setCenter(viewState.latitude, viewState.longitude);
  }, [viewState.latitude, viewState.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prepare points data from clusters
  const pointsData = useMemo(() => {
    if (!mapTheme || !clusterState.isReady) return [];
    
    return clusterState.clusters.map((cluster) => {
      const [lng, lat] = cluster.geometry.coordinates;
      const isClusterPoint = isCluster(cluster);
      
      if (isClusterPoint) {
        // Cluster marker - gray
        const count = cluster.properties.point_count;
        return {
          position: [lng, lat, 0],
          color: [148, 163, 184, 200], // Gray
          radius: Math.min(50000 + count * 5000, 500000),
          node: null,
          cluster: cluster,
          isCluster: true,
          count,
        };
      } else {
        // Individual node - health color
        const node = (cluster as NodeFeature).properties.node;
        const colorHex = getNodeColorByHealth(node.health, mapTheme);
        const colorRgb = colorHex
          .replace('#', '')
          .match(/.{2}/g)
          ?.map(hex => parseInt(hex, 16)) || [255, 255, 255];
        
        return {
          position: [lng, lat, 0],
          color: [...colorRgb, 200],
          radius: 100000,
          node: node,
          cluster: null,
          isCluster: false,
          count: 1,
        };
      }
    });
  }, [clusterState.clusters, clusterState.isReady, mapTheme]);

  // Load country boundaries for continents
  const [countriesData, setCountriesData] = useState<any>(null);
  
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountriesData)
      .catch(err => console.error('Failed to load countries:', err));
  }, []);

  // Handle point click
  const handleClick = useCallback((info: PickingInfo) => {
    if (!info.object) return;
    
    const obj = info.object as any;
    
    if (obj.isCluster && obj.cluster) {
      // Cluster clicked - expand it
      const cluster = obj.cluster as ClusterFeature;
      const expansion = clusterActions.expandCluster(cluster);
      const [lng, lat] = expansion.center;
      
      console.log('[Deck.gl] Cluster clicked, expanding to zoom:', expansion.targetZoom);
      
      setViewState({
        ...viewState,
        longitude: lng,
        latitude: lat,
        zoom: Math.min(expansion.targetZoom / 2, 10), // Deck.gl uses different zoom scale
      });
    } else if (obj.node) {
      // Individual node clicked
      const node = obj.node;
      setSelectedNode(node);
      
      setViewState({
        ...viewState,
        longitude: node.lng,
        latitude: node.lat,
        zoom: 8,
      });
    }
  }, [viewState, clusterActions]);

  // Layers
  const layers = useMemo(() => {
    if (!mapTheme || !countriesData) return [];
    
    return [
      // Ocean background (solid blue)
      new SolidPolygonLayer({
        id: 'ocean',
        data: [{
          polygon: [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90]
          ]
        }],
        getPolygon: (d: any) => d.polygon,
        getFillColor: [15, 23, 42, 255], // Dark blue ocean
        pickable: false,
      }),
      
      // Countries polygons
      new GeoJsonLayer({
        id: 'countries',
        data: countriesData,
        filled: true,
        stroked: true,
        getFillColor: [30, 41, 59, 255] as any, // Slate continents (not transparent)
        getLineColor: (() => {
          const rgb = mapTheme.countries.stroke
            .replace('#', '')
            .match(/.{2}/g)
            ?.map(hex => parseInt(hex, 16)) || [100, 116, 139];
          return [...rgb, 255] as [number, number, number, number];
        })() as any,
        getLineWidth: 1,
        lineWidthMinPixels: 1,
        pickable: false,
      }),
      
      // Nodes points
      new ScatterplotLayer({
        id: 'nodes',
        data: pointsData,
        pickable: true,
        opacity: 0.8,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 3,
        radiusMaxPixels: 15,
        lineWidthMinPixels: 1,
        getPosition: (d: any) => d.position,
        getRadius: (d: any) => d.radius,
        getFillColor: (d: any) => [...d.color, 200] as [number, number, number, number],
        getLineColor: [255, 255, 255, 255] as [number, number, number, number],
        onClick: handleClick,
        onHover: (info: any) => setHoveredNode(info.object?.node || null),
      }),
    ];
  }, [mapTheme, countriesData, pointsData, handleClick]);

  if (!isClient || !themeMounted || !mapTheme) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999]" style={{ background: mapTheme.background }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[10000] px-6 py-4 flex items-center justify-between border-b"
        style={{
          background: mapTheme.ui.card,
          borderColor: mapTheme.ui.cardBorder,
        }}>
        <div>
          <h2 className="text-xl font-bold" style={{ color: mapTheme.ui.text }}>
            Network Globe
          </h2>
          <p className="text-sm" style={{ color: mapTheme.ui.textSecondary }}>
            {filteredNodes.length} nodes • Interactive 3D visualization
          </p>
        </div>
        
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
          style={{
            borderColor: mapTheme.ui.cardBorder,
            color: mapTheme.ui.text,
          }}
        >
          Close
        </button>
      </div>

      {/* Main Globe - FULLSCREEN */}
      <div className="absolute inset-0 top-20" style={{ width: '100vw', height: 'calc(100vh - 80px)' }}>
        <DeckGL
          views={new GlobeView({ resolution: 10 })}
          viewState={viewState}
          onViewStateChange={({ viewState }: any) => {
            setViewState(viewState);
            // Update clustering altitude based on zoom
            const altitude = Math.max(0.02, 3 - viewState.zoom * 0.3);
            clusterActions.setAltitude(altitude);
          }}
          controller={{
            scrollZoom: true,
            dragPan: true,
            dragRotate: true,
            doubleClickZoom: true,
            touchZoom: true,
            touchRotate: true,
            keyboard: true,
            inertia: true,
          }}
          layers={layers}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Hover Tooltip */}
        {hoveredNode && !selectedNode && (
          <div 
            className="absolute pointer-events-none z-[10001]"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -100px)',
            }}
          >
            <div className="px-3 py-2 rounded-lg text-xs shadow-lg border"
              style={{
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                borderColor: getNodeColorByHealth(hoveredNode.health, mapTheme),
              }}
            >
              <div className="font-semibold mb-1 text-green-400">
                {hoveredNode.ip}
              </div>
              <div className="text-gray-300">
                {getFlagEmoji(hoveredNode.country_code)} {hoveredNode.city ? `${hoveredNode.city}, ` : ''}{hoveredNode.country || 'Unknown'}
              </div>
            </div>
          </div>
        )}

        {/* Selected Node Tooltip */}
        {selectedNode && (
          <div 
            className="absolute z-[10001]"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -150px)',
            }}
          >
            <div className="px-4 py-3 rounded-lg text-sm shadow-xl border"
              style={{
                background: 'rgba(0, 0, 0, 0.95)',
                color: 'white',
                borderColor: getNodeColorByHealth(selectedNode.health, mapTheme),
                minWidth: '250px',
              }}
            >
              <div className="font-semibold mb-2 text-green-400 text-base">
                {selectedNode.ip}
              </div>
              <div className="mb-2 text-gray-300">
                {getFlagEmoji(selectedNode.country_code)} {selectedNode.city ? `${selectedNode.city}, ` : ''}{selectedNode.country || 'Unknown'}
              </div>
              <div className="space-y-1 text-gray-400 mb-3">
                <div>💚 Health: {selectedNode.health.toFixed(0)}/100</div>
                <div>⏱️ Uptime: {selectedNode.uptime.toFixed(1)}h</div>
                {selectedNode.version && <div>📦 v{selectedNode.version}</div>}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/pnode/${selectedNode.ip}`)}
                  className="flex-1 px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 transition-colors text-white text-xs font-medium"
                >
                  View Details
                </button>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3 py-1.5 rounded border border-gray-600 hover:bg-gray-800 transition-colors text-white text-xs"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Dotted line to node */}
            <svg 
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '100%',
                transform: 'translateX(-50%)',
                width: '2px',
                height: '100px',
              }}
            >
              <line
                x1="1"
                y1="0"
                x2="1"
                y2="100"
                stroke={getNodeColorByHealth(selectedNode.health, mapTheme)}
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
