'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from '@/hooks/useTheme';
import { getMapTheme, getNodeColorByHealth, formatNodeTooltip, getStatusColors } from '@/lib/map-theme';
import { filterNodes } from '@/lib/map-3d-utils';
import { Map3DSidebar } from './Map3DSidebar';
import type { Node3DData, Globe3DMode, Globe3DFilter } from '@/lib/types-3d';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--accent-aqua)', borderTopColor: 'transparent' }} />
        <div style={{ color: 'var(--text-main)' }} className="font-medium">Loading 3D Globe...</div>
      </div>
    </div>
  ),
});

type GlobeViewerProps = {
  nodes: Node3DData[];
  onClose: () => void;
};

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  node: Node3DData;
  altitude: number;
}


export function GlobeViewer({ nodes, onClose }: GlobeViewerProps) {
  const router = useRouter();
  const { theme, mounted: themeMounted } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const globeEl = useRef<any>(null);

  // State
  const [mode, setMode] = useState<Globe3DMode>('free');
  const [showArcs, setShowArcs] = useState(false);
  const [filter, setFilter] = useState<Globe3DFilter>({
    health: 'all',
    network: 'all',
    activeOnly: false,
  });
  const [visualSettings, setVisualSettings] = useState({
    showHeight: false,
    showGlow: false,
    showLabels: false,
  });

  useEffect(() => {
    setIsClient(true);
    // No need to fetch countries - using globe texture with built-in borders
  }, []);

  // Get theme colors
  const mapTheme = useMemo(() => {
    if (!themeMounted) return null;
    return getMapTheme(theme);
  }, [theme, themeMounted]);

  // Get status colors dynamically
  const statusColors = useMemo(() => {
    if (!themeMounted) return null;
    return getStatusColors(theme);
  }, [theme, themeMounted]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    return filterNodes(nodes, filter);
  }, [nodes, filter]);

  // Calculate stats
  const stats = useMemo(() => {
    const healthyNodes = filteredNodes.filter(n => n.health >= 70).length;
    const warningNodes = filteredNodes.filter(n => n.health >= 40 && n.health < 70).length;
    const criticalNodes = filteredNodes.filter(n => n.health < 40).length;
    const avgHealth = filteredNodes.reduce((sum, n) => sum + n.health, 0) / filteredNodes.length;
    const totalStorage = filteredNodes.reduce((sum, n) => sum + n.storage, 0);
    const activeStreams = filteredNodes.filter(n => n.hasActiveStreams).length;

    return {
      totalNodes: filteredNodes.length,
      healthyNodes,
      warningNodes,
      criticalNodes,
      avgHealth: avgHealth || 0,
      totalStorage,
      activeStreams,
    };
  }, [filteredNodes]);

  // Handle node search
  const handleSearch = useCallback((query: string) => {
    const node = nodes.find(n => n.ip.includes(query));
    if (node && globeEl.current) {
      globeEl.current.pointOfView({
        lat: node.lat,
        lng: node.lng,
        altitude: 1.5,
      }, 1000);
      setMode('focused');
    }
  }, [nodes]);

  // Prepare points data - Simple fixed points
  const points = useMemo(() => {
    if (!mapTheme) return [];

    return filteredNodes.map((node) => {
      const color = getNodeColorByHealth(node.health, mapTheme);

      return {
        lat: node.lat,
        lng: node.lng,
        size: 0.5,
        color: color,
        node: node,
        altitude: 0.01,
      } as GlobePoint;
    });
  }, [filteredNodes, mapTheme]);

  // Handle point click - Navigate to node page
  const handlePointClick = useCallback((point: any) => {
    if (point.node) {
      router.push(`/pnode/${encodeURIComponent(point.node.ip)}`);
    }
  }, [router]);

  // Auto-rotate for cinematic mode
  useEffect(() => {
    if (mode === 'cinematic' && globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
    } else if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = false;
    }
  }, [mode]);

  if (!isClient || !themeMounted || !mapTheme || !statusColors) {
    return (
      <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-aqua)', borderTopColor: 'transparent' }} />
          <div style={{ color: 'var(--text-main)' }} className="font-medium">Initializing 3D Globe...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{
      background: mapTheme.background,
    }}>
      {/* Switch to 2D button - top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[10001] px-4 py-2 rounded-lg border text-xs font-semibold transition-all hover:scale-105 backdrop-blur-sm"
        style={{
          background: mapTheme.ui.card,
          borderColor: mapTheme.ui.cardBorder,
          color: mapTheme.ui.accent,
        }}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>SWITCH TO 2D</span>
        </span>
      </button>

      {/* Title Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10001] px-4 py-2 rounded-xl border backdrop-blur-sm pointer-events-none"
        style={{
          background: mapTheme.ui.card,
          borderColor: mapTheme.ui.cardBorder,
        }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: mapTheme.ui.accent }} />
          <span className="text-sm font-semibold" style={{ color: mapTheme.ui.text }}>
            3D Network Globe
          </span>
          <span className="text-xs" style={{ color: mapTheme.ui.textSecondary }}>
            • {stats.totalNodes} nodes visualized
          </span>
        </div>
      </div>

      {/* Sidebar Controls */}
      <Map3DSidebar
        mode={mode}
        onModeChange={setMode}
        filter={filter}
        onFilterChange={setFilter}
        showArcs={showArcs}
        onToggleArcs={() => setShowArcs(!showArcs)}
        onSearch={handleSearch}
        stats={stats}
        visualSettings={visualSettings}
        onVisualSettingsChange={setVisualSettings}
      />

      {/* Globe */}
      <div className="w-full h-full">
        <Globe
          {...{
            ref: globeEl,
            width: typeof window !== 'undefined' ? window.innerWidth : 1920,
            height: typeof window !== 'undefined' ? window.innerHeight : 1080,

            // Globe appearance - Clean with star background
            backgroundImageUrl: '//unpkg.com/three-globe/example/img/night-sky.png',
            globeImageUrl: 'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
            showAtmosphere: false,

            // No separate polygons - texture already has country borders
            polygonsData: [],

            // Points (nodes) - Simple fixed points
            pointsData: points,
            pointColor: "color",
            pointRadius: "size",
            pointAltitude: 0.01,
            pointLabel: () => '', // No tooltips
            onPointClick: handlePointClick,
            pointResolution: 4,
            pointsMerge: false,
            enablePointerInteraction: true,

            // Camera & controls
            onGlobeReady: () => {
              if (globeEl.current) {
                globeEl.current.pointOfView({
                  lat: 20,
                  lng: 0,
                  altitude: 2.5
                });

                const controls = globeEl.current.controls();
                controls.enableDamping = true;
                controls.dampingFactor = 0.1;
                controls.rotateSpeed = 0.5;
                controls.minDistance = 101;
                controls.maxDistance = 2000;
                controls.autoRotate = false;
              }
            },
          }}
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-[10001] px-4 py-3 rounded border text-[10px] font-mono pointer-events-none"
        style={{
          background: mapTheme.ui.card,
          borderColor: mapTheme.ui.cardBorder,
          color: mapTheme.ui.textSecondary,
        }}>
        <div className="mb-2 font-bold" style={{ color: mapTheme.ui.accent }}>
          NODE HEALTH
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors.excellent }}></span>
            EXCELLENT
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors.good }}></span>
            GOOD
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors.warning }}></span>
            WARNING
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors.critical }}></span>
            CRITICAL
          </div>
        </div>
        <div className="mt-3 pt-2 border-t text-[9px]" style={{
          borderColor: mapTheme.ui.cardBorder,
          color: mapTheme.ui.textSecondary,
        }}>
          {nodes.length} nodes • Click nodes for details
        </div>
      </div>
    </div>
  );
}
