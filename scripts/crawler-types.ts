/**
 * Type-safe definitions for the crawler
 * Eliminates 'any' types and provides proper TypeScript inference
 */

import type { Database } from '../types/supabase.mjs';

// Database table types
export type NodeInsert = Database['public']['Tables']['pnodes']['Insert'];
export type NodeRow = Database['public']['Tables']['pnodes']['Row'];
export type NodeUpdate = Database['public']['Tables']['pnodes']['Update'];
export type HistoryInsert = Database['public']['Tables']['pnode_history']['Insert'];

// Network types
export type NetworkType = 'MAINNET' | 'DEVNET';
export type NodeStatus = 'active' | 'degraded' | 'inactive' | 'stale';

// Stats structure matching the JSONB column
export interface PNodeStats {
  cpu_usage?: number;
  memory_usage?: number;
  storage_used?: number;
  storage_total?: number;
  storage_committed?: number;
  uptime?: number;
  last_block?: number;
  transactions?: number;
  stake?: number;
}

// Node discovered during crawling (before DB insert)
export interface DiscoveredNode {
  ip: string;
  version?: string;
  pubkey?: string;
  stats: Partial<PNodeStats>;
  confidence_score: number;
  sources: string[];
  network: NetworkType;
  status: NodeStatus;
  failed_checks: number;
  location?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  last_seen_gossip?: string; // ISO timestamp
}

// Node to increment failed checks (for zombie detection)
export interface NodeToIncrement {
  ip: string;
  currentFailedChecks: number;
}

// Geolocation result from IP-API
export interface GeolocationResult {
  status: 'success' | 'fail';
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
  query?: string;
  message?: string; // Error message if fail
}

// RPC response types
export interface GetPodsResponse {
  pods?: Array<{
    ip: string;
    pubkey?: string;
    version?: string;
  }>;
  error?: {
    message: string;
  };
}

export interface GetStatsResponse {
  storage_used?: number;
  storage_total?: number;
  storage_committed?: number;
  cpu_usage?: number;
  memory_usage?: number;
  uptime?: number;
  error?: {
    message: string;
  };
}

export interface GetVersionResponse {
  version?: string;
  error?: {
    message: string;
  };
}

// Confidence scoring
export interface ConfidenceFactors {
  hasVersion: boolean;
  hasPubkey: boolean;
  hasStats: boolean;
  hasStorage: boolean;
  multipleRpcSuccess: boolean;
  inGossip: boolean;
  hasGeolocation: boolean;
}

// Batch processing
export interface BatchResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}
