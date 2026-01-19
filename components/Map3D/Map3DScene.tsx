'use client';

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line } from '@react-three/drei';
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

// Earth component with realistic texture and country borders
function Earth({ theme }: { theme: Globe3DTheme }) {
  const earthRef = useRef<THREE.Group>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  
  // Load GeoJSON for country borders (same as 2D map)
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error('Failed to load GeoJSON:', err));
  }, []);
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001; // Slow rotation
    }
  });
  
  // Create country borders from GeoJSON
  const countryBorders = geoJsonData?.features.map((feature: any, index: number) => {
    if (!feature.geometry || feature.geometry.type !== 'Polygon') return null;
    
    const coordinates = feature.geometry.coordinates[0];
    if (!coordinates || coordinates.length < 3) return null;
    
    const points = coordinates.map((coord: number[]) => {
      const [lng, lat] = coord;
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const radius = 100.2; // Slightly above sphere surface
      
      return new THREE.Vector3(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    });
    
    return (
      <Line
        key={`border-${index}`}
        points={points}
        color={theme.countries.stroke}
        lineWidth={1.5}
        transparent
        opacity={0.6}
      />
    );
  }).filter(Boolean);
  
  return (
    <group ref={earthRef}>
      {/* Main Earth sphere */}
      <mesh>
        <sphereGeometry args={[100, 64, 64]} />
        <meshPhongMaterial
          color={theme.countries.fill}
          shininess={5}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[102, 64, 64]} />
        <meshBasicMaterial
          color={theme.atmosphere}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
      
      {/* Country borders */}
      {countryBorders}
    </group>
  );
}

// Node point component with visual settings
function NodePoint({ 
  node, 
  theme,
  showHeight = true,
  showGlow = true,
}: { 
  node: Node3DData; 
  theme: Globe3DTheme;
  showHeight?: boolean;
  showGlow?: boolean;
}) {
  const radius = 100;
  const phi = (90 - node.lat) * (Math.PI / 180);
  const theta = (node.lng + 180) * (Math.PI / 180);
  
  const height = showHeight ? getNodeHeight(node.health) * 20 : 2; // Show height based on setting
  const x = (radius + height) * Math.sin(phi) * Math.cos(theta);
  const y = (radius + height) * Math.cos(phi);
  const z = (radius + height) * Math.sin(phi) * Math.sin(theta);
  
  const color = getNodeColor(node, theme);
  const size = getNodeSize(node.uptime) * 1.5;
  
  return (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[size, 16, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={showGlow ? color : '#000000'}
        emissiveIntensity={showGlow ? 0.6 : 0}
        metalness={0.3}
        roughness={0.7}
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
  visualSettings,
}: Map3DSceneProps & { visualSettings?: { showHeight: boolean; showGlow: boolean } }) {
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
          <NodePoint 
            key={node.ip} 
            node={node} 
            theme={theme}
            showHeight={visualSettings?.showHeight}
            showGlow={visualSettings?.showGlow}
          />
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
