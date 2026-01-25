'use client';

import { ZoomIn, ZoomOut, RotateCcw, Globe2, Map, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

type Map3DControlsEnhancedProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  viewLevel: 'global' | 'regional' | 'node';
  viewContext?: string; // country name or city name
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function Map3DControlsEnhanced({
  onZoomIn,
  onZoomOut,
  onReset,
  viewLevel,
  viewContext,
  sidebarCollapsed,
  onToggleSidebar,
}: Map3DControlsEnhancedProps) {
  const viewConfig = {
    global: { icon: Globe2, label: 'Global View', color: 'text-blue-500' },
    regional: { icon: Map, label: viewContext || 'Regional View', color: 'text-cyan-500' },
    node: { icon: MapPin, label: viewContext || 'Node View', color: 'text-emerald-500' },
  };

  const current = viewConfig[viewLevel];
  const ViewIcon = current.icon;

  return (
    <>
      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="fixed left-6 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-bg-card/95 hover:bg-bg-hover backdrop-blur-xl border border-border-app rounded-lg shadow-lg transition-all hover:scale-105"
        title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-text-primary" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-text-primary" />
        )}
      </button>

      {/* View Indicator - Top Center */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-2.5 bg-bg-card/95 backdrop-blur-xl border border-border-app rounded-full shadow-lg">
        <div className="flex items-center gap-2">
          <ViewIcon className={`w-4 h-4 ${current.color}`} />
          <span className="text-sm font-semibold text-text-primary">
            {current.label}
          </span>
        </div>
      </div>

      {/* Zoom Controls - Top Right */}
      <div className="fixed top-24 right-6 z-20 flex flex-col gap-2">
        <button
          onClick={onZoomIn}
          className="p-3 bg-bg-card/95 hover:bg-bg-hover backdrop-blur-xl border border-border-app rounded-lg shadow-lg transition-all hover:scale-105 group"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-text-primary group-hover:text-accent-aqua transition-colors" />
        </button>

        <button
          onClick={onZoomOut}
          className="p-3 bg-bg-card/95 hover:bg-bg-hover backdrop-blur-xl border border-border-app rounded-lg shadow-lg transition-all hover:scale-105 group"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-text-primary group-hover:text-accent-aqua transition-colors" />
        </button>

        <div className="h-px bg-border-app my-1" />

        <button
          onClick={onReset}
          className="p-3 bg-bg-card/95 hover:bg-bg-hover backdrop-blur-xl border border-border-app rounded-lg shadow-lg transition-all hover:scale-105 group"
          title="Reset View"
        >
          <RotateCcw className="w-5 h-5 text-text-primary group-hover:text-accent-aqua transition-colors" />
        </button>
      </div>
    </>
  );
}
