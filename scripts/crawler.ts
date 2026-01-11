import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import type { PNode, PNodeStats, PNodeStatus } from '../lib/types';
import { EMPTY_STATS } from '../lib/types';
import type { Database, Json } from '../types/supabase.mjs';

// Load environment variables from .env.local (for local development only)
// In production/CI, variables are already in process.env from GitHub Actions
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './.env.local' });
}
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const IPWHO_API_KEY = process.env.IPWHO_API_KEY; // Keep this for geolocation

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Environment check failed:');
  console.error('SUPABASE_URL present:', !!SUPABASE_URL);
  console.error('SUPABASE_SERVICE_ROLE_KEY present:', !!SUPABASE_SERVICE_ROLE_KEY);
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
    storage_used?: unknown; // Direct field (in bytes, often incomplete)
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

interface GeolocationData {
    lat: number | null;
    lng: number | null;
    city: string | null;
    country: string | null;
    country_code: string | null;
}

async function getGeolocation(ip: string): Promise<GeolocationData | null> {
    // Skip local/reserved IPs
    if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('127.') || ip.startsWith('100.')) {
        return null;
    }

    try {
        // Provider 1: ipwho.is (Primary)
        const res = await axios.get(
            `https://ipwho.is/${ip}?fields=success,latitude,longitude,city,country,country_code,message`,
            { timeout: 3000 }
        );

        if (res.data?.success) {
            return {
                lat: res.data.latitude || null,
                lng: res.data.longitude || null,
                city: res.data.city || null,
                country: res.data.country || null,
                country_code: res.data.country_code || null
            };
        }

        if (res.data?.message?.toLowerCase().includes('limit')) {
            throw new Error('Rate limited');
        }
    } catch (error) {
        // console.log(`⚠️ ipwho.is failed for ${ip}, trying fallback...`);
    }

    try {
        // Provider 2: ip-api.com (Fallback)
        const res = await axios.get(
            `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country,countryCode`,
            { timeout: 3000 }
        );

        if (res.data?.status === 'success') {
            return {
                lat: res.data.lat || null,
                lng: res.data.lon || null,
                city: res.data.city || null,
                country: res.data.country || null,
                country_code: res.data.countryCode || null
            };
        }
    } catch (error) {
        // console.error(`❌ All geolocation providers failed for ${ip}`);
    }

    return null;
}

export const main = async () => {
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

    // --- PHASE 2: DATA ENRICHMENT & SAVING ---
    // Filter out localhost BEFORE counting network total
    const allIps = Array.from(discovered).filter(ip => ip !== '127.0.0.1' && ip !== 'localhost');
    const networkTotal = allIps.length;
    console.log(`✅ Discovery complete. Found ${discovered.size} unique nodes via gossip/RPC.`);
    console.log(`🔍 Filtered out localhost. Processing ${allIps.length} valid nodes for network total.`);

    // Fetch all metadata first to build maps for version, pubkey, storage_committed, and is_public
    const versionMap = new Map<string, string>();
    const pubkeyMap = new Map<string, string>();
    const storageCommittedMap = new Map<string, number>();
    const storageUsedMap = new Map<string, number>();
    const isPublicMap = new Map<string, boolean>();
    console.log('📡 Fetching versions, pubkeys, storage commitments, and public status...');
    
    // Batch metadata calls for speed (50 concurrent at a time)
    const METADATA_BATCH_SIZE = 50;
    const metadataResults: PromiseSettledResult<PodWithStats[]>[] = [];
    
    for (let i = 0; i < allIps.length; i += METADATA_BATCH_SIZE) {
        const batch = allIps.slice(i, i + METADATA_BATCH_SIZE);
        const batchResults = await Promise.allSettled(batch.map(ip => getPodsWithStats(ip)));
        metadataResults.push(...batchResults);
        console.log(`  Fetched metadata for ${Math.min(i + METADATA_BATCH_SIZE, allIps.length)}/${allIps.length} nodes...`);
    }
    metadataResults.forEach(result => {
        if (result.status === 'fulfilled') {
            result.value.forEach(pod => {
                const ip = extractIp(pod.address);

                // Skip localhost - it has aberrant data
                if (ip === '127.0.0.1' || ip === 'localhost') {
                    return;
                }

                const version = coerceString(pod.version);
                const pubkey = coerceString(pod.pubkey);
                const storageCommitted = coerceNumber(pod.storage_committed);

                // Use storage_used field directly from API (in bytes)
                const storageUsed = coerceNumber(pod.storage_used);

                if (ip && version) {
                    versionMap.set(ip, version);
                }
                if (ip && pubkey) {
                    pubkeyMap.set(ip, pubkey);
                }
                if (ip && storageCommitted > 0) {
                    storageCommittedMap.set(ip, storageCommitted);
                }
                if (ip && storageUsed > 0) {
                    storageUsedMap.set(ip, storageUsed);
                }
                // Store is_public status
                if (ip && pod.is_public !== undefined) {
                    isPublicMap.set(ip, pod.is_public);
                }
            })
        }
    });
    console.log(`✅ Metadata discovery complete. Found ${versionMap.size} versions, ${pubkeyMap.size} pubkeys, ${storageCommittedMap.size} commitments, ${storageUsedMap.size} used stats, and ${isPublicMap.size} public flags.`);

    console.log('📊 Fetching stats and geolocation...');
    
    // Fetch existing nodes to avoid re-geolocating every time
    const { data: existingNodes } = await supabaseAdmin
        .from('pnodes')
        .select('ip, lat, lng, city, country, country_code');
    
    const existingMap = new Map(existingNodes?.map(n => [n.ip, n]) || []);
    
    // Batch RPC calls for speed (50 concurrent requests at a time to avoid overwhelming)
    const BATCH_SIZE = 50;
    const allStats: PromiseSettledResult<PNodeStats | null>[] = [];
    
    for (let i = 0; i < allIps.length; i += BATCH_SIZE) {
        const batch = allIps.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(batch.map(ip => getStats(ip)));
        allStats.push(...batchResults);
        console.log(`  Fetched stats for ${Math.min(i + BATCH_SIZE, allIps.length)}/${allIps.length} nodes...`);
    }
    
    const allGeo: (GeolocationData | null)[] = [];

    // Geolocation with rate limiting and caching
    // ip-api.com free tier: 45 requests/minute, we use 1.5s delay to be safe (40/min)
    let geoCallsThisMinute = 0;
    let minuteStartTime = Date.now();
    
    for (const ip of allIps) {
        const existing = existingMap.get(ip);
        if (existing && existing.lat && existing.lng && existing.country_code) {
            allGeo.push({
                lat: existing.lat,
                lng: existing.lng,
                city: existing.city,
                country: existing.country,
                country_code: existing.country_code
            });
        } else {
            // Rate limit check: max 40 calls per minute
            if (geoCallsThisMinute >= 40) {
                const elapsed = Date.now() - minuteStartTime;
                if (elapsed < 60000) {
                    const waitTime = 60000 - elapsed;
                    console.log(`  Rate limit: waiting ${(waitTime/1000).toFixed(1)}s before next geolocation batch...`);
                    await new Promise(r => setTimeout(r, waitTime));
                }
                geoCallsThisMinute = 0;
                minuteStartTime = Date.now();
            }
            
            const geo = await getGeolocation(ip);
            allGeo.push(geo);
            if (geo) {
                geoCallsThisMinute++;
                await new Promise(r => setTimeout(r, 1500)); // 1.5s delay = ~40/min
            }
        }
    }

    const pnodesToUpsert: Database['public']['Tables']['pnodes']['Insert'][] = [];
    const historyToInsert: Database['public']['Tables']['pnode_history']['Insert'][] = [];

    for (let i = 0; i < allIps.length; i++) {
        const ip = allIps[i];
        const statsResult = allStats[i];
        const geoResult = allGeo[i];

        // Determine status: active if get-stats responds OR if is_public === true
        const hasStats = statsResult.status === 'fulfilled' && statsResult.value;
        const isPublic = isPublicMap.get(ip) === true;
        const status = (hasStats || isPublic) ? 'active' : 'gossip_only';
        
        // Create a copy of stats to avoid mutating shared EMPTY_STATS constant
        const stats: PNodeStats = hasStats
            ? { ...statsResult.value } as PNodeStats
            : { ...EMPTY_STATS };

        // Enrich stats with storage data from get-pods-with-stats (gossip)
        const storageCommitted = storageCommittedMap.get(ip);
        const storageUsed = storageUsedMap.get(ip);

        // Add storage_committed and storage_used for ALL nodes (both active and gossip_only)
        if (storageCommitted && storageCommitted > 0) {
            stats.storage_committed = storageCommitted;
        }
        if (storageUsed && storageUsed > 0) {
            stats.storage_used = storageUsed;
        }

        if (status === 'gossip_only') {
            // For gossip_only nodes we don't have reliable `get-stats` metrics.
            // We keep `storage_committed`/`storage_used` in their dedicated fields,
            // and DO NOT overwrite core `get-stats` fields like `total_bytes`.
            // (Overwriting caused confusion and made our metrics diverge from the official dashboard.)
            if (storageCommitted && storageCommitted > 0) {
                // Legacy/backwards-compat: some UI used `file_size` as a proxy for capacity.
                stats.file_size = storageCommitted;
            }
        }

        // Save history for ALL nodes (active and gossip_only)
        // This ensures continuity in charts even when nodes go offline temporarily
        historyToInsert.push({
            ip,
            ts: Math.floor(Date.now() / 1000),
            cpu_percent: stats.cpu_percent ?? null,
            ram_used: stats.ram_used ?? null,
            ram_total: stats.ram_total ?? null,
            file_size: stats.file_size ?? null,
            uptime: stats.uptime ?? null,
            packets_sent: stats.packets_sent ?? null,
            packets_received: stats.packets_received ?? null
        });

        const geo = allGeo[i];

        // Explicitly ensure storage_used and is_public are in the final stats object
        const finalStats = {
            ...stats,
            storage_committed: stats.storage_committed || 0,
            storage_used: stats.storage_used || 0,
            is_public: isPublicMap.get(ip) ?? null  // Add is_public to stats
        };

        pnodesToUpsert.push({
            ip: ip,
            status: status,
            version: versionMap.get(ip) || "unknown",
            pubkey: pubkeyMap.get(ip) || null,
            stats: finalStats as unknown as Json,
            lat: geo?.lat,
            lng: geo?.lng,
            city: geo?.city,
            country: geo?.country,
            country_code: geo?.country_code,
            last_crawled_at: new Date().toISOString()
        });
    }

    // DEDUPLICATION: Keep only unique nodes by pubkey (fallback to IP if no pubkey)
    // If a node has multiple IPs, keep the one with highest storage_committed
    console.log(`🔄 Deduplicating ${pnodesToUpsert.length} nodes by pubkey...`);
    const uniqueNodesMap = new Map<string, typeof pnodesToUpsert[0]>();
    
    pnodesToUpsert.forEach((node) => {
        const uniqueId = node.pubkey || node.ip;
        const existing = uniqueNodesMap.get(uniqueId);
        
        if (!existing) {
            uniqueNodesMap.set(uniqueId, node);
        } else {
            // Keep the node with higher storage_committed (more complete data)
            const existingCommitted = (existing.stats as any)?.storage_committed ?? 0;
            const currentCommitted = (node.stats as any)?.storage_committed ?? 0;
            
            if (currentCommitted > existingCommitted) {
                uniqueNodesMap.set(uniqueId, node);
            }
        }
    });
    
    const deduplicatedNodes = Array.from(uniqueNodesMap.values());
    const duplicatesRemoved = pnodesToUpsert.length - deduplicatedNodes.length;
    
    if (duplicatesRemoved > 0) {
        console.log(`🧹 Removed ${duplicatesRemoved} duplicate nodes (${deduplicatedNodes.length} unique nodes remaining)`);
    }

    // Update failed_checks for all nodes
    // - Reset to 0 for nodes successfully crawled
    // - Increment for nodes that failed to respond
    console.log(`🔄 Updating failed_checks counters...`);
    
    const { data: existingNodesForFailCheck } = await supabaseAdmin
        .from('pnodes')
        .select('ip, failed_checks');
    
    const existingIpsMap = new Map(
        (existingNodesForFailCheck || []).map((n: any) => [n.ip, n.failed_checks ?? 0])
    );
    
    const successfulIps = new Set(deduplicatedNodes.map(n => n.ip));
    
    // For each node we're upserting, set failed_checks based on whether it responded
    deduplicatedNodes.forEach((node: any) => {
        // If node responded successfully (has version/pubkey from get-pods-with-stats), reset failed_checks
        const hasMetadata = versionMap.has(node.ip) || pubkeyMap.has(node.ip);
        node.failed_checks = hasMetadata ? 0 : (existingIpsMap.get(node.ip) ?? 0) + 1;
    });
    
    // For existing nodes NOT in this crawl, increment their failed_checks
    const nodesToIncrementFailures: any[] = [];
    existingIpsMap.forEach((failedChecks, ip) => {
        if (!successfulIps.has(ip)) {
            nodesToIncrementFailures.push({
                ip: ip,
                failed_checks: failedChecks + 1
            });
        }
    });
    
    if (nodesToIncrementFailures.length > 0) {
        console.log(`   ⚠️  Incrementing failed_checks for ${nodesToIncrementFailures.length} unreachable nodes`);
        // Update failed_checks for nodes not in this crawl
        for (const node of nodesToIncrementFailures) {
            await supabaseAdmin
                .from('pnodes')
                .update({ failed_checks: node.failed_checks })
                .eq('ip', node.ip);
        }
    }
    
    console.log(`💾 Saving ${deduplicatedNodes.length} unique nodes to the database...`);
    const { error: pnodesError } = await supabaseAdmin
        .from('pnodes')
        .upsert(deduplicatedNodes, { onConflict: 'ip' });

    if (pnodesError) {
        console.error('Error saving pnodes:', pnodesError);
    } else {
        console.log('✅ Successfully saved pnodes data.');
    }

    // Save network metadata (total discovered vs crawled)
    // Use deduplicated count for accurate metadata
    const activeNodesCount = deduplicatedNodes.filter(p => p.status === 'active').length;
    console.log(`📊 Updating network metadata: ${networkTotal} total, ${deduplicatedNodes.length} crawled (deduplicated), ${activeNodesCount} active`);
    const { error: metadataError } = await (supabaseAdmin as any)
        .from('network_metadata')
        .upsert({
            id: 1, // Singleton record
            network_total: networkTotal,
            crawled_nodes: deduplicatedNodes.length, // Use deduplicated count
            active_nodes: activeNodesCount,
            last_updated: new Date().toISOString()
        }, { onConflict: 'id' });

    if (metadataError) {
        console.error('Error saving network metadata:', metadataError);
    } else {
        console.log('✅ Network metadata updated.');
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

    // Auto-cleanup: Remove zombie nodes (consistently inaccessible)
    // A node is a zombie if it has failed_checks >= 3 (3 consecutive crawl failures)
    console.log('\n🧹 Checking for zombie nodes (failed_checks >= 3)...');
    
    const { data: zombieNodes, error: zombieError } = await supabaseAdmin
        .from('pnodes')
        .select('ip, failed_checks')
        .gte('failed_checks', 3);
    
    if (!zombieError && zombieNodes && zombieNodes.length > 0) {
        const zombieIps = zombieNodes.map((n: any) => n.ip);
        console.log(`🗑️  Found ${zombieIps.length} zombie nodes (consistently inaccessible):`);
        zombieIps.forEach((ip: string) => console.log(`   🧟 ${ip}`));
        
        const { error: deleteError } = await supabaseAdmin
            .from('pnodes')
            .delete()
            .in('ip', zombieIps);
        
        if (deleteError) {
            console.error('Error deleting zombie nodes:', deleteError);
        } else {
            console.log(`✅ Successfully removed ${zombieIps.length} zombie nodes`);
        }
    } else if (!zombieError) {
        console.log('✅ No zombie nodes found');
    } else {
        console.error('Error checking for zombies:', zombieError);
    }

    console.log('\n✨ Crawl finished.');
};

main().catch(error => {
    console.error('An unexpected error occurred during the crawl:', error);
    process.exit(1);
});
