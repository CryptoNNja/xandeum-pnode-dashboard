'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from '@/hooks/useTheme';
import { getMapTheme, getNodeColorByHealth, getStatusColors } from '@/lib/map-theme';
import { pnodeToNode3D, filterNodes } from '@/lib/map-3d-utils';
import { Map3DSidebar } from './Map3DSidebar';
import { NetworkOverview } from './NetworkOverview';
import { Map3DControlsEnhanced } from './Map3DControlsEnhanced';
import { generateCountryLabels, generateCityLabels } from '@/lib/label-utils';
import { calculateMapStats, toMap3DSidebarStats } from '@/lib/map-stats';
import { clusterNodes, isCluster3D, spiderfyNodes, type Node3D, type Cluster3D } from '@/lib/simple-3d-clustering';
import type { Node3DData, Globe3DMode, Globe3DFilter } from '@/lib/types-3d';
import type { ClusterFeature, NodeFeature } from '@/lib/types-clustering';
import { isCluster } from '@/lib/types-clustering';

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

type Map3DViewerProps = {
  pnodes: any[];
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

export function Map3DViewer({ pnodes, onClose }: Map3DViewerProps) {
  const router = useRouter();
  const { theme, mounted: themeMounted } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const globeEl = useRef<any>(null);
  const [countriesData, setCountriesData] = useState<any>(null);

  // State
  const [mode, setMode] = useState<Globe3DMode>('free');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showArcs, setShowArcs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const [zoomLevel, setZoomLevel] = useState<'global' | 'regional' | 'node'>('global');
  const [focusedNode, setFocusedNode] = useState<Node3DData | null>(null);
  const [focusedCountry, setFocusedCountry] = useState<string | null>(null);
  const [currentAltitude, setCurrentAltitude] = useState<number>(2.5);
  const lastClickTime = useRef<number>(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Simple clustering state
  const [spiderfiedNodes, setSpiderfiedNodes] = useState<Node3D[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster3D | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Fetch countries GeoJSON for borders
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then(res => res.json())
      .then(data => setCountriesData(data))
      .catch(err => console.error('Failed to load countries:', err));
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

  // Convert pnodes to 3D data
  const allNodes = useMemo(() => {
    return pnodes
      .map(pnode => pnodeToNode3D(pnode))
      .filter((node): node is Node3DData => node !== null);
  }, [pnodes]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    // Don't filter by default - show all nodes unless explicitly filtered
    if (filter.health === 'all' && filter.network === 'all' && !filter.activeOnly) {
      return allNodes;
    }
    return filterNodes(allNodes, filter);
  }, [allNodes, filter]);

  // Calculate stats using unified function (same as dashboard)
  const stats = useMemo(() => {
    const mapStats = calculateMapStats(pnodes);
    return toMap3DSidebarStats(mapStats);
  }, [pnodes]);

  // Handle node search
  const handleSearch = useCallback((query: string) => {
    const node = allNodes.find(n => n.ip.includes(query));
    if (node && globeEl.current) {
      globeEl.current.pointOfView({
        lat: node.lat,
        lng: node.lng,
        altitude: 1.5,
      }, 1000);
      setMode('focused');
    }
  }, [allNodes]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView({ altitude: Math.max(0.3, pov.altitude - 0.5) }, 300);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      globeEl.current.pointOfView({ altitude: Math.min(3, pov.altitude + 0.5) }, 300);
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (globeEl.current) {
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
      setZoomLevel('global');
      setCurrentAltitude(2.5);
      setFocusedNode(null);
      setFocusedCountry(null);
      setMode('free');
    }
  }, []);


  // Prepare labels for countries and cities - with collision detection
  const labels = useMemo(() => {
    if (!countriesData || !mapTheme) return [];

    // Build map of nodes per country for priority
    const nodesByCountry = new Map<string, number>();
    filteredNodes.forEach(node => {
      if (node.country) {
        nodesByCountry.set(node.country, (nodesByCountry.get(node.country) || 0) + 1);
      }
    });

    // Global/Continental view: Show country labels with collision detection
    if (currentAltitude > 1.0) {
      return generateCountryLabels(
        countriesData,
        nodesByCountry,
        currentAltitude,
        mapTheme.ui.accent
      );
    }

    // Zoomed view: Show city labels
    const uniqueCities = new Map<string, { city: string; lat: number; lng: number; country: string }>();
    filteredNodes.forEach(node => {
      if (node.city) {
        const key = `${node.city}-${node.country}`;
        if (!uniqueCities.has(key)) {
          uniqueCities.set(key, {
            city: node.city,
            lat: node.lat,
            lng: node.lng,
            country: node.country || 'Unknown',
          });
        }
      }
    });

    return generateCityLabels(
      Array.from(uniqueCities.values()),
      currentAltitude,
      mapTheme.ui.accent
    );
  }, [countriesData, mapTheme, currentAltitude, filteredNodes]);
  // Simple clustering based on altitude (replaces Supercluster)
  const { points, clusters } = useMemo(() => {
    if (!mapTheme || filteredNodes.length === 0) {
      console.log('[Simple Cluster] Not ready');
      return { points: [], clusters: [] };
    }

    const getColor = (health: number) => {
      if (health >= 85) return mapTheme.nodes.excellent;
      if (health >= 70) return mapTheme.nodes.good;
      if (health >= 50) return mapTheme.nodes.warning;
      return mapTheme.nodes.critical;
    };

    // Use our simple clustering system
    const clustered = clusterNodes(filteredNodes, currentAltitude);
    
    // Convert to globe points format
    const allPoints = clustered.map((item: Node3D | Cluster3D) => {
      if (isCluster3D(item)) {
        // It's a cluster
        return {
          lat: item.lat,
          lng: item.lng,
          size: 0.5,
          color: mapTheme.ui.textSecondary || '#888888', // Neutral color
          altitude: 0.01,
          node: {
            ...item,
            ip: `Cluster (${item.count} nodes)`,
            clusterCount: item.count,
          },
        };
      } else {
        // Individual node
        return {
          lat: item.lat,
          lng: item.lng,
          size: 0.15,
          color: getColor(item.health),
          altitude: 0.01,
          node: item,
        };
      }
    });

    const clusterPoints = allPoints.filter((p: any) => isCluster3D(p.node));
    
    console.log('[Simple Cluster] Result:', clusterPoints.length, 'clusters,', allPoints.length - clusterPoints.length, 'nodes');

    return {
      points: allPoints,
      clusters: clusterPoints,
    };
  }, [mapTheme, currentAltitude, filteredNodes]);

  // Handle mouse interaction - pause rotation on hover
  const handleGlobeHover = useCallback((isHovering: boolean) => {
    // Auto-rotate controlled by hasUserInteracted state in separate useEffect
  }, []);


  // Handle point click - Simple and reliable zoom
  const handlePointClick = useCallback((point: any) => {
    if (!point?.node || !globeEl.current) return;

    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // Check if it's a cluster
    if (point.node.clusterCount && point.node.clusterCount > 1) {
      console.log('[Click] Cluster clicked:', point.node.clusterCount, 'nodes at altitude', currentAltitude);
      
      // Clear any spiderfy
      setSpiderfiedNodes([]);
      setSelectedCluster(null);
      
      // Simple zoom: reduce altitude by 60% each click, ensuring progressive zoom
      const targetAltitude = Math.max(0.1, currentAltitude * 0.4);
      
      console.log('[Click] Zooming from', currentAltitude.toFixed(2), 'to', targetAltitude.toFixed(2));
      
      globeEl.current.pointOfView({
        lat: point.lat,
        lng: point.lng,
        altitude: targetAltitude,
      }, 1000);
      
      setCurrentAltitude(targetAltitude);
      setZoomLevel(targetAltitude > 1.5 ? 'global' : targetAltitude > 0.8 ? 'regional' : 'node');
      setFocusedNode(null);
      
      lastClickTime.current = now;
      return;
    }

    // Single node - check for double-click to navigate
    if (timeSinceLastClick < 400) {
      console.log('[Click] Double-click - navigating to', point.node.ip);
      router.push(`/pnode/${encodeURIComponent(point.node.ip)}`);
      lastClickTime.current = 0;
      return;
    }

    // Single click on node - zoom to it
    lastClickTime.current = now;
    const targetAltitude = 0.2;
    console.log('[Click] Single node clicked:', point.node.ip);
    
    globeEl.current.pointOfView({
      lat: point.lat,
      lng: point.lng,
      altitude: targetAltitude,
    }, 800);
    
    setCurrentAltitude(targetAltitude);
    setZoomLevel('node');
    setFocusedNode(point.node);
    setFocusedCountry(point.node.country || null);
  }, [currentAltitude, router]);

  // Track altitude changes from globe controls (manual zoom)
  useEffect(() => {
    if (!globeEl.current || !isClient) return;
    
    const intervalId = setInterval(() => {
      if (globeEl.current) {
        const pov = globeEl.current.pointOfView();
        if (pov && pov.altitude !== undefined && Math.abs(pov.altitude - currentAltitude) > 0.01) {
          console.log('[Altitude] Manual change detected:', pov.altitude);
          setCurrentAltitude(pov.altitude);
        }
      }
    }, 100); // Check every 100ms
    
    return () => clearInterval(intervalId);
  }, [currentAltitude, isClient]);

  // Force auto-rotation after globe is ready
  // Auto-rotate on mount, stop on any user interaction
  useEffect(() => {
    if (globeEl.current && isClient) {
      const controls = globeEl.current.controls();
      
      console.log('[Auto-Rotate] Effect triggered. hasUserInteracted:', hasUserInteracted);
      
      if (controls) {
        // Start with auto-rotation only if user hasn't interacted yet
        if (!hasUserInteracted) {
          console.log('[Auto-Rotate] Starting auto-rotation');
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.5;
        } else {
          console.log('[Auto-Rotate] Stopping auto-rotation (user interacted)');
          controls.autoRotate = false;
        }
      }

      // Add interaction listeners to stop auto-rotation
      const scene = globeEl.current.scene();
      if (scene && scene.domElement) {
        const canvas = scene.domElement;

        const handleUserInteraction = (e: Event) => {
          console.log('[Auto-Rotate] User interaction detected:', e.type);
          setHasUserInteracted(true);
          const controls = globeEl.current?.controls();
          if (controls) {
            console.log('[Auto-Rotate] Stopping rotation immediately');
            controls.autoRotate = false;
          }
        };

        // Listen for any user interaction
        canvas.addEventListener('mousedown', handleUserInteraction);
        canvas.addEventListener('wheel', handleUserInteraction);
        canvas.addEventListener('touchstart', handleUserInteraction);

        console.log('[Auto-Rotate] Event listeners attached to canvas');

        return () => {
          console.log('[Auto-Rotate] Cleanup - removing event listeners');
          canvas.removeEventListener('mousedown', handleUserInteraction);
          canvas.removeEventListener('wheel', handleUserInteraction);
          canvas.removeEventListener('touchstart', handleUserInteraction);
        };
      }
    }
  }, [isClient, hasUserInteracted]);

  if (!isClient || !themeMounted || !mapTheme) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden" style={{
      background: mapTheme.background,
    }}>
      {/* Network Overview KPI Dashboard */}
      <NetworkOverview nodes={pnodes} />

      {/* Enhanced Controls */}
      <Map3DControlsEnhanced
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        viewLevel={zoomLevel}
        viewContext={focusedCountry || focusedNode?.city}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-[10001] flex gap-2">
        {/* Switch to 2D button */}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border text-xs font-semibold transition-all hover:scale-105 backdrop-blur-sm"
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
      </div>

      {/* Context Info Panel - Bottom Center */}
      {(focusedCountry || focusedNode) && (
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[10001] px-6 py-4 rounded-xl border backdrop-blur-md transition-all duration-300 animate-slide-up"
          style={{
            background: `${mapTheme.ui.card}ee`,
            borderColor: mapTheme.ui.cardBorder,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div className="flex items-center gap-4">
            {focusedCountry && (
              <div className="flex items-center gap-2">
                <span style={{ color: mapTheme.ui.textSecondary, fontSize: '12px' }}>📍</span>
                <span style={{ color: mapTheme.ui.text, fontWeight: 600, fontSize: '14px' }}>
                  {focusedCountry}
                </span>
              </div>
            )}
            {focusedNode && (
              <>
                <div style={{ width: '1px', height: '20px', background: mapTheme.ui.cardBorder }} />
                <div className="flex items-center gap-3">
                  <span style={{ color: mapTheme.ui.textSecondary, fontSize: '11px' }}>Node:</span>
                  <span style={{ color: mapTheme.ui.accent, fontWeight: 600, fontSize: '12px', fontFamily: 'monospace' }}>
                    {focusedNode.ip}
                  </span>
                  <button
                    onClick={() => router.push(`/pnode/${encodeURIComponent(focusedNode.ip)}`)}
                    className="px-3 py-1 rounded text-xs font-semibold transition-all hover:scale-105"
                    style={{
                      background: mapTheme.ui.accent,
                      color: mapTheme.background === '#000000' ? '#000000' : '#ffffff',
                    }}
                  >
                    View Details
                  </button>
                </div>
              </>
            )}
          </div>
          <div style={{ color: mapTheme.ui.textSecondary, fontSize: '10px', marginTop: '6px', textAlign: 'center' }}>
            {zoomLevel === 'node' ? 'Double-click node for details' : 'Click to zoom in'}
          </div>
        </div>
      )}

      {/* Sidebar Controls */}
      {!sidebarCollapsed && (
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
      )}

      {/* Globe Container - Takes remaining height after NetworkOverview */}
      <div
        className="w-full"
        style={{ 
          height: 'calc(100vh - 80px)', // NetworkOverview is now ~80px tall
          background: '#000000',
          position: 'absolute',
          top: '80px',
          left: 0,
          right: 0,
        }}
        onMouseEnter={() => handleGlobeHover(true)}
        onMouseLeave={() => handleGlobeHover(false)}
      >
        <Globe
          {...{
            ref: globeEl,
            width: typeof window !== 'undefined' ? window.innerWidth : 1920,
            height: typeof window !== 'undefined' ? (window.innerHeight - 80) : 1000,

            // Pure black background
            backgroundColor: 'rgb(0, 0, 0)',
            backgroundImageUrl: null,

            // HIDE the globe sphere completely - we only want polygons
            showGlobe: false,

            // Atmosphere
            showAtmosphere: true,
            atmosphereColor: mapTheme.globe.atmosphere,
            atmosphereAltitude: 0.15,

            // Countries polygons - Match 2D map style exactly
            polygonsData: countriesData?.features || [],
            polygonCapColor: () => mapTheme.countries.fill,
            polygonSideColor: () => mapTheme.countries.fill,
            polygonStrokeColor: () => mapTheme.countries.stroke,
            polygonAltitude: 0.001,
            polygonsTransitionDuration: 0,

            // Labels for countries and cities (always visible)
            labelsData: labels,
            labelLat: 'lat',
            labelLng: 'lng',
            labelText: 'text',
            labelSize: 'size',
            labelColor: 'color',
            labelAltitude: 'altitude',
            labelResolution: 2,
            labelIncludeDot: false,
            labelDotRadius: 0,

            // HTML Elements for clusters (with count displayed)
            htmlElementsData: clusters,
            htmlElement: (d: any) => {
              if (!d.node || !d.node.clusterCount) return document.createElement('div');
              
              const el = document.createElement('div');
              // Smaller, more aesthetic sizing based on count
              const baseSize = 40;
              const size = Math.min(70, baseSize + Math.log(d.node.clusterCount) * 6);
              
              el.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: 3px solid ${mapTheme.ui.textSecondary || '#888888'};
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(10px);
                display: grid;
                place-items: center;
                color: ${mapTheme.ui.text || '#ffffff'};
                font-weight: 700;
                font-size: ${d.node.clusterCount > 100 ? '15px' : d.node.clusterCount > 50 ? '14px' : '12px'};
                font-family: system-ui, -apple-system, sans-serif;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                user-select: none;
                pointer-events: auto;
                transform: translate(-50%, -50%);
              `;
              el.textContent = d.node.clusterCount.toString();
              
              // Direct click handler on the element
              el.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('[HTML Click] Cluster clicked directly:', d.node.clusterCount);
                handlePointClick(d);
              });
              
              // Hover effect
              el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.15)';
                el.style.borderColor = mapTheme.ui.accent;
                el.style.borderWidth = '4px';
              });
              el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
                el.style.borderColor = mapTheme.ui.textSecondary || '#888888';
                el.style.borderWidth = '3px';
              });
              
              return el;
            },
            htmlLat: (d: any) => d.lat,
            htmlLng: (d: any) => d.lng,
            htmlAltitude: 0.01,

            // Points (nodes) - Clean circular points with tooltips for individual nodes only
            pointsData: points.filter((p: any) => !p.node?.clusterCount || p.node.clusterCount === 1),
            pointColor: "color",
            pointRadius: "size",
            pointAltitude: 0,
            pointLabel: (point: any) => {
              if (!point.node) return '';
              const node = point.node;

              // Handle cluster tooltip
              if (node.clusterCount && node.clusterCount > 1) {
                return `
                  <div style="
                    background: ${mapTheme.ui.card};
                    color: ${mapTheme.ui.text};
                    padding: 14px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    border: 2px solid ${mapTheme.ui.cardBorder};
                    min-width: 200px;
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                  ">
                    <div style="
                      font-weight: 700; 
                      margin-bottom: 10px; 
                      font-size: 16px; 
                      color: ${mapTheme.ui.accent};
                      text-align: center;
                    ">
                      📍 ${node.clusterCount} Nodes
                    </div>
                    <div style="
                      font-size: 12px; 
                      color: ${mapTheme.ui.textSecondary};
                      text-align: center;
                      margin-bottom: 10px;
                    ">
                      Average Health: <span style="color: ${getNodeColorByHealth(node.health, mapTheme)}; font-weight: 600;">${node.health.toFixed(0)}%</span>
                    </div>
                    <div style="
                      font-size: 10px; 
                      color: ${mapTheme.ui.textSecondary};
                      text-align: center;
                      font-style: italic;
                    ">
                      Click to zoom in
                    </div>
                  </div>
                `;
              }

              // Single node tooltip
              return `
                <div style="
                  background: ${mapTheme.ui.card};
                  color: ${mapTheme.ui.text};
                  padding: 14px;
                  border-radius: 10px;
                  font-size: 13px;
                  font-family: 'Inter', system-ui, -apple-system, sans-serif;
                  border: 2px solid ${mapTheme.ui.cardBorder};
                  min-width: 220px;
                  backdrop-filter: blur(12px);
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                ">
                  <div style="
                    font-weight: 700; 
                    margin-bottom: 10px; 
                    font-size: 14px; 
                    color: ${mapTheme.ui.accent};
                    display: flex;
                    align-items: center;
                    gap: 8px;
                  ">
                    <span style="
                      display: inline-block;
                      width: 8px;
                      height: 8px;
                      border-radius: 50%;
                      background: ${getNodeColorByHealth(node.health, mapTheme)};
                      box-shadow: 0 0 8px ${getNodeColorByHealth(node.health, mapTheme)};
                    "></span>
                    ${node.ip}
                  </div>
                  
                  <div style="
                    font-size: 11px; 
                    color: ${mapTheme.ui.textSecondary}; 
                    margin-bottom: 12px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid ${mapTheme.ui.cardBorder};
                  ">
                    📍 ${node.city || 'Unknown'}, ${node.country || 'Unknown'}
                  </div>
                  
                  ${node.operator ? `
                    <div style="
                      font-size: 10px;
                      color: ${mapTheme.ui.textSecondary};
                      margin-bottom: 12px;
                      padding: 8px;
                      background: ${mapTheme.ui.card};
                      border: 1px solid ${mapTheme.ui.cardBorder};
                      border-radius: 6px;
                      font-family: 'Courier New', monospace;
                      word-break: break-all;
                      line-height: 1.4;
                    ">
                      <span style="font-weight: 600; color: ${mapTheme.ui.accent};">Operator:</span><br/>
                      ${node.operator}
                    </div>
                  ` : ''}
                  
                  <div style="
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 8px 12px;
                    font-size: 11px;
                    color: ${mapTheme.ui.text};
                  ">
                    <span style="color: ${mapTheme.ui.textSecondary};">Health:</span>
                    <span style="font-weight: 600; color: ${getNodeColorByHealth(node.health, mapTheme)};">
                      ${node.health.toFixed(0)}%
                    </span>
                    
                    ${node.storage ? `
                      <span style="color: ${mapTheme.ui.textSecondary};">Storage:</span>
                      <span style="font-weight: 500;">${node.storage.toFixed(2)} GB</span>
                    ` : ''}
                    
                    ${node.uptime ? `
                      <span style="color: ${mapTheme.ui.textSecondary};">Uptime:</span>
                      <span style="font-weight: 500;">${node.uptime.toFixed(1)}h</span>
                    ` : ''}
                    
                    ${node.cpu ? `
                      <span style="color: ${mapTheme.ui.textSecondary};">CPU:</span>
                      <span style="font-weight: 500;">${node.cpu.toFixed(1)}%</span>
                    ` : ''}
                    
                    ${node.ram ? `
                      <span style="color: ${mapTheme.ui.textSecondary};">RAM:</span>
                      <span style="font-weight: 500;">${node.ram.toFixed(1)}%</span>
                    ` : ''}
                    
                    ${node.version ? `
                      <span style="color: ${mapTheme.ui.textSecondary};">Version:</span>
                      <span style="font-weight: 500; font-family: 'Courier New', monospace;">${node.version}</span>
                    ` : ''}
                  </div>
                  
                  <div style="
                    margin-top: 12px;
                    padding-top: 10px;
                    border-top: 1px solid ${mapTheme.ui.cardBorder};
                  ">
                    <div style="
                      display: inline-block;
                      font-size: 10px;
                      font-weight: 700;
                      padding: 6px 12px;
                      border-radius: 6px;
                      background: ${mapTheme.ui.accent};
                      color: ${mapTheme.background === '#000000' ? '#000000' : '#ffffff'};
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                      cursor: pointer;
                      transition: transform 0.2s;
                    ">
                      → View Details
                    </div>
                  </div>
                </div>
              `;
            },
            onPointClick: handlePointClick,
            onHtmlElementClick: handlePointClick,
            onPointHover: (point: any) => {
              // Stop rotation when hovering over any point
              if (globeEl.current) {
                const controls = globeEl.current.controls();
                if (controls) {
                  // Auto-rotate controlled by hasUserInteracted state
                }
              }
            },
            pointResolution: 8,
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

                // Auto-rotate controlled by hasUserInteracted state

                // Start animation loop
                controls.update();
              }
            }
          } as any}
        />
      </div>

      {/* Legend - Compact version */}
      <div className="absolute bottom-4 left-[26rem] z-[10000] px-3 py-2 rounded-lg border text-[9px] font-mono shadow-lg backdrop-blur-sm"
        style={{
          background: `${mapTheme.ui.card}dd`,
          borderColor: mapTheme.ui.cardBorder,
          color: mapTheme.ui.textSecondary,
        }}>
        <div className="mb-1.5 font-bold text-[10px]" style={{ color: mapTheme.ui.accent }}>
          NODE HEALTH
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors?.excellent }}></span>
            <span className="text-[8px]">EXCELLENT</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors?.good }}></span>
            <span className="text-[8px]">GOOD</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors?.warning }}></span>
            <span className="text-[8px]">WARNING</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColors?.critical }}></span>
            <span className="text-[8px]">CRITICAL</span>
          </div>
        </div>
        <div className="mt-2 pt-1.5 border-t text-[8px]" style={{
          borderColor: mapTheme.ui.cardBorder,
          color: mapTheme.ui.textSecondary,
        }}>
          {allNodes.length} nodes • Click for details
        </div>
      </div>

    </div>
  );
}
