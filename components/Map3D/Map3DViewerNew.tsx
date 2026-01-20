'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTheme } from '@/hooks/useTheme';
import { getMapTheme, getNodeColorByHealth, getStatusColors } from '@/lib/map-theme';
import { pnodeToNode3D, filterNodes, getDynamicLabels, getViewLevel, getFlagEmoji } from '@/lib/map-3d-utils';
import { Map3DSidebar } from './Map3DSidebar';
import { NetworkOverview } from './NetworkOverview';
import { Map3DControlsEnhanced } from './Map3DControlsEnhanced';
import type { PNode } from '@/lib/types';
import type { Globe3DMode, Globe3DFilter, Node3DData } from '@/lib/types-3d';

// Dynamically import Globe to avoid SSR issues
const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => <div className="h-full flex items-center justify-center text-muted-foreground">Loading globe...</div>
});

interface Map3DViewerNewProps {
  allNodes: PNode[];
  onClose: () => void;
}

export function Map3DViewerNew({ allNodes, onClose }: Map3DViewerNewProps) {
  const router = useRouter();
  const { theme: appTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const globeEl = useRef<any>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Stop auto-rotation when user has interacted
  useEffect(() => {
    if (hasUserInteracted && globeEl.current) {
      const controls = globeEl.current.controls();
      if (controls) {
        controls.autoRotate = false;
      }
    }
  }, [hasUserInteracted]);
  
  // State
  const [mode, setMode] = useState<Globe3DMode>('free');
  const [showArcs, setShowArcs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filter, setFilter] = useState<Globe3DFilter>({
    health: 'all',
    network: 'all',
    activeOnly: false,
  });
  const [cameraDistance, setCameraDistance] = useState(2.5);
  const [currentAltitude, setCurrentAltitude] = useState(2.5);
  const [countries, setCountries] = useState<any>({ features: [] });
  const [selectedNode, setSelectedNode] = useState<Node3DData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node3DData | null>(null);
  useEffect(() => {
    setIsClient(true);
    setThemeMounted(true);
    
    // Load country boundaries
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries)
      .catch(err => console.error('Failed to load countries:', err));
  }, []);

  const mapTheme = useMemo(() => {
    if (!themeMounted) return null;
    return getMapTheme(appTheme);
  }, [appTheme, themeMounted]);

  const statusColors = useMemo(() => {
    if (!themeMounted) return null;
    return getStatusColors(appTheme);
  }, [appTheme, themeMounted]);

  // Convert PNodes to 3D data
  const nodes3D = useMemo(() => {
    return allNodes.map(pnodeToNode3D).filter((node): node is Node3DData => node !== null);
  }, [allNodes]);

  // Apply filters
  const filteredNodes = useMemo(() => {
    return filterNodes(nodes3D, filter);
  }, [nodes3D, filter]);

  // Google Maps-like multi-level clustering
  // 20+ zoom levels with exponential precision increase
  
  const points = useMemo(() => {
    if (!mapTheme) return [];
    
    // Filter out invalid nodes (NaN coordinates)
    const validNodes = filteredNodes.filter(node => 
      node && 
      typeof node.lat === 'number' && 
      typeof node.lng === 'number' && 
      !isNaN(node.lat) && 
      !isNaN(node.lng) &&
      node.lat >= -90 && node.lat <= 90 &&
      node.lng >= -180 && node.lng <= 180
    );
    
    if (validNodes.length === 0) return [];
    
    // Exponential cluster radius - ultra granular for full decluster
    // At max zoom, radius should be tiny to show individual nodes
    const clusterRadius = Math.max(0.001, Math.pow(cameraDistance, 2.5) * 1.5);
    
    // Grid-based spatial clustering
    const gridSize = Math.max(0.01, clusterRadius);
    const gridCells = new Map<string, Node3DData[]>();
    
    validNodes.forEach(node => {
      const cellX = Math.floor(node.lng / gridSize);
      const cellY = Math.floor(node.lat / gridSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!gridCells.has(cellKey)) {
        gridCells.set(cellKey, []);
      }
      gridCells.get(cellKey)!.push(node);
    });
    
    // Convert grid cells to cluster points
    const result = Array.from(gridCells.values()).map((cellNodes) => {
      const count = cellNodes.length;
      const isCluster = count > 1;
      
      // Calculate center position with validation
      const centerLat = cellNodes.reduce((s, n) => s + n.lat, 0) / count;
      const centerLng = cellNodes.reduce((s, n) => s + n.lng, 0) / count;
      
      // Skip if invalid center
      if (isNaN(centerLat) || isNaN(centerLng)) return null;
      
      // For clusters: use border color (green)
      // For individual nodes: use their health color
      const avgHealth = cellNodes.reduce((s, n) => s + n.health, 0) / count;
      const color = isCluster 
        ? mapTheme.countries.stroke
        : getNodeColorByHealth(avgHealth, mapTheme);
      
      // Get location info
      const country = cellNodes[0]?.country;
      const city = cellNodes[0]?.city;
      const operators = new Set(cellNodes.map(n => n.operator).filter(Boolean)).size;
      
      // Determine level based on count (more granular)
      let level: 'mega' | 'large' | 'medium' | 'small' | 'micro' | 'node';
      if (count >= 100) level = 'mega';
      else if (count >= 30) level = 'large';
      else if (count >= 10) level = 'medium';
      else if (count >= 4) level = 'small';
      else if (count > 1) level = 'micro';
      else level = 'node';
      
      return {
        lat: centerLat,
        lng: centerLng,
        color: color,
        count: count,
        level: level,
        country: country,
        city: city,
        operators: operators,
        node: cellNodes[0],
        nodes: cellNodes,
      };
    }).filter(Boolean); // Remove nulls
    
    return result.filter((item): item is NonNullable<typeof item> => item !== null);
  }, [filteredNodes, cameraDistance, mapTheme]);
  

  // Dynamic labels based on zoom
  const labels = useMemo(() => {
    return getDynamicLabels(filteredNodes, cameraDistance * 100); // Convert to match our scale
  }, [filteredNodes, cameraDistance]);

  // Get current view level
  const viewLevel = useMemo(() => {
    return getViewLevel(cameraDistance * 100);
  }, [cameraDistance]);

  // Handle point click - Multi-level zoom behavior
  const handlePointClick = useCallback((point: any) => {
    if (!point || !globeEl.current) return;
    
    const level = point.level || 'node';
    const lat = point.lat || point.node?.lat;
    const lng = point.lng || point.node?.lng;
    
    if (level === 'country') {
      // Country click - zoom to see regional clusters
      globeEl.current.pointOfView({ 
        lat: lat, 
        lng: lng, 
        altitude: 1.2 
      }, 1000);
      setSelectedNode(null);
    } else if (level === 'cluster') {
      // Cluster click - zoom to see individual nodes
      globeEl.current.pointOfView({ 
        lat: lat, 
        lng: lng, 
        altitude: 0.5 
      }, 800);
      setSelectedNode(null);
    } else if (point.node) {
      // Single node click - show detailed tooltip
      setSelectedNode(point.node);
    }
  }, []);
  
  // Close selected node when clicking elsewhere
  const handleGlobeClick = useCallback(() => {
    if (selectedNode) {
      setSelectedNode(null);
    }
  }, [selectedNode]);

  // Handle label click - Zoom to location
  const handleLabelClick = useCallback((label: any) => {
    if (globeEl.current && label.lat !== undefined && label.lng !== undefined) {
      const targetAltitude = Math.max(1.0, cameraDistance / 2);
      globeEl.current.pointOfView({ lat: label.lat, lng: label.lng, altitude: targetAltitude }, 1000);
    }
  }, [cameraDistance]);

  // Track camera distance
  const handleZoom = useCallback((coords: any) => {
    if (coords && typeof coords === 'object' && 'altitude' in coords) {
      setCameraDistance(coords.altitude);
      setCurrentAltitude(coords.altitude);
    } else if (typeof coords === 'number') {
      setCameraDistance(coords);
      setCurrentAltitude(coords);
    }
  }, []);

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

      {/* Sidebar - Temporarily disabled for migration */}
      {/* TODO: Re-enable with proper props */}

      {/* Main Globe */}
      <div className="w-full h-full pt-20">
        {isClient && points.length > 0 ? (
          <Globe
            ref={globeEl}
            globeImageUrl={null}
            backgroundColor={mapTheme.background}
            
            // Polygons - EXACT match of 2D map style
            polygonsData={countries.features}
            polygonCapColor={() => mapTheme.countries.fill}
            polygonSideColor={() => mapTheme.background}
            polygonStrokeColor={() => mapTheme.countries.stroke}
            polygonAltitude={0.005}
            onGlobeReady={() => {
              if (globeEl.current) {
                globeEl.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
                
                const controls = globeEl.current.controls();
                if (controls) {
                  controls.autoRotate = true;
                  controls.autoRotateSpeed = 0.5;
                  
                  const handleInteraction = () => {
                    if (!hasUserInteracted) {
                      setHasUserInteracted(true);
                      controls.autoRotate = false;
                    }
                  };
                  
                  controls.addEventListener('start', handleInteraction);
                }
              }
            }}
            pointsData={points}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.006}
            pointRadius="size"
            pointResolution={6}
            pointsMerge={true}
            enablePointerInteraction={false}
            
            // HTML elements for interactive clusters - Google Maps style
            htmlElementsData={points}
            htmlElement={(d: any) => {
              const el = document.createElement('div');
              const level = d.level || 'node';
              const count = d.count || 1;
              const node = d.node;
              const color = d.color || '#00D4AA';
              const isCluster = count > 1;
              
              // Create inner element
              const inner = document.createElement('div');
              
              // Size and style based on level - more granular
              let size: number;
              let fontSize: number;
              let borderWidth: number;
              let showCount: boolean;
              
              switch (level) {
                case 'mega': // 100+ nodes
                  size = Math.min(65, 40 + Math.log10(count) * 12);
                  fontSize = 13;
                  borderWidth = 3;
                  showCount = true;
                  break;
                case 'large': // 30-99 nodes
                  size = Math.min(50, 32 + Math.log10(count) * 10);
                  fontSize = 12;
                  borderWidth = 2;
                  showCount = true;
                  break;
                case 'medium': // 10-29 nodes
                  size = Math.min(38, 26 + Math.log10(count) * 8);
                  fontSize = 11;
                  borderWidth = 2;
                  showCount = true;
                  break;
                case 'small': // 4-9 nodes
                  size = 24;
                  fontSize = 10;
                  borderWidth = 2;
                  showCount = true;
                  break;
                case 'micro': // 2-3 nodes
                  size = 18;
                  fontSize = 9;
                  borderWidth = 2;
                  showCount = true;
                  break;
                default: // Single node
                  size = 10;
                  fontSize = 0;
                  borderWidth = 2;
                  showCount = false;
              }
              
              if (isCluster) {
                // Cluster style - green border color
                inner.style.cssText = `
                  width: ${size}px;
                  height: ${size}px;
                  border-radius: 50%;
                  background: ${color}25;
                  border: ${borderWidth}px solid ${color};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 700;
                  font-size: ${fontSize}px;
                  color: white;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 ${size/2}px ${color}40;
                  transition: all 0.15s ease-out;
                  cursor: pointer;
                  pointer-events: auto;
                  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                `;
                if (showCount) {
                  inner.textContent = count > 999 ? '999+' : String(count);
                }
              } else {
                // Individual node - small colored dot with health color
                inner.style.cssText = `
                  width: ${size}px;
                  height: ${size}px;
                  border-radius: 50%;
                  background: ${color};
                  border: ${borderWidth}px solid rgba(255,255,255,0.8);
                  box-shadow: 0 1px 4px rgba(0,0,0,0.3), 0 0 ${size}px ${color}60;
                  transition: all 0.15s ease-out;
                  cursor: pointer;
                  pointer-events: auto;
                `;
              }
              
              // Hover effects
              const originalBoxShadow = inner.style.boxShadow;
              inner.addEventListener('mouseenter', () => {
                if (isCluster) {
                  inner.style.transform = 'scale(1.15)';
                  inner.style.boxShadow = `0 4px 16px rgba(0,0,0,0.4), 0 0 ${size}px ${color}70`;
                } else {
                  inner.style.transform = 'scale(1.5)';
                  inner.style.boxShadow = `0 2px 8px rgba(0,0,0,0.4), 0 0 20px ${color}`;
                }
              });
              inner.addEventListener('mouseleave', () => {
                inner.style.transform = 'scale(1)';
                inner.style.boxShadow = originalBoxShadow;
              });
              
              // Click handler - zoom based on current altitude
              inner.addEventListener('click', (e) => {
                e.stopPropagation();
                
                if (isCluster) {
                  // Zoom in more aggressively to decluster
                  // At small clusters, zoom more to finally show individuals
                  const zoomFactor = count > 10 ? 0.4 : count > 3 ? 0.3 : 0.2;
                  const newAltitude = Math.max(0.05, cameraDistance * zoomFactor);
                  globeEl.current?.pointOfView({ 
                    lat: d.lat, 
                    lng: d.lng, 
                    altitude: newAltitude 
                  }, 600);
                } else if (node) {
                  // Single node - show tooltip
                  setSelectedNode(node);
                }
              });
              
              el.style.cssText = 'transform: translate(-50%, -50%); pointer-events: auto;';
              el.appendChild(inner);
              
              return el;
            }}
            htmlLat={(d: any) => d.lat}
            htmlLng={(d: any) => d.lng}
            htmlAltitude={0.01}
            pointLabel={(point: any) => {
              const node = point.node;
              const level = point.level || 'node';
              const count = point.count || 1;
              if (!node) return '';

              // LEVEL 1: Country tooltip
              if (level === 'country') {
                const operators = point.operators || 0;
                return `
                  <div style="
                    background: linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%);
                    color: white;
                    padding: 16px 20px;
                    border-radius: 16px;
                    font-family: system-ui, -apple-system, sans-serif;
                    border: 1px solid ${point.color}50;
                    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
                    min-width: 180px;
                    text-align: center;
                  ">
                    <div style="font-size: 24px; margin-bottom: 8px;">
                      ${getFlagEmoji(node.country_code)}
                    </div>
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 12px;">
                      ${point.country || node.country || 'Unknown'}
                    </div>
                    <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 12px;">
                      <div style="text-align: center;">
                        <div style="font-size: 22px; font-weight: 700; color: ${point.color};">${count}</div>
                        <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Nodes</div>
                      </div>
                      ${operators > 0 ? `
                        <div style="text-align: center;">
                          <div style="font-size: 22px; font-weight: 700; color: #fff;">${operators}</div>
                          <div style="font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase;">Operators</div>
                        </div>
                      ` : ''}
                    </div>
                    <div style="
                      padding-top: 12px;
                      border-top: 1px solid rgba(255,255,255,0.1);
                      font-size: 11px;
                      color: ${point.color};
                    ">
                      🔍 Click to explore
                    </div>
                  </div>
                `;
              }

              // LEVEL 2: Regional cluster tooltip
              if (level === 'cluster') {
                return `
                  <div style="
                    background: linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%);
                    color: white;
                    padding: 14px 18px;
                    border-radius: 14px;
                    font-family: system-ui, -apple-system, sans-serif;
                    border: 1px solid ${point.color}50;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
                    min-width: 150px;
                    text-align: center;
                  ">
                    <div style="
                      width: 48px; 
                      height: 48px; 
                      border-radius: 50%; 
                      background: ${point.color}20;
                      border: 2px solid ${point.color};
                      display: flex; 
                      align-items: center; 
                      justify-content: center;
                      margin: 0 auto 10px;
                      font-weight: 700;
                      font-size: 18px;
                      color: ${point.color};
                      box-shadow: 0 0 24px ${point.color}30;
                    ">${count}</div>
                    <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">
                      ${count} Nodes
                    </div>
                    ${point.city ? `
                      <div style="color: rgba(255,255,255,0.6); font-size: 11px; margin-bottom: 8px;">
                        📍 ${point.city}
                      </div>
                    ` : ''}
                    <div style="
                      padding-top: 8px;
                      border-top: 1px solid rgba(255,255,255,0.1);
                      font-size: 10px;
                      color: ${point.color};
                    ">
                      🔍 Click to expand
                    </div>
                  </div>
                `;
              }

              // LEVEL 3: Single node tooltip
              return `
                <div style="
                  background: linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%);
                  color: white;
                  padding: 12px 16px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-family: 'SF Pro Display', system-ui, -apple-system, sans-serif;
                  border: 1px solid ${point.color}40;
                  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1);
                  backdrop-filter: blur(20px);
                  min-width: 180px;
                ">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: ${point.color}; box-shadow: 0 0 12px ${point.color}80;"></div>
                    <div style="font-weight: 600; font-family: 'SF Mono', monospace; font-size: 11px; color: ${point.color};">
                      ${node.ip}
                    </div>
                  </div>
                  ${node.city ? `
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: rgba(255,255,255,0.7); font-size: 11px;">
                      <span style="font-size: 14px;">${getFlagEmoji(node.country_code)}</span>
                      <span>${node.city}, ${node.country || 'Unknown'}</span>
                    </div>
                  ` : ''}
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px;">
                    <div style="background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px;">
                      <div style="color: rgba(255,255,255,0.5); margin-bottom: 2px;">HEALTH</div>
                      <div style="font-weight: 600; color: ${point.color};">${node.health.toFixed(0)}%</div>
                    </div>
                    <div style="background: rgba(255,255,255,0.05); padding: 6px 8px; border-radius: 6px;">
                      <div style="color: rgba(255,255,255,0.5); margin-bottom: 2px;">UPTIME</div>
                      <div style="font-weight: 600;">${node.uptime?.toFixed(1) || '0'}h</div>
                    </div>
                  </div>
                  ${node.version ? `
                    <div style="margin-top: 8px; font-size: 9px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 4px;">
                      <span>📦</span> v${node.version}
                    </div>
                  ` : ''}
                </div>
              `;
            }}
            animateIn={true}
            showAtmosphere={true}
            atmosphereColor={mapTheme.countries.stroke}
            atmosphereAltitude={0.15}
            onZoom={handleZoom}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-2">Loading globe...</p>
              <p className="text-sm">Preparing {allNodes.length} nodes</p>
            </div>
          </div>
        )}

        {/* View Level Indicator */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg z-[10000]"
          style={{
            background: `${mapTheme.ui.card}dd`,
            backdropFilter: 'blur(8px)',
            borderColor: mapTheme.ui.cardBorder,
            color: mapTheme.ui.textSecondary,
            border: `1px solid ${mapTheme.ui.cardBorder}`,
          }}>
          {viewLevel} View
        </div>

        {/* Selected Node Tooltip with dotted line - Premium Design */}
        {selectedNode && (
          <div 
            className="absolute z-[10001] pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
            style={{
              left: '50%',
              top: '25%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div 
              className="relative"
              style={{
                background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${getNodeColorByHealth(selectedNode.health, mapTheme)}30`,
                minWidth: '300px',
                maxWidth: '380px',
                boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${getNodeColorByHealth(selectedNode.health, mapTheme)}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ 
                      backgroundColor: getNodeColorByHealth(selectedNode.health, mapTheme),
                      boxShadow: `0 0 20px ${getNodeColorByHealth(selectedNode.health, mapTheme)}80`
                    }}
                  />
                  <div>
                    <div className="font-mono text-sm font-semibold" style={{ color: getNodeColorByHealth(selectedNode.health, mapTheme) }}>
                      {selectedNode.ip}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {getFlagEmoji(selectedNode.country_code)} {selectedNode.city ? `${selectedNode.city}, ` : ''}{selectedNode.country || 'Unknown'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Health</div>
                  <div className="text-lg font-bold" style={{ color: getNodeColorByHealth(selectedNode.health, mapTheme) }}>
                    {selectedNode.health.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Uptime</div>
                  <div className="text-lg font-bold text-white">
                    {selectedNode.uptime.toFixed(1)}h
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Version</div>
                  <div className="text-sm font-bold text-white">
                    {selectedNode.version || 'N/A'}
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => router.push(`/pnode/${selectedNode.ip}`)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${getNodeColorByHealth(selectedNode.health, mapTheme)} 0%, ${getNodeColorByHealth(selectedNode.health, mapTheme)}CC 100%)`,
                  color: '#000',
                  boxShadow: `0 4px 20px ${getNodeColorByHealth(selectedNode.health, mapTheme)}40`,
                }}
              >
                View Full Details →
              </button>
            </div>
            
            {/* Animated dotted line connecting tooltip to node */}
            <svg 
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '100%',
                transform: 'translateX(-50%)',
                width: '4px',
                height: '120px',
                zIndex: 10000,
              }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={getNodeColorByHealth(selectedNode.health, mapTheme)} stopOpacity="1" />
                  <stop offset="100%" stopColor={getNodeColorByHealth(selectedNode.health, mapTheme)} stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <line
                x1="2"
                y1="0"
                x2="2"
                y2="120"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                strokeDasharray="8,4"
                className="animate-pulse"
              />
              {/* Glow dot at end */}
              <circle 
                cx="2" 
                cy="120" 
                r="4" 
                fill={getNodeColorByHealth(selectedNode.health, mapTheme)}
                style={{ filter: `drop-shadow(0 0 8px ${getNodeColorByHealth(selectedNode.health, mapTheme)})` }}
              />
            </svg>
          </div>
        )}

        {/* Legend */}
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
            {filteredNodes.length} nodes • Click for details
          </div>
        </div>

        {/* Network Overview - Temporarily disabled for migration */}
        {/* TODO: Pass allNodes instead of filteredNodes */}

        {/* Controls - Temporarily disabled for migration */}
        {/* TODO: Re-enable with proper props */}
      </div>
    </div>
  );
}
