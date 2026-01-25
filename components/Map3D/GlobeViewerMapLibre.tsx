'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapGL, Marker, Popup, MapRef, Layer, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Node3DData } from '@/lib/types-3d';
import { X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useNodeClustering } from './hooks/useNodeClustering';

interface GlobeViewerMapLibreProps {
  nodes: Node3DData[];
  onClose: () => void;
}

export function GlobeViewerMapLibre({ nodes, onClose }: GlobeViewerMapLibreProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 15,
    zoom: 1.8,
    pitch: 0,
    bearing: 0,
  });
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Apply intelligent clustering
  const { clusteredNodes, connectionLines, totalClusters } = useNodeClustering(nodes, viewState.zoom);


  // Custom style with our colors AND labels
  const mapStyle = useMemo(() => ({
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'openmaptiles': {
        type: 'vector',
        tiles: ['https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=get_your_own_OpIi9ZULNHzrESv6T2vL'],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': isLight ? '#FEF3E2' : '#0A0E1A'
        }
      },
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: {
          'fill-color': isLight ? '#B8D4E8' : '#0A1929'
        }
      },
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        paint: {
          'fill-color': isLight ? '#FEF3E2' : '#000000',
          'fill-opacity': isLight ? 0.6 : 0.3
        }
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        paint: {
          'fill-color': isLight ? '#FEF3E2' : '#000000',
          'fill-opacity': isLight ? 0.6 : 0.3
        }
      },
      {
        id: 'boundary-country',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['==', ['get', 'admin_level'], 2],
        paint: {
          'line-color': isLight ? '#EA580C' : '#00D4AA',
          'line-width': isLight ? 1.5 : 0.8,
          'line-opacity': isLight ? 0.8 : 0.5
        }
      },
      {
        id: 'place-country',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['==', ['get', 'class'], 'country'],
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            1, 10,
            4, 16
          ],
          'text-rotation-alignment': 'viewport',
          'text-pitch-alignment': 'viewport'
        },
        paint: {
          'text-color': isLight ? '#1F2937' : '#FFFFFF',
          'text-halo-color': isLight ? '#FFFFFF' : '#000000',
          'text-halo-width': 1.5
        }
      },
      {
        id: 'place-city',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0,
            5, 11,
            8, 15,
            12, 18
          ],
          'text-rotation-alignment': 'viewport',
          'text-pitch-alignment': 'viewport'
        },
        paint: {
          'text-color': isLight ? '#1F2937' : '#E0E0E0',
          'text-halo-color': isLight ? '#FFFFFF' : '#000000',
          'text-halo-width': 1.2
        }
      },
      {
        id: 'place-village',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['village', 'hamlet', 'suburb', 'neighbourhood']]],
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0,
            10, 9,
            12, 12,
            15, 14
          ],
          'text-rotation-alignment': 'viewport',
          'text-pitch-alignment': 'viewport'
        },
        paint: {
          'text-color': isLight ? '#374151' : '#9CA3AF',
          'text-halo-color': isLight ? '#FFFFFF' : '#000000',
          'text-halo-width': 1
        }
      },
      {
        id: 'road-labels',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 12,
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'street']]],
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12, 8,
            14, 10,
            16, 11
          ],
          'symbol-placement': 'line',
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport'
        },
        paint: {
          'text-color': isLight ? '#6B7280' : '#6B7280',
          'text-halo-color': isLight ? '#FFFFFF' : '#000000',
          'text-halo-width': 1.5
        }
      },
      {
        id: 'poi-labels',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'poi',
        minzoom: 14,
        layout: {
          'text-field': ['get', 'name:en'],
          'text-font': ['Noto Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            14, 9,
            16, 11,
            18, 13
          ],
          'text-anchor': 'top',
          'text-offset': [0, 0.5],
          'text-rotation-alignment': 'viewport',
          'text-pitch-alignment': 'viewport'
        },
        paint: {
          'text-color': isLight ? '#4B5563' : '#A0A0A0',
          'text-halo-color': isLight ? '#FFFFFF' : '#000000',
          'text-halo-width': 1.2
        }
      }
    ]
  }), [isLight]);

  // Auto-rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setViewState((prev) => ({
        ...prev,
        longitude: (prev.longitude + 0.2) % 360,
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Health color mapping
  const getNodeColor = (health: number) => {
    if (health >= 80) return '#10B981'; // Excellent - green
    if (health >= 60) return '#3B82F6'; // Good - blue
    if (health >= 40) return '#F59E0B'; // Warning - orange
    return '#EF4444'; // Critical - red
  };

  // Node click handler - show popup with smooth zoom
  const handleNodeClick = useCallback((node: any, e: any) => {
    e.originalEvent.stopPropagation();
    setSelectedNode(node);
    
    // Smooth auto-zoom to node
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Calculate optimal zoom based on current zoom
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom < 8 ? 10 : Math.min(currentZoom + 2, 14);
      
      // Use display coordinates if available (from clustering), otherwise use original
      const lng = node.displayLng ?? node.lng;
      const lat = node.displayLat ?? node.lat;
      
      map.flyTo({
        center: [lng, lat],
        zoom: targetZoom,
        duration: 1500,
        essential: true,
        easing: (t) => t * (2 - t), // Ease out quad
      });
    }
  }, []);

  // Navigate to node detail page
  const navigateToNode = useCallback((ip: string) => {
    router.push(`/pnode/${ip}`);
  }, [router]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Premium popup styles - Black/Green theme */}
      <style>{`
        .node-popup-premium .maplibregl-popup-content {
          background: #0A0E1A !important;
          border: 1px solid #00D4AA !important;
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 8px 32px rgba(0, 212, 170, 0.2), 0 0 20px rgba(0, 212, 170, 0.1) !important;
          backdrop-filter: blur(10px) !important;
        }
        .node-popup-premium .maplibregl-popup-close-button {
          color: #6B7280 !important;
          font-size: 24px !important;
          padding: 8px 12px !important;
          right: 4px !important;
          top: 4px !important;
          transition: all 0.2s !important;
        }
        .node-popup-premium .maplibregl-popup-close-button:hover {
          background: rgba(0, 212, 170, 0.1) !important;
          color: #00D4AA !important;
          transform: rotate(90deg) !important;
        }
        .node-popup-premium .maplibregl-popup-tip {
          border-top-color: #0A0E1A !important;
          border-width: 12px !important;
        }
        
        /* Smooth entrance animation */
        .node-popup-premium .maplibregl-popup-content {
          animation: popupSlideIn 0.3s ease-out !important;
        }
        
        @keyframes popupSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10001] px-4 py-2 rounded-lg bg-gray-900/90 border border-gray-700 text-white text-xs font-semibold hover:bg-gray-800 transition-all backdrop-blur-sm flex items-center gap-2"
      >
        <X className="w-4 h-4" />
        CLOSE
      </button>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-sm font-semibold text-white">
            3D Network Globe
          </span>
          <span className="text-xs text-gray-400">
            • {nodes.length} nodes
            {totalClusters > 0 && ` • ${totalClusters} clusters`}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[10001] px-4 py-3 rounded-lg bg-gray-900/90 border border-gray-700 text-xs backdrop-blur-sm">
        <div className="mb-2 font-bold text-cyan-400">NODE HEALTH</div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span className="text-gray-300">EXCELLENT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]"></span>
            <span className="text-gray-300">GOOD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
            <span className="text-gray-300">WARNING</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EF4444]"></span>
            <span className="text-gray-300">CRITICAL</span>
          </div>
        </div>
      </div>

      {/* MapLibre GL with Globe projection */}
      <MapGL
        ref={mapRef}
        initialViewState={viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle as any}
        projection="globe"
        attributionControl={false}
        dragRotate={true}
        touchZoomRotate={true}
        reuseMaps={true}
        maxZoom={18}
      >
        {/* Cluster connection lines - thin threads connecting nodes in same cluster */}
        {connectionLines.length > 0 && (
          <Source
            id="cluster-connections"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: connectionLines.map((line, idx) => ({
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [[line[3], line[2]], [line[1], line[0]]],
                },
                properties: { id: idx },
              })),
            }}
          >
            <Layer
              id="cluster-connection-lines"
              type="line"
              paint={{
                'line-color': isLight ? 'rgba(234, 88, 12, 0.3)' : 'rgba(0, 212, 170, 0.3)',
                'line-width': 1,
                'line-opacity': 0.6,
              }}
            />
          </Source>
        )}

        {/* Clustered node markers with spreading */}
        {clusteredNodes.map((node) => {
          // Adjust marker size based on zoom and cluster
          const baseSize = viewState.zoom > 5 ? 4 : 3;
          const size = node.clusterSize > 1 ? baseSize * 0.9 : baseSize;
          
          return (
            <Marker
              key={`${node.ip}-${node.clusterIndex}`}
              longitude={node.displayLng}
              latitude={node.displayLat}
              anchor="center"
              onClick={(e) => handleNodeClick(node, e)}
            >
              <div
                className="rounded-full cursor-pointer hover:scale-150 transition-all duration-200"
                style={{
                  width: `${size * 4}px`,
                  height: `${size * 4}px`,
                  backgroundColor: getNodeColor(node.health),
                  boxShadow: `0 0 ${size * 3}px ${getNodeColor(node.health)}`,
                  opacity: node.clusterSize > 1 ? 0.85 : 1,
                }}
              />
            </Marker>
          );
        })}

        {/* Premium Popup for selected node */}
        {selectedNode && (
          <Popup
            longitude={selectedNode.displayLng || selectedNode.lng}
            latitude={selectedNode.displayLat || selectedNode.lat}
            anchor="bottom"
            onClose={() => setSelectedNode(null)}
            closeButton={true}
            closeOnClick={false}
            offset={15}
            className="node-popup-premium"
          >
            <div className="p-4 min-w-[320px]" style={{ background: '#0A0E1A' }}>
              {/* Header with health gradient bar */}
              <div className="mb-3">
                {/* Health indicator bar */}
                <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: '#1A1F2E' }}>
                  <div 
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${selectedNode.health}%`,
                      background: `linear-gradient(90deg, ${getNodeColor(selectedNode.health)}, #00D4AA)`,
                      boxShadow: `0 0 8px ${getNodeColor(selectedNode.health)}`,
                    }}
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{
                          backgroundColor: '#00D4AA',
                          boxShadow: '0 0 10px #00D4AA',
                        }}
                      />
                      <div className="font-mono text-base font-bold" style={{ color: '#00D4AA' }}>
                        {selectedNode.ip}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                      <span>{selectedNode.city}</span>
                      <span>•</span>
                      <span>{selectedNode.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: '#6B7280' }}>Health</div>
                    <div className="text-xl font-bold" style={{ color: '#00D4AA' }}>
                      {selectedNode.health.toFixed(0)}
                      <span className="text-xs" style={{ color: '#6B7280' }}>%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Storage */}
                <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                    Storage
                  </div>
                  <div className="font-bold" style={{ color: selectedNode.storage > 0 ? '#00D4AA' : '#6B7280' }}>
                    {selectedNode.storage > 0 
                      ? `${(selectedNode.storage / 1024 / 1024 / 1024).toFixed(1)} GB`
                      : 'N/A'}
                  </div>
                </div>

                {/* Uptime */}
                <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                    Uptime
                  </div>
                  <div className="font-bold" style={{ color: selectedNode.uptime > 0 ? '#00D4AA' : '#6B7280' }}>
                    {selectedNode.uptime > 0 
                      ? selectedNode.uptime >= 86400 
                        ? `${Math.floor(selectedNode.uptime / 86400)}d ${Math.floor((selectedNode.uptime % 86400) / 3600)}h`
                        : `${Math.floor(selectedNode.uptime / 3600)}h`
                      : 'N/A'}
                  </div>
                </div>

                {/* CPU */}
                <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                    CPU Usage
                  </div>
                  <div className="font-bold" style={{ color: selectedNode.cpu > 0 ? '#00D4AA' : '#6B7280' }}>
                    {selectedNode.cpu > 0 ? `${selectedNode.cpu.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>

                {/* RAM */}
                <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                    RAM Usage
                  </div>
                  <div className="font-bold" style={{ color: selectedNode.ram > 0 ? '#00D4AA' : '#6B7280' }}>
                    {selectedNode.ram > 0 ? `${selectedNode.ram.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2 mb-3 p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#6B7280' }}>Version</span>
                  <span className="font-mono" style={{ color: '#9CA3AF' }}>{selectedNode.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#6B7280' }}>Type</span>
                  <span className="font-semibold" style={{ color: selectedNode.isPublic ? '#00D4AA' : '#6B7280' }}>
                    {selectedNode.isPublic ? 'PUBLIC' : 'PRIVATE'}
                  </span>
                </div>
                {selectedNode.hasActiveStreams && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span style={{ color: '#10B981' }}>Active Streams</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              <button
                onClick={() => navigateToNode(selectedNode.ip)}
                className="w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-[1.02]"
                style={{ 
                  background: 'linear-gradient(135deg, #00D4AA 0%, #00A389 100%)',
                  color: '#0A0E1A',
                  boxShadow: '0 4px 12px rgba(0, 212, 170, 0.3)',
                }}
              >
                View Full Details →
              </button>
            </div>
          </Popup>
        )}
      </MapGL>
    </div>
  );
}
