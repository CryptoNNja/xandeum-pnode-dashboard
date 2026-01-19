'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { X, Camera } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Map3DScene } from './Map3DScene';
import { Map3DSidebar } from './Map3DSidebar';
import { Map3DLegend } from './Map3DLegend';
import { pnodeToNode3D, getGlobeTheme, filterNodes } from '@/lib/map-3d-utils';
import type { Node3DData, Globe3DMode, Globe3DFilter, CameraPosition } from '@/lib/types-3d';

type Map3DViewerProps = {
  pnodes: any[];
  onClose: () => void;
};

export function Map3DViewer({ pnodes, onClose }: Map3DViewerProps) {
  // Hide other floating widgets when 3D modal is open
  useEffect(() => {
    document.body.style.setProperty('--hide-floating-widgets', '1');
    return () => {
      document.body.style.removeProperty('--hide-floating-widgets');
    };
  }, []);
  const { theme } = useTheme();
  const [mode, setMode] = useState<Globe3DMode>('free');
  const [showArcs, setShowArcs] = useState(false);
  const [filter, setFilter] = useState<Globe3DFilter>({
    health: 'all',
    network: 'all',
    activeOnly: false,
  });
  const [visualSettings, setVisualSettings] = useState({
    showHeight: true,
    showGlow: true,
    showLabels: false,
  });
  const [cameraPosition, setCameraPosition] = useState<CameraPosition | undefined>();
  const [hoveredNode, setHoveredNode] = useState<Node3DData | null>(null);
  
  // Convert pnodes to 3D data
  const allNodes = useMemo(() => {
    return pnodes
      .map(pnode => pnodeToNode3D(pnode))
      .filter((node): node is Node3DData => node !== null);
  }, [pnodes]);
  
  // Apply filters
  const filteredNodesData = useMemo(() => {
    return filterNodes(allNodes, filter);
  }, [allNodes, filter]);
  
  // Get globe theme
  const globeTheme = useMemo(() => getGlobeTheme(theme), [theme]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const healthyNodes = filteredNodesData.filter(n => n.health >= 70).length;
    const warningNodes = filteredNodesData.filter(n => n.health >= 40 && n.health < 70).length;
    const criticalNodes = filteredNodesData.filter(n => n.health < 40).length;
    const avgHealth = filteredNodesData.reduce((sum, n) => sum + n.health, 0) / filteredNodesData.length;
    const totalStorage = filteredNodesData.reduce((sum, n) => sum + n.storage, 0);
    const activeStreams = filteredNodesData.filter(n => n.hasActiveStreams).length;
    
    return {
      totalNodes: filteredNodesData.length,
      healthyNodes,
      warningNodes,
      criticalNodes,
      avgHealth: avgHealth || 0,
      totalStorage,
      activeStreams,
    };
  }, [filteredNodesData]);
  
  // Handle node search
  const handleSearch = useCallback((query: string) => {
    const node = allNodes.find(n => n.ip.includes(query));
    if (node) {
      setCameraPosition({
        lat: node.lat,
        lng: node.lng,
        altitude: 2,
      });
      setMode('focused');
    }
  }, [allNodes]);
  
  // Handle screenshot
  const handleScreenshot = useCallback(() => {
    // TODO: Implement canvas screenshot
    console.log('Screenshot feature coming soon!');
  }, []);
  
  return (
    <div className="fixed inset-0 z-50 bg-bg-dark">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-lg text-text-primary hover:bg-bg-hover transition-all shadow-lg"
        title="Close 3D View"
      >
        <X className="w-5 h-5" />
      </button>
      
      {/* Screenshot Button */}
      <button
        onClick={handleScreenshot}
        className="absolute top-4 right-16 z-20 p-2 bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-lg text-text-primary hover:bg-bg-hover transition-all shadow-lg"
        title="Take Screenshot"
      >
        <Camera className="w-5 h-5" />
      </button>
      
      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-xl px-4 py-2 shadow-lg pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-text-primary">
            3D Network Globe
          </span>
          <span className="text-xs text-text-secondary">
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
      
      {/* 3D Scene */}
      <Map3DScene
        nodes={filteredNodesData}
        theme={globeTheme}
        mode={mode}
        onNodeClick={(node) => {
          setCameraPosition({
            lat: node.lat,
            lng: node.lng,
            altitude: 2,
          });
          setMode('focused');
        }}
        onNodeHover={setHoveredNode}
        showArcs={showArcs}
        cameraPosition={cameraPosition}
        visualSettings={visualSettings}
      />
      
      {/* Bottom Legend - Compact (repositioned to avoid button overlap) */}
      <div className="absolute bottom-6 left-[26rem] z-20 bg-bg-card/95 backdrop-blur-xl border border-border-app rounded-xl p-4 shadow-lg max-w-xs">
        <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Visual Guide
        </div>
        <div className="space-y-2 text-xs">
          {visualSettings.showHeight && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-6 bg-gradient-to-t from-red-500 via-yellow-500 to-green-500 rounded" />
              <span className="text-text-primary">Height = Health Score</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <span className="text-text-primary">Color = Health Status</span>
          </div>
        </div>
      </div>
    </div>
  );
}
