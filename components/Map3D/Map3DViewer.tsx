'use client';

import { useState, useMemo, useCallback } from 'react';
import { X, Camera, Download } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Map3DScene } from './Map3DScene';
import { Map3DControls } from './Map3DControls';
import { Map3DLegend } from './Map3DLegend';
import { pnodeToNode3D, getGlobeTheme, filterNodes } from '@/lib/map-3d-utils';
import type { Node3DData, Globe3DMode, Globe3DFilter, CameraPosition } from '@/lib/types-3d';

type Map3DViewerProps = {
  pnodes: any[];
  onClose: () => void;
};

export function Map3DViewer({ pnodes, onClose }: Map3DViewerProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<Globe3DMode>('free');
  const [showArcs, setShowArcs] = useState(false);
  const [filter, setFilter] = useState<Globe3DFilter>({
    health: 'all',
    network: 'all',
    activeOnly: false,
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
      
      {/* Controls */}
      <Map3DControls
        mode={mode}
        onModeChange={setMode}
        filter={filter}
        onFilterChange={setFilter}
        showArcs={showArcs}
        onToggleArcs={() => setShowArcs(!showArcs)}
        onSearch={handleSearch}
        totalNodes={allNodes.length}
        filteredNodes={filteredNodesData.length}
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
      />
      
      {/* Legend */}
      <Map3DLegend theme={globeTheme} stats={stats} />
      
      {/* Hovered Node Info (floating) */}
      {hoveredNode && (
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-20 bg-bg-card/95 backdrop-blur-sm border border-border-app rounded-xl p-4 shadow-lg max-w-xs">
          <div className="text-sm font-semibold text-primary mb-2">
            {hoveredNode.ip}
          </div>
          <div className="space-y-1 text-xs text-text-secondary">
            <div>📍 {hoveredNode.city}, {hoveredNode.country}</div>
            <div>💚 Health: {hoveredNode.health.toFixed(0)}/100</div>
            <div>💾 Storage: {hoveredNode.storage.toFixed(2)} GB</div>
            <div>⏱️ Uptime: {hoveredNode.uptime.toFixed(1)}h</div>
          </div>
        </div>
      )}
    </div>
  );
}
