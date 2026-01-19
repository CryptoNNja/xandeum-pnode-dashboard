'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { Node3DData, Globe3DTheme, Globe3DMode } from '@/lib/types-3d';
import { getNodeColor, getNodeHeight, getNodeSize } from '@/lib/map-3d-utils';

type Map3DSceneProps = {
  nodes: Node3DData[];
  theme: Globe3DTheme;
  mode: Globe3DMode;
  onNodeClick?: (node: Node3DData) => void;
  onNodeHover?: (node: Node3DData | null) => void;
  showArcs?: boolean;
  cameraPosition?: { lat: number; lng: number; altitude: number };
};

// Earth component with realistic styling (matching 2D map)
function Earth({ theme }: { theme: Globe3DTheme }) {
  const earthRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001; // Slow rotation
    }
  });
  
  // Use colors that match the 2D map GeoJSON style
  const earthColor = theme.countries.fill; // Dark mode: #1e293b, Light mode: #f1f5f9
  const borderColor = theme.countries.stroke; // Dark mode: #334155, Light mode: #cbd5e1
  
  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[100, 64, 64]} />
      <meshStandardMaterial
        color={earthColor}
        roughness={0.9}
        metalness={0.1}
        emissive={borderColor}
        emissiveIntensity={0.05}
      />
      {/* Wireframe overlay for country borders effect */}
      <mesh>
        <sphereGeometry args={[100.5, 32, 32]} />
        <meshBasicMaterial
          color={borderColor}
          wireframe={true}
          transparent={true}
          opacity={0.15}
        />
      </mesh>
    </mesh>
  );
}

// Node point component
function NodePoint({ node, theme }: { node: Node3DData; theme: Globe3DTheme }) {
  const radius = 100;
  const phi = (90 - node.lat) * (Math.PI / 180);
  const theta = (node.lng + 180) * (Math.PI / 180);
  
  const height = getNodeHeight(node.health) * 20; // Scale up for visibility
  const x = (radius + height) * Math.sin(phi) * Math.cos(theta);
  const y = (radius + height) * Math.cos(phi);
  const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
  
  const color = getNodeColor(node, theme);
  const size = getNodeSize(node.uptime) * 2;
  
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
      />
    </mesh>
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
}: Map3DSceneProps) {
  const controlsRef = useRef<any>(null);
  
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
  
  return (
    <div className="w-full h-full" style={{ background: theme.background }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 300]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 3, 5]} intensity={0.8} />
        <pointLight position={[-5, -3, -5]} intensity={0.4} />
        
        {/* Earth */}
        <Earth theme={theme} />
        
        {/* Nodes */}
        {nodes.map((node) => (
          <NodePoint key={node.ip} node={node} theme={theme} />
        ))}
        
        {/* Camera Controls */}
        <OrbitControls 
          ref={controlsRef}
          enablePan={mode === 'free'}
          enableZoom={true}
          enableRotate={mode !== 'cinematic'}
          autoRotate={mode === 'cinematic'}
          autoRotateSpeed={0.5}
          minDistance={150}
          maxDistance={800}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
