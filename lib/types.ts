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
  last_seen_gossip?: number; // From get-pods-with-stats (timestamp when node was last seen by gossip network)
}

// Node status: connectivity state
// - online: discovered via gossip and currently active (replaces 'active' and 'gossip_only')
// - offline: in registry but not responding to gossip
// - stale: not seen for 24h+
// - registry_only: in official registry but not yet discovered by crawler (ip = null)
export type PNodeStatus = "online" | "offline" | "stale" | "registry_only";

// Node type: privacy/visibility classification
// - public: exposes stats via get-stats RPC
// - private: does not share stats (privacy mode)
// - unknown: type not determined yet
export type NodeType = "public" | "private" | "unknown";

// Network type: MAINNET, DEVNET, or UNKNOWN
export type NetworkType = "MAINNET" | "DEVNET" | "UNKNOWN";

// Standard model for a pNode throughout the frontend
export interface PNode {
  ip: string | null; // Nullable for registry-only nodes
  pubkey?: string; // Optional - permanent node identifier (may be missing in old data)
  status: PNodeStatus; // Connectivity state (online, offline, stale, registry_only)
  node_type?: NodeType; // Privacy classification (public, private, unknown)
  stats: PNodeStats;
  version?: string;
  network?: NetworkType; // MAINNET vs DEVNET classification
  network_confidence?: "high" | "medium" | "low"; // Confidence level of network detection
  source?: "crawler" | "registry" | "both"; // Data source tracking
  is_official?: boolean; // True if in official registry
  is_registered?: boolean; // True if registered in official registry (replaces is_official)
  has_pubkey?: boolean; // True if node has a pubkey (enables manager wallet lookup)
  credits?: number; // Credits earned from official API (XAN tokens)
  last_seen_gossip?: number; // Timestamp from gossip network (DB column, not JSONB stats)
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
  last_seen_gossip: 0,
};
