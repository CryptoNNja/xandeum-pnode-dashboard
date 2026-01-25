'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Map as MapGL, Marker, MapRef, Layer, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Node3DData } from '@/lib/types-3d';
import { X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

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
          'fill-color': isLight ? '#FEF3E2' : '#000000',
          'fill-opacity': isLight ? 0.6 : 0.3
        }
      },
      {
        id: 'countries-border',
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

  // Node click handler
  const handleNodeClick = useCallback((node: Node3DData) => {
    router.push(`/pnode/${node.ip}`);
  }, [router]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
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
        maxZoom={15}
      >
        {/* Node markers */}
        {nodes.map((node) => (
          <Marker
            key={node.ip}
            longitude={node.lng}
            latitude={node.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleNodeClick(node);
            }}
          >
            <div
              className="w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform"
              style={{
                backgroundColor: getNodeColor(node.health),
                boxShadow: `0 0 8px ${getNodeColor(node.health)}`,
              }}
            />
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}
