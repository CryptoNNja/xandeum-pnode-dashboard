import type { PNode, PNodeStats } from "./types";

/**
 * Calculate storage efficiency (bytes per page)
 * Higher values = more data per page = better compression/efficiency
 *
 * @param stats - PNode statistics
 * @returns Bytes per page, or 0 if no pages stored
 */
export function calculateStorageEfficiency(stats: PNodeStats): number {
    if (!stats || stats.total_pages === 0) return 0;
    return stats.total_bytes / stats.total_pages;
}

/**
 * Get storage efficiency label based on bytes per page
 *
 * @param bytesPerPage - Storage efficiency value
 * @returns Human-readable efficiency label
 */
export function getStorageEfficiencyLabel(bytesPerPage: number): string {
    if (bytesPerPage === 0) return "No Data";
    if (bytesPerPage >= 100000) return "Excellent"; // >100KB per page
    if (bytesPerPage >= 50000) return "Good";        // 50-100KB per page
    if (bytesPerPage >= 10000) return "Fair";        // 10-50KB per page
    return "Low";                                     // <10KB per page
}

/**
 * Get storage efficiency color for UI
 *
 * @param bytesPerPage - Storage efficiency value
 * @returns Tailwind color class
 */
export function getStorageEfficiencyColor(bytesPerPage: number): string {
    if (bytesPerPage === 0) return "text-gray-400";
    if (bytesPerPage >= 100000) return "text-green-400";
    if (bytesPerPage >= 50000) return "text-blue-400";
    if (bytesPerPage >= 10000) return "text-yellow-400";
    return "text-orange-400";
}

/**
 * Calculate network activity score (0-100)
 * Based on packets sent/received ratio and total volume
 *
 * @param stats - PNode statistics
 * @returns Activity score 0-100
 */
export function calculateNetworkActivity(stats: PNodeStats): number {
    if (!stats) return 0;

    const totalPackets = stats.packets_sent + stats.packets_received;
    if (totalPackets === 0) return 0;

    // Balance score: ratio should be close to 1:1
    const ratio = stats.packets_sent / (stats.packets_received || 1);
    const balanceScore = ratio >= 0.5 && ratio <= 2 ? 100 : 50;

    // Volume score: logarithmic scale
    const volumeScore = Math.min(100, Math.log10(totalPackets + 1) * 20);

    // Combined score
    return Math.round((balanceScore + volumeScore) / 2);
}

/**
 * Format bytes per page for display
 *
 * @param bytesPerPage - Storage efficiency value
 * @returns Formatted string
 */
export function formatBytesPerPage(bytesPerPage: number): string {
    if (bytesPerPage === 0) return "—";
    if (bytesPerPage >= 1024) {
        return `${(bytesPerPage / 1024).toFixed(1)} KB/page`;
    }
    return `${Math.round(bytesPerPage)} B/page`;
}

/**
 * Calculate indexing progress percentage
 *
 * @param stats - PNode statistics
 * @returns Progress percentage 0-100
 */
export function calculateIndexingProgress(stats: PNodeStats): number {
    if (!stats || stats.total_pages === 0) return 0;
    return Math.min(100, (stats.current_index / stats.total_pages) * 100);
}

/**
 * Get all blockchain metrics for a node
 *
 * @param pnode - PNode with stats
 * @returns Aggregated blockchain metrics
 */
export interface BlockchainMetrics {
    activeStreams: number;
    currentIndex: number;
    totalPages: number;
    indexingProgress: number;
    storageEfficiency: number;
    storageEfficiencyLabel: string;
    networkActivity: number;
    packetsSent: number;
    packetsReceived: number;
    totalPackets: number;
}

export function getBlockchainMetrics(pnode: PNode): BlockchainMetrics {
    const stats = pnode.stats;

    return {
        activeStreams: stats.active_streams,
        currentIndex: stats.current_index,
        totalPages: stats.total_pages,
        indexingProgress: calculateIndexingProgress(stats),
        storageEfficiency: calculateStorageEfficiency(stats),
        storageEfficiencyLabel: getStorageEfficiencyLabel(calculateStorageEfficiency(stats)),
        networkActivity: calculateNetworkActivity(stats),
        packetsSent: stats.packets_sent,
        packetsReceived: stats.packets_received,
        totalPackets: stats.packets_sent + stats.packets_received,
    };
}
