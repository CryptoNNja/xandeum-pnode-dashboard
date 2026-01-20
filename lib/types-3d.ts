/**
 * Types for 3D Globe Visualization
 */

export type Node3DData = {
  ip: string;
  lat: number;
  lng: number;
  
  // Visual properties
  health: number;           // 0-100 (determines height)
  storage: number;          // GB (determines color)
  
  // Metadata for tooltip
  city?: string;
  country?: string;
  country_code?: string;
  pubkey?: string;          // Public key identifier
  
  // Stats
  uptime: number;           // hours (determines size/glow)
  cpu: number;              // percentage
  ram: number;              // percentage
  version?: string;
  
  // Activity
  hasActiveStreams?: boolean;  // For pulse animation
  operator?: string;            // For arc connections
  
  // Status
  status: 'active' | 'inactive';
  isPublic: boolean;
};

export type Globe3DTheme = {
  background: string;
  atmosphere: string;
  countries: {
    fill: string;
    stroke: string;
  };
  nodes: {
    healthy: string;
    warning: string;
    critical: string;
  };
  arcs: string;
};

export type Globe3DFilter = {
  health: 'all' | 'healthy' | 'warning' | 'critical';
  network: 'all' | 'public' | 'private';
  activeOnly: boolean;
};

export type CameraPosition = {
  lat: number;
  lng: number;
  altitude: number;
};

export type Globe3DMode = 
  | 'free'        // User controls
  | 'cinematic'   // Auto-rotate
  | 'focused';    // Focused on specific node
