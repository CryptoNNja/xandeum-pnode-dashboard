'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapGL, Marker, MapRef, Layer, Source } from 'react-map-gl/maplibre';
import type { Node3DData } from '@/lib/types-3d';
import { X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useNodeClustering } from './hooks/useNodeClustering';
import { NodePopup } from './NodePopup';

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


  // Custom style matching our 2D map
  const mapStyle = useMemo(() => ({
    version: 8,
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      'countries': {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'
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
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': isLight ? '#FFF8E8' : '#0D1117',
          'fill-opacity': 1
        }
      },
      {
        id: 'countries-outline',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': isLight ? '#EA580C' : '#00D4AA',
          'line-width': isLight ? 1.5 : 0.8,
          'line-opacity': isLight ? 0.8 : 0.5
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
      {/* Premium popup styles - Black/Green theme + Connection line animation */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
        .animate-dash {
          animation: dash 0.5s linear infinite;
        }
        @keyframes bubbleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
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

      {/* Title with Dev Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 rounded-xl bg-gray-900/90 border border-gray-700 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">
              3D Network Globe
            </span>
          </div>
          <div className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ 
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#000',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
          }}>
            In Development
          </div>
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

        {/* Custom Popup with connection line */}
        {selectedNode && (
          <NodePopup
            node={selectedNode}
            mapRef={mapRef}
            onClose={() => setSelectedNode(null)}
            onNavigate={navigateToNode}
            getNodeColor={getNodeColor}
          />
        )}
      </MapGL>
    </div>
  );
}
