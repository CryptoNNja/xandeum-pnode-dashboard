'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { MapRef } from 'react-map-gl/maplibre';

interface NodePopupProps {
  node: any;
  mapRef: React.RefObject<MapRef | null>;
  onClose: () => void;
  onNavigate: (ip: string) => void;
  getNodeColor: (health: number) => string;
}

export function NodePopup({ node, mapRef, onClose, onNavigate, getNodeColor }: NodePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  
  // Use refs for animation loop (source of truth)
  const currentNodePosRef = useRef<{ x: number; y: number } | null>(null);
  const currentPopupPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentLineEndRef = useRef<{ x: number; y: number } | null>(null);
  
  // State only for initial render
  const [initialPositions, setInitialPositions] = useState<{
    nodePos: { x: number; y: number };
    popupPos: { x: number; y: number };
    lineEnd: { x: number; y: number };
  } | null>(null);

  const POPUP_WIDTH = 336;
  const POPUP_HEIGHT = 220;
  const MARGIN = 20;

  useEffect(() => {
    if (!mapRef.current || !node) return;

    const map = mapRef.current.getMap();
    const lng = node.displayLng ?? node.lng;
    const lat = node.displayLat ?? node.lat;

    // Animation loop to update positions smoothly
    const updatePositions = () => {
      const nodeScreenPos = map.project([lng, lat]);
      
      // Get container dimensions
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Define occupied zones
      const LEGEND_WIDTH = 200;
      const TOP_CONTROLS_HEIGHT = 80;
      const BOTTOM_CONTROLS_HEIGHT = 80;
      
      const canPlaceBottomLeft = nodeScreenPos.x > LEGEND_WIDTH + POPUP_WIDTH + MARGIN * 2;
      const canPlaceTopLeft = nodeScreenPos.x > POPUP_WIDTH + MARGIN;
      
      let popupX, popupY, lineEndX, lineEndY;
      
      // Smart quadrant positioning
      if (nodeScreenPos.x < containerWidth / 2) {
        if (nodeScreenPos.y < containerHeight / 2) {
          popupX = containerWidth - POPUP_WIDTH - MARGIN;
          popupY = containerHeight - POPUP_HEIGHT - MARGIN - BOTTOM_CONTROLS_HEIGHT;
          lineEndX = MARGIN;
          lineEndY = MARGIN;
        } else {
          popupX = containerWidth - POPUP_WIDTH - MARGIN;
          popupY = MARGIN + TOP_CONTROLS_HEIGHT;
          lineEndX = MARGIN;
          lineEndY = POPUP_HEIGHT - MARGIN;
        }
      } else {
        if (nodeScreenPos.y < containerHeight / 2) {
          if (canPlaceBottomLeft) {
            popupX = LEGEND_WIDTH + MARGIN * 2;
            popupY = containerHeight - POPUP_HEIGHT - MARGIN - BOTTOM_CONTROLS_HEIGHT;
            lineEndX = POPUP_WIDTH - MARGIN;
            lineEndY = MARGIN;
          } else {
            popupX = MARGIN;
            popupY = MARGIN + TOP_CONTROLS_HEIGHT;
            lineEndX = POPUP_WIDTH - MARGIN;
            lineEndY = POPUP_HEIGHT - MARGIN;
          }
        } else {
          if (canPlaceTopLeft) {
            popupX = MARGIN;
            popupY = MARGIN + TOP_CONTROLS_HEIGHT;
            lineEndX = POPUP_WIDTH - MARGIN;
            lineEndY = POPUP_HEIGHT - MARGIN;
          } else {
            popupX = containerWidth - POPUP_WIDTH - MARGIN;
            popupY = MARGIN + TOP_CONTROLS_HEIGHT;
            lineEndX = MARGIN;
            lineEndY = POPUP_HEIGHT - MARGIN;
          }
        }
      }

      // Update refs (source of truth for animation)
      currentNodePosRef.current = { x: nodeScreenPos.x, y: nodeScreenPos.y };
      currentPopupPosRef.current = { x: popupX, y: popupY };
      currentLineEndRef.current = { x: lineEndX, y: lineEndY };

      // Update DOM directly for smooth animation
      if (popupRef.current) {
        popupRef.current.style.left = `${popupX}px`;
        popupRef.current.style.top = `${popupY}px`;
      }

      // Update line path
      if (lineRef.current) {
        const fullLineEndX = popupX + lineEndX;
        const fullLineEndY = popupY + lineEndY;
        const midX = (nodeScreenPos.x + fullLineEndX) / 2;
        const midY = (nodeScreenPos.y + fullLineEndY) / 2 - 20;
        const pathD = `M ${nodeScreenPos.x} ${nodeScreenPos.y} Q ${midX} ${midY} ${fullLineEndX} ${fullLineEndY}`;
        lineRef.current.setAttribute('d', pathD);
      }

      // Update circle
      if (circleRef.current) {
        circleRef.current.setAttribute('cx', String(nodeScreenPos.x));
        circleRef.current.setAttribute('cy', String(nodeScreenPos.y));
      }

      // Set initial state for first render
      if (!initialPositions) {
        setInitialPositions({
          nodePos: { x: nodeScreenPos.x, y: nodeScreenPos.y },
          popupPos: { x: popupX, y: popupY },
          lineEnd: { x: lineEndX, y: lineEndY },
        });
      }

      rafRef.current = requestAnimationFrame(updatePositions);
    };

    // Start animation loop
    rafRef.current = requestAnimationFrame(updatePositions);

    // Also listen to map events for immediate updates
    map.on('move', updatePositions);
    map.on('zoom', updatePositions);
    map.on('rotate', updatePositions);
    map.on('pitch', updatePositions);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      map.off('move', updatePositions);
      map.off('zoom', updatePositions);
      map.off('rotate', updatePositions);
      map.off('pitch', updatePositions);
    };
  }, [node, mapRef]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!node || !initialPositions) return null;

  return (
    <>
      {/* Connection line SVG */}
      <svg
        className="fixed inset-0 pointer-events-none z-[9998]"
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <linearGradient id="popupLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00D4AA" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          ref={lineRef}
          d={(() => {
            const { nodePos, popupPos, lineEnd } = initialPositions;
            const lineEndX = popupPos.x + lineEnd.x;
            const lineEndY = popupPos.y + lineEnd.y;
            const midX = (nodePos.x + lineEndX) / 2;
            const midY = (nodePos.y + lineEndY) / 2 - 20;
            return `M ${nodePos.x} ${nodePos.y} Q ${midX} ${midY} ${lineEndX} ${lineEndY}`;
          })()}
          stroke="url(#popupLineGradient)"
          strokeWidth="2.5"
          fill="none"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0, 212, 170, 0.6))',
          }}
        />
        <circle
          ref={circleRef}
          cx={initialPositions.nodePos.x}
          cy={initialPositions.nodePos.y}
          r="6"
          fill="#00D4AA"
          className="animate-pulse"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(0, 212, 170, 0.9))',
          }}
        />
      </svg>

      {/* Custom Popup */}
      <div
        ref={popupRef}
        className="fixed z-[9999]"
        style={{
          left: `${initialPositions.popupPos.x}px`,
          top: `${initialPositions.popupPos.y}px`,
          width: `${POPUP_WIDTH}px`,
          height: `${POPUP_HEIGHT}px`,
          animation: 'bubbleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          willChange: 'left, top',
        }}
      >
        <div
          className="relative p-4 min-w-[320px] rounded-xl"
          style={{
            background: '#0A0E1A',
            border: '1px solid #00D4AA',
            boxShadow: '0 8px 32px rgba(0, 212, 170, 0.2), 0 0 20px rgba(0, 212, 170, 0.1)',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-lg transition-all hover:bg-[#00D4AA]/10 hover:rotate-90"
            style={{ color: '#6B7280' }}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Health indicator bar */}
          <div className="h-1 rounded-full mb-3 overflow-hidden" style={{ background: '#1A1F2E' }}>
            <div 
              className="h-full transition-all duration-500"
              style={{
                width: `${node.health}%`,
                background: `linear-gradient(90deg, ${getNodeColor(node.health)}, #00D4AA)`,
                boxShadow: `0 0 8px ${getNodeColor(node.health)}`,
              }}
            />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
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
                  {node.ip}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                <span>{node.city}</span>
                <span>•</span>
                <span>{node.country}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{ color: '#6B7280' }}>Health</div>
              <div className="text-xl font-bold" style={{ color: '#00D4AA' }}>
                {node.health.toFixed(0)}
                <span className="text-xs" style={{ color: '#6B7280' }}>%</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                Storage
              </div>
              <div className="font-bold" style={{ color: node.storage > 0 ? '#00D4AA' : '#6B7280' }}>
                {node.storage > 0 
                  ? `${(node.storage / 1024 / 1024 / 1024).toFixed(1)} GB`
                  : 'N/A'}
              </div>
            </div>

            <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                Version
              </div>
              <div className="font-mono font-bold" style={{ color: '#00D4AA' }}>
                {node.version || 'N/A'}
              </div>
            </div>

            <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                Type
              </div>
              <div className="font-semibold" style={{ color: node.isPublic ? '#00D4AA' : '#6B7280' }}>
                {node.isPublic ? 'PUBLIC' : 'PRIVATE'}
              </div>
            </div>

            <div className="p-2 rounded-lg" style={{ background: '#1A1F2E' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>
                Status
              </div>
              <div className="font-semibold" style={{ color: '#00D4AA' }}>
                {node.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => onNavigate(node.ip)}
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
      </div>
    </>
  );
}
