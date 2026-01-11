// lib/types.ts

// Raw statistics returned by the pNode RPC (`get-stats`)
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
  storage_used?: number; // From get-pods-with-stats (actual storage used)
}

// Network status of the node as determined by our crawler
export type PNodeStatus = "active" | "gossip_only";

// Standard model for a pNode throughout the frontend
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
  failed_checks?: number; // Number of consecutive crawl failures (for zombie detection)
  last_crawled_at?: string; // Timestamp of last crawl attempt
}

// Empty stats by default to avoid `undefined` / `NaN`
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
  storage_committed: 0,
  storage_used: 0,
};
