'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Node3DData, Globe3DTheme, Globe3DMode } from '@/lib/types-3d';
import { 
  getNodeColor, 
  getNodeHeight, 
  getNodeSize, 
  getDynamicLabels, 
  getViewLevel,
  getFlagEmoji,
  type GlobeLabel 
} from '@/lib/map-3d-utils';

type Map3DSceneProps = {
  nodes: Node3DData[];
  theme: Globe3DTheme;
  mode: Globe3DMode;
  onNodeClick?: (node: Node3DData) => void;
  onNodeHover?: (node: Node3DData | null) => void;
  showArcs?: boolean;
  cameraPosition?: { lat: number; lng: number; altitude: number };
};

// Earth component - Flat color style like 2D map
function Earth({ theme }: { theme: Globe3DTheme }) {
  const earthRef = useRef<THREE.Group>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  // Subtle rotation animation
  useFrame((state) => {
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });
  
  return (
    <group ref={earthRef}>
      {/* Main Earth sphere - Using flat color like 2D map */}
      <mesh>
        <sphereGeometry args={[100, 64, 64]} />
        <meshBasicMaterial
          color={theme.countries.fill}
        />
      </mesh>
      
      {/* Wireframe for country borders */}
      <mesh>
        <sphereGeometry args={[100.1, 32, 32]} />
        <meshBasicMaterial
          color={theme.countries.stroke}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Atmospheric glow - outer layer */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[105, 64, 64]} />
        <meshBasicMaterial
          color={theme.atmosphere}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Atmospheric glow - inner layer for depth */}
      <mesh>
        <sphereGeometry args={[103, 64, 64]} />
        <meshBasicMaterial
          color={theme.atmosphere}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Node point component with visual settings and animation
function NodePoint({ 
  node, 
  theme,
  showHeight = true,
  showGlow = true,
  cameraDistance,
  onHover,
}: { 
  node: Node3DData; 
  theme: Globe3DTheme;
  showHeight?: boolean;
  showGlow?: boolean;
  cameraDistance: number;
  onHover?: (node: Node3DData | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const radius = 100;
  const phi = (90 - node.lat) * (Math.PI / 180);
  const theta = (node.lng + 180) * (Math.PI / 180);
  
  const height = showHeight ? getNodeHeight(node.health) * 20 : 2;
  // Fixed position calculation (negative x for correct orientation)
  const x = -(radius + height) * Math.sin(phi) * Math.cos(theta);
  const y = (radius + height) * Math.cos(phi);
  const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
  
  const color = getNodeColor(node, theme);
  
  // Adaptive size based on zoom level
  const baseSize = 0.4;
  const zoomFactor = Math.max(0.5, Math.min(2, cameraDistance / 300));
  const size = (baseSize + (getNodeSize(node.uptime) * 0.2)) * zoomFactor;
  
  return (
    <group position={[x, y, z]}>
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover?.(node);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover?.(null);
          document.body.style.cursor = 'default';
        }}
      >
        <sphereGeometry args={[size, 8, 8]} />
        <meshBasicMaterial
          color={color}
        />
      </mesh>
      
      {/* Glow effect when hovered */}
      {showGlow && hovered && (
        <mesh>
          <sphereGeometry args={[size * 1.5, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
      
      {/* Enhanced tooltip on hover */}
      {hovered && (
        <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="bg-gray-900/95 text-white px-3 py-2 rounded-lg text-xs shadow-lg border border-gray-700 whitespace-nowrap">
            <div className="font-semibold text-sm mb-1 text-green-400">
              {node.ip}
            </div>
            <div className="text-gray-300 mb-1">
              {getFlagEmoji(node.country_code)} {node.city ? `${node.city}, ` : ''}{node.country || 'Unknown'}
            </div>
            <div className="space-y-0.5 text-gray-400">
              <div>💚 Health: {node.health.toFixed(0)}/100</div>
              <div>⏱️ Uptime: {node.uptime.toFixed(1)}h</div>
              {node.version && <div>📦 v{node.version}</div>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Label component for cities/countries
function GlobeLabel({ 
  label, 
  theme 
}: { 
  label: GlobeLabel; 
  theme: Globe3DTheme;
}) {
  const radius = 100;
  const phi = (90 - label.lat) * (Math.PI / 180);
  const theta = (label.lng + 180) * (Math.PI / 180);
  
  const height = 0.5;
  const x = -(radius + height) * Math.sin(phi) * Math.cos(theta);
  const y = (radius + height) * Math.cos(phi);
  const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
  
  const color = label.type === 'city' ? '#ffffff' : '#fbbf24';
  
  return (
    <group position={[x, y, z]}>
      {/* Label dot */}
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Label text */}
      <Html distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div 
          className="text-white font-medium whitespace-nowrap pointer-events-none select-none"
          style={{ 
            fontSize: `${label.size * 10}px`,
            textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)',
            marginLeft: '8px',
          }}
        >
          {label.text}
        </div>
      </Html>
    </group>
  );
}

export function Map3DScene({
  nodes,
  theme,
  mode,
  onNodeClick,
  onNodeHover,
  showArcs = false,
  cameraPosition,
  visualSettings,
}: Map3DSceneProps & { visualSettings?: { showHeight: boolean; showGlow: boolean } }) {
  const controlsRef = useRef<any>(null);
  const [cameraDistance, setCameraDistance] = useState(300);
  const [hoveredNode, setHoveredNode] = useState<Node3DData | null>(null);
  
  // Calculate dynamic labels based on camera distance
  const labels = useMemo(() => {
    return getDynamicLabels(nodes, cameraDistance);
  }, [nodes, cameraDistance]);
  
  // Get current view level
  const viewLevel = useMemo(() => {
    return getViewLevel(cameraDistance);
  }, [cameraDistance]);
  
  // Handle camera position changes
  useEffect(() => {
    if (cameraPosition && controlsRef.current) {
      // Convert lat/lng to 3D position
      const { lat, lng, altitude } = cameraPosition;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const radius = 100 * altitude;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Smooth transition to new position
      controlsRef.current.target.set(0, 0, 0);
      // Note: Actual camera animation would be done via react-spring or similar
    }
  }, [cameraPosition]);
  
  // Track camera distance for adaptive rendering
  useEffect(() => {
    const handleChange = () => {
      if (controlsRef.current) {
        const camera = controlsRef.current.object;
        const distance = camera.position.distanceTo(controlsRef.current.target);
        setCameraDistance(distance);
      }
    };
    
    if (controlsRef.current) {
      controlsRef.current.addEventListener('change', handleChange);
      return () => {
        controlsRef.current?.removeEventListener('change', handleChange);
      };
    }
  }, [controlsRef.current]);
  
  return (
    <div className="w-full h-full relative" style={{ background: theme.background }}>
      <Canvas
        gl={{ 
          antialias: false,
          powerPreference: "high-performance"
        }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 300]} />
        
        {/* Lighting - Simplified */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 3, 5]} intensity={0.5} />
        
        {/* Earth */}
        <Earth theme={theme} />
        
        {/* Nodes */}
        {nodes.map((node) => (
          <NodePoint 
            key={node.ip} 
            node={node} 
            theme={theme}
            showHeight={visualSettings?.showHeight}
            showGlow={visualSettings?.showGlow}
            cameraDistance={cameraDistance}
            onHover={(node) => {
              setHoveredNode(node);
              onNodeHover?.(node);
            }}
          />
        ))}
        
        {/* Dynamic Labels */}
        {labels.map((label, idx) => (
          <GlobeLabel 
            key={`${label.text}-${idx}`}
            label={label}
            theme={theme}
          />
        ))}
        
        {/* Camera Controls */}
        <OrbitControls 
          ref={controlsRef}
          enablePan={mode === 'free'}
          enableZoom={true}
          enableRotate={true}
          autoRotate={false} // Never auto-rotate, user has full control
          minDistance={150}
          maxDistance={800}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
      
      {/* View Level Indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-lg text-sm text-muted-foreground font-medium shadow-lg">
        {viewLevel} View
      </div>
    </div>
  );
}
