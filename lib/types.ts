// lib/types.ts

// Statistiques brutes retournées par le RPC pNode (`get-stats`)
export interface PNodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
  storage_committed?: number; // From get-pods-with-stats (capacity promised)
}

// Statut "network" du node tel qu'on le déduit dans notre crawler
export type PNodeStatus = "active" | "gossip_only";

// Modèle standard pour un pNode dans tout le front
export interface PNode {
  ip: string;
  status: PNodeStatus;
  stats: PNodeStats;
  version?: string;
  pubkey?: string; // Xandeum node public key (for credits matching)
  lat?: number | null;
  lng?: number | null;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
}

// Stats vides par défaut pour éviter les `undefined` / `NaN`
export const EMPTY_STATS: PNodeStats = {
  active_streams: 0,
  cpu_percent: 0,
  current_index: 0,
  file_size: 0,
  last_updated: 0,
  packets_received: 0,
  packets_sent: 0,
  ram_total: 0,
  ram_used: 0,
  total_bytes: 0,
  total_pages: 0,
  uptime: 0,
};
