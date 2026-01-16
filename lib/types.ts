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
// Node status (current state)
// - active: telemetry reachable (or explicitly public)
// - gossip_only: discovered, but no telemetry
// - stale: previously known, now consistently unreachable (kept for coverage)
// - registry_only: in official registry but not yet discovered by crawler (ip = null)
export type PNodeStatus = "active" | "gossip_only" | "stale" | "registry_only";

// Network type: MAINNET, DEVNET, or UNKNOWN
export type NetworkType = "MAINNET" | "DEVNET" | "UNKNOWN";

// Standard model for a pNode throughout the frontend
export interface PNode {
  ip: string | null; // 🆕 Nullable for registry-only nodes
  pubkey?: string; // 🆕 Optional - permanent node identifier (may be missing in old data)
  status: PNodeStatus;
  stats: PNodeStats;
  version?: string;
  network?: NetworkType; // MAINNET vs DEVNET classification
  network_confidence?: "high" | "medium" | "low"; // Confidence level of network detection
  source?: "crawler" | "registry" | "both"; // 🆕 Data source tracking
  is_official?: boolean; // 🆕 True if in official registry
  credits?: number; // 🆕 Credits earned from official API (XAN tokens)
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
