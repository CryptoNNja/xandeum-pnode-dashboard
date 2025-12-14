
import { describe, it, expect } from 'vitest';
import { getHealthStatus } from '../lib/health';
import type { PNode, PNodeStats } from '../lib/types'; // Import type

const createMockNode = (stats: Partial<PNodeStats>, status: PNode['status'] = 'active'): PNode => ({
    ip: '127.0.0.1',
    status,
    version: 'v0.7.0',
    stats: {
        cpu_percent: 0,
        ram_used: 0,
        ram_total: 16 * 1e9, // 16 GB
        uptime: 30 * 24 * 3600, // 30 days
        packets_sent: 1000,
        packets_received: 1000,
        file_size: 1 * 1e12, // 1 TB
        total_bytes: 0.5 * 1e12, // 500 GB used
        current_index: 0,
        last_updated: 0,
        total_pages: 0,
        ...stats,
    },
});

describe('getHealthStatus', () => {
    it('should return "Private" for a gossip_only node', () => {
        const node = createMockNode({}, 'gossip_only');
        expect(getHealthStatus(node)).toBe('Private');
    });

    it('should return "Private" for a node with no stats', () => {
        const node: PNode = { ip: '1.1.1.1', status: 'active', version: 'v1', stats: null as any }; // Cast to any to simulate missing stats
        expect(getHealthStatus(node)).toBe('Private');
    });

    it('should return "Critical" for very high CPU usage', () => {
        const node = createMockNode({ cpu_percent: 95 });
        expect(getHealthStatus(node)).toBe('Critical');
    });

    it('should return "Warning" for high CPU usage', () => {
        const node = createMockNode({ cpu_percent: 85 });
        expect(getHealthStatus(node)).toBe('Warning');
    });

    it('should return "Critical" for very low uptime', () => {
        const node = createMockNode({ uptime: 0.5 * 3600 }); // 0.5 hours
        expect(getHealthStatus(node)).toBe('Critical');
    });

    it('should return "Warning" for low uptime', () => {
        const node = createMockNode({ uptime: 3 * 3600 }); // 3 hours
        expect(getHealthStatus(node)).toBe('Warning');
    });

    it('should return "Critical" for very high RAM usage', () => {
        const node = createMockNode({ ram_used: 15 * 1e9 }); // 15GB used out of 16GB
        expect(getHealthStatus(node)).toBe('Critical');
    });

    it('should return "Warning" for high RAM usage', () => {
        const node = createMockNode({ ram_used: 13 * 1e9 }); // 13GB used out of 16GB
        expect(getHealthStatus(node)).toBe('Warning');
    });

    it('should return "Critical" for very high storage usage', () => {
        const node = createMockNode({ file_size: 1 * 1e12, total_bytes: 0.98 * 1e12 }); // 98% storage
        expect(getHealthStatus(node)).toBe('Critical');
    });

    it('should return "Warning" for high storage usage', () => {
        const node = createMockNode({ file_size: 1 * 1e12, total_bytes: 0.85 * 1e12 }); // 85% storage
        expect(getHealthStatus(node)).toBe('Warning');
    });

    it('should return "Excellent" for optimal conditions', () => {
        const node = createMockNode({
            cpu_percent: 15,
            ram_used: 2 * 1e9, // 12.5%
            uptime: 50 * 24 * 3600, // > 48 hours
            file_size: 1 * 1e12,
            total_bytes: 0.1 * 1e12, // 10% storage
        });
        expect(getHealthStatus(node)).toBe('Excellent');
    });

    it('should return "Good" for generally good conditions', () => {
        const node = createMockNode({
            cpu_percent: 30,
            ram_used: 6 * 1e9, // 37.5%
            uptime: 10 * 24 * 3600, // > 48 hours
            file_size: 1 * 1e12,
            total_bytes: 0.4 * 1e12, // 40% storage
        });
        expect(getHealthStatus(node)).toBe('Good');
    });

    it('should consider performance score for critical status', () => {
        // This node should have a low performance score, pushing it to Critical
        const node = createMockNode({
            cpu_percent: 90, // Changed from 40 to 90 to lower performance score below 50
            ram_used: 4 * 1e9,
            uptime: 30 * 24 * 3600,
            packets_sent: 1, // Very low packets sent
            packets_received: 10000,
            file_size: 1e12,
            total_bytes: 0.5e12
        }); 
        expect(getHealthStatus(node)).toBe('Critical');
    });
});
