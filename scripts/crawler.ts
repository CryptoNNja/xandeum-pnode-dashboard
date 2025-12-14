import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import type { PNode, PNodeStats, PNodeStatus } from '../lib/types.js';
import { EMPTY_STATS } from '../lib/types.js';
import type { Database, Json } from '../types/supabase.mjs';

// Load environment variables from .env.local
dotenv.config({ path: './.env.local' });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IPWHO_API_KEY = process.env.IPWHO_API_KEY; // Keep this for geolocation

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});


const BOOTSTRAP_NODES = [
    "192.190.136.36", "192.190.136.28", "192.190.136.29", "192.190.136.37", 
    "192.190.136.38", "173.212.203.145", "161.97.97.41", "207.244.255.1", 
    "159.69.221.189", "178.18.250.133", "37.120.167.241", "173.249.36.181",
    "213.199.44.36", "62.84.180.238", "154.38.169.212", "152.53.248.235",
    "173.212.217.77", "195.26.241.159"
];

const TIMEOUT = 2000;

// --- Helper Functions (copied from the old API route) ---

interface GossipPeer { ip: string; }
interface GossipResponse { pnodes?: GossipPeer[]; }
interface RpcPod { address: string; }
interface RpcPodsResponse { result?: { pods?: RpcPod[]; }; }
interface RpcStatsResponse { result?: Partial<Record<keyof PNodeStats, unknown>>; }
interface PodWithStats {
    address?: string;
    is_public?: boolean;
    last_seen_timestamp?: number;
    pubkey?: string;
    rpc_port?: number;
    storage_committed?: unknown;
    storage_usage_percent?: unknown;
    storage_used?: unknown;
    uptime?: unknown;
    version?: unknown;
  }
  
interface PodsWithStatsResponse {
    result?: {
      pods?: PodWithStats[];
    };
}

const coerceNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
        const parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
};
const coerceString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
};

async function getGossipPeers(ip: string): Promise<string[]> {
    try {
        const res = await axios.get<GossipResponse>(`http://${ip}:5000/gossip`, { timeout: TIMEOUT });
        return res.data?.pnodes?.map(p => p.ip).filter((peerIp): peerIp is string => !!peerIp) || [];
    } catch {
        return [];
    }
}

async function getRpcPeers(ip: string): Promise<string[]> {
    try {
        const res = await axios.post<RpcPodsResponse>(`http://${ip}:6000/rpc`, { jsonrpc: '2.0', method: 'get-pods', id: 1 }, { timeout: TIMEOUT });
        return res.data?.result?.pods?.map(p => p.address.split(':')[0]).filter((peerIp): peerIp is string => !!peerIp) || [];
    } catch {
        return [];
    }
}

async function getStats(ip: string): Promise<PNodeStats | null> {
    try {
        const res = await axios.post<RpcStatsResponse>(`http://${ip}:6000/rpc`, { jsonrpc: '2.0', method: 'get-stats', id: 1 }, { timeout: 2500 });
        const stats = res.data?.result;
        if (!stats) return null;

        return {
            active_streams: coerceNumber(stats.active_streams),
            cpu_percent: coerceNumber(stats.cpu_percent),
            current_index: coerceNumber(stats.current_index),
            file_size: coerceNumber(stats.file_size),
            last_updated: coerceNumber(stats.last_updated),
            packets_received: coerceNumber(stats.packets_received),
            packets_sent: coerceNumber(stats.packets_sent),
            ram_total: coerceNumber(stats.ram_total),
            ram_used: coerceNumber(stats.ram_used),
            total_bytes: coerceNumber(stats.total_bytes),
            total_pages: coerceNumber(stats.total_pages),
            uptime: coerceNumber(stats.uptime),
        };
    } catch {
        return null;
    }
}

const extractIp = (address?: string): string | undefined => {
    if (typeof address !== 'string') return undefined;
    const [candidate] = address.split(':');
    return candidate && candidate.length > 0 ? candidate : undefined;
}

async function getPodsWithStats(ip: string): Promise<PodWithStats[]> {
    try {
      const res = await axios.post<PodsWithStatsResponse>(
        `http://${ip}:6000/rpc`,
        { jsonrpc: "2.0", method: "get-pods-with-stats", id: 1 },
        { timeout: 3000 }
      );
  
      return res.data?.result?.pods ?? [];
    } catch {
      return [];
    }
}

const main = async () => {
    console.log('🕷️ Starting network crawl...');

    const discovered = new Set<string>(BOOTSTRAP_NODES);
    const processed = new Set<string>();
    const queue: string[] = [...BOOTSTRAP_NODES];

    // --- PHASE 1: DISCOVERY ---
    while (queue.length > 0) {
        const ip = queue.shift();
        if (!ip || processed.has(ip)) {
            continue;
        }
        processed.add(ip);
        console.log(`🔍 Querying node: ${ip}`);

        const [gossipPeers, rpcPeers] = await Promise.all([
            getGossipPeers(ip),
            getRpcPeers(ip)
        ]);

        [...gossipPeers, ...rpcPeers].forEach(peerIp => {
            if (peerIp && !discovered.has(peerIp)) {
                discovered.add(peerIp);
                queue.push(peerIp);
            }
        });
    }

    console.log(`✅ Discovery complete. Found ${discovered.size} unique nodes.`);

    // --- PHASE 2: DATA ENRICHMENT & SAVING ---
    const allIps = Array.from(discovered);
    
    // Fetch all metadata first to build a map
    const versionMap = new Map<string, string>();
    console.log('📡 Fetching versions...');
    const metadataPromises = allIps.map(ip => getPodsWithStats(ip));
    const metadataResults = await Promise.allSettled(metadataPromises);
    metadataResults.forEach(result => {
        if (result.status === 'fulfilled') {
            result.value.forEach(pod => {
                const ip = extractIp(pod.address);
                const version = coerceString(pod.version);
                if (ip && version) {
                    versionMap.set(ip, version);
                }
            })
        }
    });
    console.log(`✅ Version discovery complete. Found ${versionMap.size} versions.`);

    const statsPromises = allIps.map(ip => getStats(ip));
    const allStats = await Promise.allSettled(statsPromises);
    
    const pnodesToUpsert: Database['public']['Tables']['pnodes']['Insert'][] = [];
    const historyToInsert: Database['public']['Tables']['pnode_history']['Insert'][] = [];

    for (let i = 0; i < allIps.length; i++) {
        const ip = allIps[i];
        const statsResult = allStats[i];
        
        let status: PNodeStatus;
        let stats: PNodeStats;

        if (statsResult.status === 'fulfilled' && statsResult.value) {
            status = 'active';
            stats = statsResult.value;
            historyToInsert.push({
                ip,
                ts: Math.floor(Date.now() / 1000),
                cpu_percent: stats.cpu_percent,
                ram_used: stats.ram_used,
                ram_total: stats.ram_total,
                file_size: stats.file_size,
                uptime: stats.uptime,
                packets_sent: stats.packets_sent,
                packets_received: stats.packets_received
            });
        } else {
            status = 'gossip_only';
            stats = EMPTY_STATS;
        }

        pnodesToUpsert.push({
            ip: ip,
            status: status,
            version: versionMap.get(ip) || "unknown",
            stats: stats as unknown as Json, // We cast to Json, assuming PNodeStats is compatible
            last_crawled_at: new Date().toISOString()
        });
    }

    console.log(`💾 Saving ${pnodesToUpsert.length} nodes to the database...`);
    const { error: pnodesError } = await supabaseAdmin
        .from('pnodes')
        .upsert(pnodesToUpsert, { onConflict: 'ip' });

    if (pnodesError) {
        console.error('Error saving pnodes:', pnodesError);
    } else {
        console.log('✅ Successfully saved pnodes data.');
    }
    
    if (historyToInsert.length > 0) {
        console.log(`💾 Saving ${historyToInsert.length} history records...`);
        const { error: historyError } = await supabaseAdmin
            .from('pnode_history')
            .insert(historyToInsert);

        if (historyError) {
            console.error('Error saving pnode_history:', historyError);
        } else {
            console.log('✅ Successfully saved history data.');
        }
    }

    console.log('✨ Crawl finished.');
};

main().catch(error => {
    console.error('An unexpected error occurred during the crawl:', error);
    process.exit(1);
});
