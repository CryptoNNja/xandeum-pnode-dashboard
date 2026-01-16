import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import type { PNode, PNodeStats, PNodeStatus, NetworkType } from '../lib/types';
import { EMPTY_STATS } from '../lib/types';
import type { Database, Json } from '../types/supabase.mjs';
import { getNetworkDetector } from '../lib/network-detector';
import { fetchOfficialRegistries, getCreditsForPubkey } from '../lib/official-apis';
import { calculateConfidence, type PNodeForScoring } from '../lib/confidence-scoring';

// IMPORTANT: this file is imported by Next.js API routes.
// It must be "import-safe": no env validation, no network calls, and no crawl execution at module load.
// We only initialize env + clients inside `main()`.

let supabaseAdmin: ReturnType<typeof createClient<Database>>;
let IPWHO_API_KEY: string | undefined;

// Runtime counters for logs (reset at each `main()` run)
let statsCalls = 0;
let statsSuccess = 0;
let statsPortUsage: Record<string, number> = {};

let podsWithStatsCalls = 0;
let podsWithStatsSuccess = 0;
let podsWithStatsPodsReturned = 0;

function initCrawlerEnv() {
  // Load environment variables from .env.local (for local development only)
  // In production/CI, variables are already in process.env from GitHub Actions / Vercel env.
  if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: './.env.local' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  IPWHO_API_KEY = process.env.IPWHO_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Environment check failed:');
    console.error('SUPABASE_URL present:', !!SUPABASE_URL);
    console.error('SUPABASE_SERVICE_ROLE_KEY present:', !!SUPABASE_SERVICE_ROLE_KEY);
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}


const BOOTSTRAP_NODES = [
    // Original bootstrap nodes
    "192.190.136.36", "192.190.136.28", "192.190.136.29", "192.190.136.37", 
    "192.190.136.38", "173.212.203.145", "161.97.97.41", "207.244.255.1", 
    "159.69.221.189", "178.18.250.133", "37.120.167.241", "173.249.36.181",
    "213.199.44.36", "62.84.180.238", "154.38.169.212", "152.53.248.235",
    "173.212.217.77", "195.26.241.159",
    // Additional nodes discovered (34 missing nodes with ~228 TB storage)
    "194.238.24.95", "194.238.24.87", "194.238.24.88", "194.238.24.89",
    "194.238.24.90", "194.238.24.91", "194.238.24.92", "194.238.24.86",
    "95.217.178.17", "195.26.241.115", "136.115.243.45", "192.190.136.26",
    "100.79.135.83", "94.255.130.90", "89.58.27.200", "62.84.180.246",
    "66.94.98.124", "62.84.180.244", "51.159.232.252", "51.159.232.250",
    "62.84.180.247", "62.84.180.245", "62.84.180.239", "51.159.232.251",
    "66.94.98.125", "62.84.180.243", "62.84.180.242", "62.84.180.241",
    "207.244.255.10", "66.94.98.126", "62.84.180.240", "51.15.234.234",
    "51.15.234.233", "51.15.234.232"
];

// Increased timeout from 2000ms to 5000ms to catch slower nodes
const TIMEOUT = 5000;

// Keep "zombie" nodes for coverage (mark as stale instead of deleting)
// Default is the legacy behavior: delete.
const KEEP_ZOMBIES = process.env.CRAWLER_KEEP_ZOMBIES === '1';

// Optional port fallback strategy (to improve reachability on networks where pRPC port varies)
// Default is strict :6000 only.
const ENABLE_PORT_FALLBACKS = process.env.CRAWLER_PORT_FALLBACKS === '1';
const DEFAULT_PRPC_PORTS = ENABLE_PORT_FALLBACKS ? [6000, 9000] : [6000];

const buildRpcUrl = (ip: string, port: number) => `http://${ip}:${port}/rpc`;

async function tryPorts<T>(
  ip: string,
  ports: number[],
  fn: (url: string) => Promise<T>,
): Promise<{ value: T; port: number } | null> {
  for (const port of ports) {
    try {
      const value = await fn(buildRpcUrl(ip, port));
      return { value, port };
    } catch {
      // try next port
    }
  }
  return null;
}

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
  const result = await tryPorts(ip, DEFAULT_PRPC_PORTS, async (url) => {
    const res = await axios.post<RpcPodsResponse>(
      url,
      { jsonrpc: '2.0', method: 'get-pods', id: 1 },
      { timeout: TIMEOUT },
    );
    return res.data;
  });

  const data = result?.value;
  return data?.result?.pods?.map((p) => p.address.split(':')[0]).filter((peerIp): peerIp is string => !!peerIp) || [];
}

async function getStats(ip: string, ports: number[] = DEFAULT_PRPC_PORTS): Promise<PNodeStats | null> {
  statsCalls++;
  const result = await tryPorts(ip, ports, async (url) => {
    const res = await axios.post<RpcStatsResponse>(
      url,
      { jsonrpc: '2.0', method: 'get-stats', id: 1 },
      { timeout: 5000 },
    );
    return res.data;
  });

  const stats = result?.value?.result;
  if (!stats) return null;

  statsSuccess++;
  if (result?.port) {
    const key = String(result.port);
    statsPortUsage[key] = (statsPortUsage[key] || 0) + 1;
  }

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
}

const extractIp = (address?: string): string | undefined => {
    if (typeof address !== 'string') return undefined;
    const [candidate] = address.split(':');
    return candidate && candidate.length > 0 ? candidate : undefined;
}

async function getPodsWithStats(ip: string, ports: number[] = DEFAULT_PRPC_PORTS): Promise<PodWithStats[]> {
  podsWithStatsCalls++;
  const result = await tryPorts(ip, ports, async (url) => {
    const res = await axios.post<PodsWithStatsResponse>(
      url,
      { jsonrpc: '2.0', method: 'get-pods-with-stats', id: 1 },
      { timeout: 5000 },
    );
    return res.data;
  });

  const pods = result?.value?.result?.pods ?? [];
  if (pods.length > 0) {
    podsWithStatsSuccess++;
    podsWithStatsPodsReturned += pods.length;
  }
  return pods;
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
    // Reset counters
    statsCalls = 0;
    statsSuccess = 0;
    statsPortUsage = {};
    podsWithStatsCalls = 0;
    podsWithStatsSuccess = 0;
    podsWithStatsPodsReturned = 0;

    initCrawlerEnv();

    console.log('🕷️ Starting network crawl (Next-Level Discovery)...');
    console.log('=' .repeat(70));

    // ═══════════════════════════════════════════════════════════════
    // PHASE 0: FETCH OFFICIAL REGISTRIES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📡 PHASE 0: Fetching Official Registries...');
    let officialRegistries;
    try {
        officialRegistries = await fetchOfficialRegistries();
        console.log(`✅ MAINNET: ${officialRegistries.mainnetCount} official nodes`);
        console.log(`✅ DEVNET:  ${officialRegistries.devnetCount} official nodes`);
    } catch (err) {
        console.error('⚠️ Failed to fetch official registries:', err);
        officialRegistries = {
            mainnetPubkeys: new Set<string>(),
            devnetPubkeys: new Set<string>(),
            mainnetCredits: new Map<string, number>(),
            devnetCredits: new Map<string, number>(),
            mainnetCount: 0,
            devnetCount: 0
        };
    }

    // Initialize network detector and refresh registry
    console.log('\n🌐 Initializing network detector...');
    const networkDetector = getNetworkDetector();
    try {
        await networkDetector.refreshFromAPI();
        const stats = networkDetector.getRegistryStats();
        console.log(`✅ Network registry loaded: ${stats?.mainnet.pubkeys} MAINNET nodes, ${stats?.devnet.pubkeys} DEVNET nodes`);
    } catch (err) {
        console.warn('⚠️ Failed to refresh network registry, using local fallback');
    }

    const discovered = new Set<string>(BOOTSTRAP_NODES);
    const processed = new Set<string>();
    const queue: string[] = [...BOOTSTRAP_NODES];

    // --- PHASE 1: DISCOVERY (Parallelized) ---
    const DISCOVERY_CONCURRENCY = 10; // Process 10 nodes at a time
    
    while (queue.length > 0) {
        // Take up to DISCOVERY_CONCURRENCY nodes from queue
        const batch: string[] = [];
        while (batch.length < DISCOVERY_CONCURRENCY && queue.length > 0) {
            const ip = queue.shift();
            if (ip && !processed.has(ip)) {
                batch.push(ip);
                processed.add(ip);
            }
        }
        
        if (batch.length === 0) break;
        
        console.log(`🔍 Querying ${batch.length} nodes in parallel...`);
        
        // Query all nodes in batch simultaneously
        const batchResults = await Promise.all(
            batch.map(async (ip) => {
                const [gossipPeers, rpcPeers] = await Promise.all([
                    getGossipPeers(ip),
                    getRpcPeers(ip)
                ]);
                return { ip, peers: [...gossipPeers, ...rpcPeers] };
            })
        );
        
        // Add discovered peers to queue
        batchResults.forEach(({ peers }) => {
            peers.forEach(peerIp => {
                if (peerIp && !discovered.has(peerIp)) {
                    discovered.add(peerIp);
                    queue.push(peerIp);
                }
            });
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
    const rpcPortMap = new Map<string, number>();
    console.log('📡 Fetching versions, pubkeys, storage commitments, and public status...');
    
    // Batch metadata calls for speed (100 concurrent at a time for faster crawling)
    const METADATA_BATCH_SIZE = 100;
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

                // Capture rpc_port when advertised so we can prioritize it for get-stats
                if (ip && typeof pod.rpc_port === 'number' && Number.isFinite(pod.rpc_port) && pod.rpc_port > 0) {
                    rpcPortMap.set(ip, pod.rpc_port);
                }
            })
        }
    });
    console.log(`✅ Metadata discovery complete.`);
    console.log(`   get-pods-with-stats calls: ${podsWithStatsCalls}`);
    console.log(`   get-pods-with-stats successes (pods>0): ${podsWithStatsSuccess}`);
    console.log(`   total pods returned (sum): ${podsWithStatsPodsReturned}`);
    console.log(`   extracted unique IP metadata:`);
    console.log(`     - versions: ${versionMap.size}`);
    console.log(`     - pubkeys: ${pubkeyMap.size}`);
    console.log(`     - storage_committed: ${storageCommittedMap.size}`);
    console.log(`     - storage_used: ${storageUsedMap.size}`);
    console.log(`     - is_public flags: ${isPublicMap.size}`);
    console.log(`     - rpc_port hints: ${rpcPortMap.size}`);

    console.log('📊 Fetching stats and geolocation...');
    
    // Fetch existing nodes to avoid re-geolocating every time
    const { data: existingNodes } = await supabaseAdmin
        .from('pnodes')
        .select('ip, lat, lng, city, country, country_code');
    
    const existingMap = new Map(existingNodes?.map(n => [n.ip, n]) || []);
    
    // Batch RPC calls for speed (100 concurrent requests at a time)
    const BATCH_SIZE = 100;
    const allStats: PromiseSettledResult<PNodeStats | null>[] = [];
    
    for (let i = 0; i < allIps.length; i += BATCH_SIZE) {
        const batch = allIps.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(batch.map(ip => {
            const preferred = rpcPortMap.get(ip);
            const ports = preferred ? [preferred, ...DEFAULT_PRPC_PORTS.filter(p => p !== preferred)] : DEFAULT_PRPC_PORTS;
            return getStats(ip, ports);
        }));
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

    // Detect network for each node
    console.log('🌐 Detecting network (MAINNET/DEVNET) for all nodes...');
    let mainnetCount = 0;
    let devnetCount = 0;
    let unknownCount = 0;

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

        // Detect network (MAINNET/DEVNET) - fully independent detection
        const pubkey = pubkeyMap.get(ip);
        const version = versionMap.get(ip);
        // storageCommitted already declared above at line 422
        
        const detectionResult = await networkDetector.detectNetwork(
            pubkey || null,
            ip,
            version || null,
            stats.uptime || null,
            null, // port - we could extract from RPC but not critical for now
            storageCommitted || null // storage pour analyse de patterns
        );

        // Count network types for logging
        if (detectionResult.network === 'MAINNET') mainnetCount++;
        else if (detectionResult.network === 'DEVNET') devnetCount++;
        else unknownCount++;

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
            network: detectionResult.network as string, // 🆕 Network type
            network_confidence: detectionResult.confidence as string, // 🆕 Confidence level
            network_detection_method: detectionResult.method as string, // 🆕 Detection method
            last_crawled_at: new Date().toISOString()
        } as any);
    }

    console.log(`✅ Network detection complete:`);
    console.log(`   🟢 MAINNET: ${mainnetCount} nodes`);
    console.log(`   🟡 DEVNET: ${devnetCount} nodes`);
    if (unknownCount > 0) {
        console.log(`   ⚪ UNKNOWN: ${unknownCount} nodes`);
    }

    // DEDUPLICATION: Keep only unique nodes by IP (each IP = one physical node)
    // Note: Multiple IPs can have the same pubkey (multi-node operators) - this is normal
    console.log(`🔄 Deduplicating ${pnodesToUpsert.length} nodes by IP...`);
    const uniqueNodesMap = new Map<string, typeof pnodesToUpsert[0]>();
    
    pnodesToUpsert.forEach((node) => {
        // Skip registry-only nodes without IP for now (they'll be handled by sync-mainnet-registry)
        if (!node.ip) {
            return;
        }
        
        const uniqueId = node.ip; // Deduplicate by IP only - one IP = one physical node
        const existing = uniqueNodesMap.get(uniqueId);
        
        if (!existing) {
            uniqueNodesMap.set(uniqueId, node);
        } else {
            // If duplicate IP (shouldn't happen), keep the node with higher storage_committed
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
        console.log(`🧹 Removed ${duplicatesRemoved} duplicate IPs (${deduplicatedNodes.length} unique nodes remaining)`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: CONFIDENCE SCORING & CREDITS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n🎯 PHASE 3: Calculating Confidence Scores & Credits...');
    
    deduplicatedNodes.forEach((node: any) => {
        // Calculate confidence score
        const nodeForScoring: PNodeForScoring = {
            ip: node.ip,
            pubkey: node.pubkey,
            network: node.network,
            stats: node.stats,
            storage_committed: (node.stats as any)?.storage_committed,
            storage_used: (node.stats as any)?.storage_used
        };

        const confidence = calculateConfidence(
            nodeForScoring,
            officialRegistries.mainnetPubkeys,
            officialRegistries.devnetPubkeys
        );

        // Add confidence fields to node
        node.confidence_score = confidence.score;
        node.sources = confidence.sources;
        node.verified_by_rpc = confidence.verified;

        // Get credits from official API
        const pubkey = node.pubkey || '';
        if (pubkey) {
            const mainnetCredits = officialRegistries.mainnetCredits.get(pubkey);
            const devnetCredits = officialRegistries.devnetCredits.get(pubkey);
            node.credits = mainnetCredits || devnetCredits || 0;
        } else {
            node.credits = 0;
        }
    });

    const avgConfidence = deduplicatedNodes.reduce((sum: number, n: any) => sum + n.confidence_score, 0) / deduplicatedNodes.length;
    const confirmedCount = deduplicatedNodes.filter((n: any) => n.confidence_score >= 85).length;
    const validatedCount = deduplicatedNodes.filter((n: any) => n.confidence_score >= 70 && n.confidence_score < 85).length;
    const discoveredCount = deduplicatedNodes.filter((n: any) => n.confidence_score >= 50 && n.confidence_score < 70).length;
    
    console.log(`✅ Average confidence score: ${avgConfidence.toFixed(1)}/100`);
    console.log(`   🟢 Confirmed (85-100): ${confirmedCount} nodes`);
    console.log(`   🟡 Validated (70-84):  ${validatedCount} nodes`);
    console.log(`   🔵 Discovered (50-69): ${discoveredCount} nodes`);

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
        // Batch update failed_checks for nodes not in this crawl
        // Use individual updates since we only want to update specific fields
        for (const node of nodesToIncrementFailures) {
            await supabaseAdmin
                .from('pnodes')
                .update({ 
                    failed_checks: node.failed_checks,
                    last_crawled_at: new Date().toISOString()
                })
                .eq('ip', node.ip);
        }
    }
    
    // Build zombie IP set BEFORE upsert so we can avoid overwriting their status.
    // Definition: failed_checks >= 3 and not PRIVATE-*.
    const zombieIpsSet = new Set<string>();
    if (KEEP_ZOMBIES) {
      for (const n of deduplicatedNodes as any[]) {
        if ((n.failed_checks ?? 0) >= 3 && typeof n.ip === 'string' && !n.ip.startsWith('PRIVATE-')) {
          zombieIpsSet.add(n.ip);
        }
      }
    }

    // Prevent overwriting `status` for zombie IPs when KEEP_ZOMBIES is enabled.
    // We want `status='stale'` to survive the upsert.
    const nodesForUpsert = (KEEP_ZOMBIES && zombieIpsSet.size > 0)
      ? (deduplicatedNodes.map((n: any) => {
          if (zombieIpsSet.has(n.ip)) {
            const { status, ...rest } = n;
            return rest;
          }
          return n;
        }) as any[])
      : (deduplicatedNodes as any[]);

    console.log(`💾 Saving ${deduplicatedNodes.length} unique nodes to the database...`);
    const { error: pnodesError } = await supabaseAdmin
        .from('pnodes')
        .upsert(nodesForUpsert, { onConflict: 'ip' });

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
    // BUT: Exclude private nodes (IP starting with PRIVATE-) since they can't respond to RPC
    console.log('\n🧹 Checking for zombie nodes (failed_checks >= 3)...');
    
    const { data: zombieNodes, error: zombieError } = await supabaseAdmin
        .from('pnodes')
        .select('ip, failed_checks, last_crawled_at')
        .gte('failed_checks', 3);
    
    // Track zombies for reporting/cleanup (already computed before upsert)

    if (!zombieError && zombieNodes && zombieNodes.length > 0) {
        // Filter out private nodes - they are NOT zombies, just unreachable by design
        const actualZombies = zombieNodes.filter((n: any) => !n.ip.startsWith('PRIVATE-'));
        const privateNodes = zombieNodes.filter((n: any) => n.ip.startsWith('PRIVATE-'));
        
        if (privateNodes.length > 0) {
            console.log(`ℹ️  Skipping ${privateNodes.length} private nodes (unreachable by design):`);
            privateNodes.forEach((n: any) => console.log(`   🔒 ${n.ip}`));
        }
        
        if (actualZombies.length > 0) {
            const zombieIps = actualZombies.map((n: any) => n.ip);
            zombieIps.forEach((ip: string) => zombieIpsSet.add(ip));
            console.log(`🗑️  Found ${zombieIps.length} actual zombie nodes (consistently inaccessible):`);
            zombieIps.forEach((ip: string) => console.log(`   🧟 ${ip}`));
            
            if (KEEP_ZOMBIES) {
                const { error: staleError } = await supabaseAdmin
                    .from('pnodes')
                    .update({ status: 'stale' })
                    .in('ip', zombieIps);

                if (staleError) {
                    console.error('Error marking zombie nodes as stale:', staleError);
                } else {
                    console.log(`✅ Marked ${zombieIps.length} nodes as stale (kept for coverage)`);
                }
            } else {
                const { error: deleteError } = await supabaseAdmin
                    .from('pnodes')
                    .delete()
                    .in('ip', zombieIps);
                
                if (deleteError) {
                    console.error('Error deleting zombie nodes:', deleteError);
                } else {
                    console.log(`✅ Successfully removed ${zombieIps.length} zombie nodes`);
                }
            }
        } else {
            console.log('✅ No actual zombie nodes to remove (only private nodes)');
        }
    } else if (!zombieError) {
        console.log('✅ No zombie nodes found');
    } else {
        console.error('Error checking for zombies:', zombieError);
    }

    // --- Summary (for GitHub Actions comparisons) ---
    const statsFail = Math.max(0, statsCalls - statsSuccess);
    const portsSorted = Object.entries(statsPortUsage).sort((a, b) => Number(a[0]) - Number(b[0]));

    // Status + network breakdown (based on final nodes we upsert)
    const summaryCounts = {
      active: 0,
      gossip_only: 0,
      stale: 0,
      MAINNET: 0,
      DEVNET: 0,
      UNKNOWN: 0,
      MAINNET_active: 0,
      MAINNET_gossip_only: 0,
      MAINNET_stale: 0,
      DEVNET_active: 0,
      DEVNET_gossip_only: 0,
      DEVNET_stale: 0,
      UNKNOWN_active: 0,
      UNKNOWN_gossip_only: 0,
      UNKNOWN_stale: 0,
    };

    for (const n of deduplicatedNodes as any[]) {
      if (n.status === 'active') summaryCounts.active++;
      else if (n.status === 'stale') summaryCounts.stale++;
      else summaryCounts.gossip_only++;

      const net = n.network;
      if (net === 'MAINNET') {
        summaryCounts.MAINNET++;
        if (n.status === 'active') summaryCounts.MAINNET_active++;
        else if (n.status === 'stale') summaryCounts.MAINNET_stale++;
        else summaryCounts.MAINNET_gossip_only++;
      } else if (net === 'DEVNET') {
        summaryCounts.DEVNET++;
        if (n.status === 'active') summaryCounts.DEVNET_active++;
        else if (n.status === 'stale') summaryCounts.DEVNET_stale++;
        else summaryCounts.DEVNET_gossip_only++;
      } else {
        summaryCounts.UNKNOWN++;
        if (n.status === 'active') summaryCounts.UNKNOWN_active++;
        else if (n.status === 'stale') summaryCounts.UNKNOWN_stale++;
        else summaryCounts.UNKNOWN_gossip_only++;
      }
    }

    console.log('\n📊 CRAWL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Mode: CRAWLER_PORT_FALLBACKS=${process.env.CRAWLER_PORT_FALLBACKS ?? '0'} (default ports: ${DEFAULT_PRPC_PORTS.join(',')})`);
    console.log(`Discovered IPs (raw): ${discovered.size}`);
    console.log(`Processing IPs (filtered): ${allIps.length}`);
    console.log(`Final nodes upserted (deduplicated): ${deduplicatedNodes.length}`);

    console.log(`Status breakdown:`);
    console.log(`  - active (public):       ${summaryCounts.active}`);
    console.log(`  - gossip_only (private): ${summaryCounts.gossip_only}`);
    console.log(`  - stale (kept):          ${summaryCounts.stale}`);

    console.log(`Network breakdown:`);
    console.log(`  - MAINNET:  ${summaryCounts.MAINNET} (active ${summaryCounts.MAINNET_active}, gossip_only ${summaryCounts.MAINNET_gossip_only}, stale ${summaryCounts.MAINNET_stale})`);
    console.log(`  - DEVNET:   ${summaryCounts.DEVNET} (active ${summaryCounts.DEVNET_active}, gossip_only ${summaryCounts.DEVNET_gossip_only}, stale ${summaryCounts.DEVNET_stale})`);
    if (summaryCounts.UNKNOWN > 0) {
      console.log(`  - UNKNOWN:  ${summaryCounts.UNKNOWN} (active ${summaryCounts.UNKNOWN_active}, gossip_only ${summaryCounts.UNKNOWN_gossip_only}, stale ${summaryCounts.UNKNOWN_stale})`);
    }

    console.log(`get-stats calls: ${statsCalls}`);
    console.log(`get-stats success: ${statsSuccess}`);
    console.log(`get-stats failed: ${statsFail}`);
    if (portsSorted.length) {
      console.log('get-stats port usage:');
      for (const [port, count] of portsSorted) {
        console.log(`  - ${port}: ${count}`);
      }
    } else {
      console.log('get-stats port usage: (none)');
    }

    console.log('\n✨ Crawl finished.');
};

// Run only when executed directly (CLI). Avoid triggering during Next.js build/import.
const isDirectRun = (() => {
  const argv1 = process.argv?.[1] || '';
  return argv1.includes('scripts/crawler') || argv1.endsWith('crawler.ts') || argv1.endsWith('crawler.js');
})();

if (isDirectRun) {
  main().catch((error) => {
    console.error('An unexpected error occurred during the crawl:', error);
    process.exit(1);
  });
}
