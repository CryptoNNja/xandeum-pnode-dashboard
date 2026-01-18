/**
 * Health & Alert Thresholds
 * Centralized configuration for system health monitoring and alerting
 * 
 * @module constants
 */

// ============================================================================
// UPTIME THRESHOLDS (in hours)
// ============================================================================

/**
 * Uptime threshold for "Recent Restart" warnings
 * Nodes with uptime < this value trigger a WARNING alert
 * 
 * Reduced from 24h to 6h to minimize false positives for stable nodes
 * @see https://github.com/CryptoNNja/xandeum-pnode-dashboard/pull/8
 */
export const WARNING_UPTIME_THRESHOLD_HOURS = 6;

/**
 * Uptime threshold for critical alerts (just started)
 * Minimum uptime before considering a node operational
 * 
 * Value: 0.083 hours = 5 minutes
 */
export const CRITICAL_UPTIME_THRESHOLD_HOURS = 0.083;

/**
 * Threshold for marking a node as "stale" (no recent activity)
 * Used in conjunction with last_seen_gossip tracking
 */
export const STALE_NODE_THRESHOLD_HOURS = 2;

// ============================================================================
// STORAGE THRESHOLDS (percentage)
// ============================================================================

/**
 * Critical storage threshold
 * Triggers CRITICAL alerts when storage usage exceeds this percentage
 */
export const CRITICAL_STORAGE_THRESHOLD_PERCENT = 90;

/**
 * Warning storage threshold
 * Triggers WARNING alerts when storage usage exceeds this percentage
 */
export const WARNING_STORAGE_THRESHOLD_PERCENT = 80;

// ============================================================================
// RESOURCE USAGE THRESHOLDS (percentage)
// ============================================================================

/**
 * High RAM usage threshold
 * Triggers alerts when RAM usage exceeds this percentage
 */
export const HIGH_RAM_THRESHOLD_PERCENT = 90;

/**
 * High CPU usage threshold
 * Triggers alerts when CPU usage exceeds this percentage
 */
export const HIGH_CPU_THRESHOLD_PERCENT = 85;

// ============================================================================
// TIME CONVERSIONS (for readability)
// ============================================================================

/**
 * Common time conversions in hours
 */
export const TIME_UNITS = {
  FIVE_MINUTES: 0.083,
  ONE_HOUR: 1,
  SIX_HOURS: 6,
  TWENTY_FOUR_HOURS: 24,
} as const;
