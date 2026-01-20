'use client';

/**
 * ClusterMarker Component
 * Animated, interactive cluster markers for the 3D globe
 * Supports multi-level clustering with smooth transitions
 */

import { memo, useMemo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ClusterFeature, NodeFeature, PointOrCluster } from '@/lib/types-clustering';
import { isCluster, getClusterVisualConfig, formatClusterCount } from '@/lib/types-clustering';
import { getFlagEmoji } from '@/lib/map-3d-utils';

// ============================================================================
// Types
// ============================================================================

export interface ClusterMarkerProps {
  cluster: PointOrCluster;
  color: string;
  accentColor: string;
  onClusterClick?: (cluster: ClusterFeature) => void;
  onNodeClick?: (node: NodeFeature) => void;
  onHover?: (cluster: PointOrCluster | null) => void;
  isSelected?: boolean;
  showLabel?: boolean;
  animate?: boolean;
}

export interface ClusterTooltipProps {
  cluster: PointOrCluster;
  color: string;
  position: { x: number; y: number };
}

// ============================================================================
// Cluster Marker Component
// ============================================================================

export const ClusterMarker = memo(function ClusterMarker({
  cluster,
  color,
  accentColor,
  onClusterClick,
  onNodeClick,
  onHover,
  isSelected = false,
  showLabel = false,
  animate = true,
}: ClusterMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const isClusterPoint = isCluster(cluster);
  const count = isClusterPoint ? cluster.properties.point_count : 1;
  const config = getClusterVisualConfig(count);
  
  // Calculate dynamic size based on count
  const size = useMemo(() => {
    if (!isClusterPoint) return config.baseSize;
    const logScale = Math.log10(count + 1);
    return Math.min(config.baseSize + logScale * 8, 90);
  }, [count, config.baseSize, isClusterPoint]);
  
  // Handle click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isClusterPoint && onClusterClick) {
      onClusterClick(cluster as ClusterFeature);
    } else if (!isClusterPoint && onNodeClick) {
      onNodeClick(cluster as NodeFeature);
    }
  }, [cluster, isClusterPoint, onClusterClick, onNodeClick]);
  
  // Handle hover
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(cluster);
  }, [cluster, onHover]);
  
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(null);
  }, [onHover]);
  
  // Animation variants
  const variants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 20 }
    },
    hover: { 
      scale: 1.15,
      transition: { type: 'spring' as const, stiffness: 400, damping: 15 }
    },
    tap: { scale: 0.95 },
    exit: { scale: 0, opacity: 0 }
  };
  
  // Get label text
  const labelText = useMemo(() => {
    if (!isClusterPoint) return null;
    const props = cluster.properties as ClusterFeature['properties'];
    if (props.primaryCity && props.primaryCity !== 'Unknown') {
      return props.primaryCity;
    }
    if (props.primaryCountry && props.primaryCountry !== 'Unknown') {
      return props.primaryCountry;
    }
    return null;
  }, [cluster, isClusterPoint]);
  
  if (isClusterPoint) {
    // Cluster marker
    return (
      <motion.div
        className="cluster-marker"
        style={{
          position: 'absolute',
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: isHovered || isSelected ? 1000 : count,
        }}
        initial={animate ? 'initial' : false}
        animate={isHovered ? 'hover' : 'animate'}
        whileTap="tap"
        exit="exit"
        variants={variants}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Outer glow ring */}
        {config.glowIntensity > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${color}${Math.round(config.glowIntensity * 40).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
              transform: 'scale(1.8)',
            }}
            animate={config.pulseAnimation ? {
              scale: [1.8, 2.2, 1.8],
              opacity: [0.6, 0.3, 0.6],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
        
        {/* Main cluster circle */}
        <div
          className="relative flex items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            background: `linear-gradient(135deg, ${color}30 0%, ${color}15 100%)`,
            border: `${config.borderWidth}px solid ${color}`,
            boxShadow: `
              0 4px 12px rgba(0, 0, 0, 0.3),
              0 0 ${size / 2}px ${color}40,
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            backdropFilter: 'blur(4px)',
          }}
        >
          {/* Count label */}
          {config.showCount && (
            <span
              className="font-bold text-white"
              style={{
                fontSize: config.fontSize,
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              {formatClusterCount(count)}
            </span>
          )}
        </div>
        
        {/* Location label */}
        {showLabel && labelText && (
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
            style={{
              top: size + 4,
              fontSize: 10,
              fontWeight: 600,
              color: 'white',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {labelText}
          </motion.div>
        )}
        
        {/* Hover indicator */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                border: `2px solid white`,
                opacity: 0.5,
              }}
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 0.5 }}
              exit={{ scale: 1, opacity: 0 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
  
  // Individual node marker
  const node = (cluster as NodeFeature).properties.node;
  
  return (
    <motion.div
      className="node-marker"
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: isHovered || isSelected ? 1000 : 1,
      }}
      initial={animate ? 'initial' : false}
      animate={isHovered ? 'hover' : 'animate'}
      whileTap="tap"
      exit="exit"
      variants={variants}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}60 0%, transparent 70%)`,
          transform: 'scale(2)',
        }}
        animate={isHovered ? { scale: 2.5, opacity: 0.8 } : { scale: 2, opacity: 0.4 }}
      />
      
      {/* Node dot */}
      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
          border: '2px solid rgba(255, 255, 255, 0.8)',
          boxShadow: `
            0 2px 8px rgba(0, 0, 0, 0.3),
            0 0 ${size}px ${color}60
          `,
        }}
      />
      
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `2px solid ${accentColor}`,
            transform: 'scale(1.5)',
          }}
          animate={{
            scale: [1.5, 1.8, 1.5],
            opacity: [0.8, 0.4, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
});

// ============================================================================
// Cluster Tooltip Component
// ============================================================================

export const ClusterTooltip = memo(function ClusterTooltip({
  cluster,
  color,
}: Omit<ClusterTooltipProps, 'position'>) {
  const isClusterPoint = isCluster(cluster);
  
  if (isClusterPoint) {
    const props = cluster.properties;
    const healthColor = props.avgHealth >= 80 ? '#10B981' 
      : props.avgHealth >= 60 ? '#22C55E'
      : props.avgHealth >= 40 ? '#F59E0B'
      : '#EF4444';
    
    return (
      <motion.div
        className="cluster-tooltip"
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.9 }}
        style={{
          background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          border: `1px solid ${color}40`,
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
          minWidth: 200,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
            style={{
              background: `${color}20`,
              border: `2px solid ${color}`,
              color: color,
            }}
          >
            {formatClusterCount(props.point_count)}
          </div>
          <div>
            <div className="text-white font-semibold">
              {props.primaryCity !== 'Unknown' ? props.primaryCity : props.primaryCountry}
            </div>
            <div className="text-gray-400 text-sm">
              {props.point_count} nodes
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-500 uppercase">Avg Health</div>
            <div className="font-bold" style={{ color: healthColor }}>
              {props.avgHealth.toFixed(0)}%
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <div className="text-[10px] text-gray-500 uppercase">Operators</div>
            <div className="font-bold text-white">{props.operators}</div>
          </div>
        </div>
        
        {/* Countries */}
        {props.countries.length > 1 && (
          <div className="text-xs text-gray-400 mb-2">
            📍 {props.countries.slice(0, 3).join(', ')}
            {props.countries.length > 3 && ` +${props.countries.length - 3} more`}
          </div>
        )}
        
        {/* Action hint */}
        <div className="text-xs text-center pt-2" style={{ color, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          🔍 Click to expand
        </div>
      </motion.div>
    );
  }
  
  // Node tooltip
  const node = (cluster as NodeFeature).properties.node;
  const healthColor = node.health >= 80 ? '#10B981' 
    : node.health >= 60 ? '#22C55E'
    : node.health >= 40 ? '#F59E0B'
    : '#EF4444';
  
  return (
    <motion.div
      className="node-tooltip"
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      style={{
        background: 'linear-gradient(135deg, rgba(10, 14, 26, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%)',
        borderRadius: 12,
        padding: '12px 16px',
        border: `1px solid ${color}40`,
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        minWidth: 180,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="font-mono text-xs font-semibold" style={{ color }}>
          {node.ip}
        </span>
      </div>
      
      {/* Location */}
      {node.city && (
        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
          <span>{getFlagEmoji(node.country_code)}</span>
          <span>{node.city}, {node.country || 'Unknown'}</span>
        </div>
      )}
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-white/5 rounded p-1.5">
          <div className="text-gray-500 uppercase">Health</div>
          <div className="font-bold" style={{ color: healthColor }}>{node.health.toFixed(0)}%</div>
        </div>
        <div className="bg-white/5 rounded p-1.5">
          <div className="text-gray-500 uppercase">Uptime</div>
          <div className="font-bold text-white">{node.uptime.toFixed(1)}h</div>
        </div>
      </div>
      
      {/* Version */}
      {node.version && (
        <div className="mt-2 text-[9px] text-gray-500">
          📦 v{node.version}
        </div>
      )}
    </motion.div>
  );
});

export default ClusterMarker;
