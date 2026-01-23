import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
import type { PNode, PNodeStats, PNodeStatus, NetworkType } from '../lib/types';
import { EMPTY_STATS } from '../lib/types';
import type { Database, Json } from '../types/supabase.mjs';
import { getNetworkDetector } from '../lib/network-detector';
import { fetchOfficialRegistries, getCreditsForPubkey } from '../lib/official-apis';
import { calculateConfidence, type PNodeForScoring } from '../lib/confidence-scoring';
import type { DiscoveredNode, NodeToIncrement, GeolocationResult } from './crawler-types';
import pLimit from 'p-limit';
import Bottleneck from 'bottleneck';

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


// Load bootstrap nodes from external config file
import bootstrapConfig from '../config/bootstrap.json';
const BOOTSTRAP_NODES = bootstrapConfig.seeds;

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
    // Include ALL discovered nodes (including localhost - it's a legitimate node with pubkey)
    const allIps = Array.from(discovered);
    const networkTotal = allIps.length;
    console.log(`✅ Discovery complete. Found ${discovered.size} unique nodes via gossip/RPC.`);
    console.log(`🔍 Processing ${allIps.length} nodes for network total (including localhost).`);

    // Fetch all metadata first to build maps for version, pubkey, storage_committed, and is_public
    const versionMap = new Map<string, string>();
    const pubkeyMap = new Map<string, string>();
    const storageCommittedMap = new Map<string, number>();
    const storageUsedMap = new Map<string, number>();
    const isPublicMap = new Map<string, boolean>();
    const rpcPortMap = new Map<string, number>();
    const lastSeenGossipMap = new Map<string, number>(); // 🆕 Track last_seen_timestamp from gossip
    const uptimeGossipMap = new Map<string, number>(); // 🆕 Track uptime from gossip
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

                // Include localhost - it's a legitimate node with pubkey and storage
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

                // 🆕 Capture last_seen_timestamp from gossip network
                if (ip && pod.last_seen_timestamp) {
                    const lastSeenTimestamp = coerceNumber(pod.last_seen_timestamp);
                    if (lastSeenTimestamp > 0) {
                        lastSeenGossipMap.set(ip, lastSeenTimestamp);
                    }
                }

                // 🆕 Capture uptime from gossip network (for ALL nodes, including uptime=0)
                if (ip && pod.uptime !== undefined) {
                    const uptimeSeconds = coerceNumber(pod.uptime);
                    // Store even if uptime=0 to distinguish between:
                    // - Node in gossip with uptime=0 (restarting = OK)
                    // - Node not in gossip at all (zombie = stale)
                    uptimeGossipMap.set(ip, uptimeSeconds);
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
    console.log(`     - last_seen_gossip timestamps: ${lastSeenGossipMap.size}`);
    console.log(`     - uptime from gossip: ${uptimeGossipMap.size}`);

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
    
    // Geolocation with parallel rate limiting and caching
    // ip-api.com free tier: 45 requests/minute, we use 44/min to be safe
    console.log(`📍 Geolocating ${allIps.length} IPs...`);
    const geoStartTime = Date.now();
    
    // Separate cached vs new IPs BEFORE rate limiting
    // This prevents cached IPs from going through Bottleneck unnecessarily
    const cachedIps: string[] = [];
    const newIps: string[] = [];
    
    allIps.forEach(ip => {
        const existing = existingMap.get(ip);
        if (existing && existing.lat && existing.lng && existing.country_code) {
            cachedIps.push(ip);
        } else {
            newIps.push(ip);
        }
    });
    
    console.log(`   📊 Cache: ${cachedIps.length} cached, ${newIps.length} new IPs to geolocate`);
    
    // Process cached IPs immediately (no API call, no rate limiting)
    const cachedResults: (GeolocationData | null)[] = cachedIps.map(ip => {
        const existing = existingMap.get(ip)!;
        return {
            lat: existing.lat!,
            lng: existing.lng!,
            city: existing.city || null,
            country: existing.country || null,
            country_code: existing.country_code!
        };
    });
    
    // Bottleneck rate limiter: only for NEW IPs that need API calls
    // This prevents burst requests and respects ip-api.com rate limits (45 req/min free tier)
    // Using 44 req/min (1.35s) to stay safely under the limit
    const limiter = new Bottleneck({
        maxConcurrent: 1,        // Only 1 request at a time
        minTime: 1350,           // Minimum 1.35s between each request (~44 req/min)
    });
    
    // Process only NEW IPs through Bottleneck
    const geoTasks = newIps.map(ip => 
        limiter.schedule(async () => {
            try {
                return await getGeolocation(ip);
            } catch (error) {
                console.error(`   Failed to geolocate ${ip}:`, error);
                return null;
            }
        })
    );
    
    const newGeoResults = await Promise.allSettled(geoTasks);
    const newResults: (GeolocationData | null)[] = newGeoResults.map(r => 
        r.status === 'fulfilled' ? r.value : null
    );
    
    // Combine cached and new results in original order
    const cachedMap = new Map<string, GeolocationData | null>(
        cachedIps.map((ip, idx) => [ip, cachedResults[idx]]),
    );
    const newMap = new Map<string, GeolocationData | null>(
        newIps.map((ip, idx) => [ip, newResults[idx]]),
    );
    const allGeo: (GeolocationData | null)[] = allIps.map(ip => {
        return cachedMap.get(ip) ?? newMap.get(ip) ?? null;
    });
    
    const geoElapsed = ((Date.now() - geoStartTime) / 1000).toFixed(1);
    const geoSuccess = allGeo.filter(g => g !== null).length;
    const apiCallsMade = newIps.length;
    const timeSaved = cachedIps.length > 0 ? ((cachedIps.length * 1.35) / 60).toFixed(1) : '0';
    console.log(`   ✅ Geolocation: ${geoSuccess}/${allIps.length} in ${geoElapsed}s (${cachedIps.length} cached, ${apiCallsMade} API calls, ~${timeSaved} min saved)`);

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

        // New classification: status = online (all discovered nodes), node_type = public/private
        const hasStats = statsResult.status === 'fulfilled' && statsResult.value;
        const isPublic = isPublicMap.get(ip);
        const status: PNodeStatus = 'online'; // All discovered nodes are online
        const nodeType = isPublic === true ? 'public' : isPublic === false ? 'private' : 'unknown';
        
        // 🆕 NEW ARCHITECTURE: Start with EMPTY_STATS, then enrich from GOSSIP first (all nodes),
        // then enrich from RPC (public nodes only) for metrics not available in gossip
        const stats: PNodeStats = { ...EMPTY_STATS };

        // Get gossip data for this node
        const storageCommitted = storageCommittedMap.get(ip);
        const storageUsed = storageUsedMap.get(ip);
        const lastSeenGossip = lastSeenGossipMap.get(ip);
        const uptimeGossip = uptimeGossipMap.get(ip);

        // PHASE 1: Enrich from GOSSIP (for ALL nodes - public + private)
        // These metrics from gossip are PRIORITIZED over RPC as they reflect network consensus
        if (storageCommitted && storageCommitted > 0) {
            stats.storage_committed = storageCommitted;
            stats.file_size = storageCommitted; // Legacy compat
        }
        if (storageUsed && storageUsed > 0) {
            stats.storage_used = storageUsed;
        }
        if (lastSeenGossip && lastSeenGossip > 0) {
            stats.last_seen_gossip = lastSeenGossip;
        }
        if (uptimeGossip && uptimeGossip > 0) {
            stats.uptime = uptimeGossip; // 🆕 Gossip uptime for ALL nodes (100% coverage)
        }

        // PHASE 2: Enrich from RPC (for PUBLIC nodes only)
        // Only add metrics that are NOT available in gossip (CPU, RAM, packets, etc.)
        if (hasStats && statsResult.value) {
            const rpcStats = statsResult.value as PNodeStats;
            
            // RPC-only metrics (not available in gossip)
            stats.cpu_percent = rpcStats.cpu_percent;
            stats.ram_used = rpcStats.ram_used;
            stats.ram_total = rpcStats.ram_total;
            stats.active_streams = rpcStats.active_streams;
            stats.packets_sent = rpcStats.packets_sent;
            stats.packets_received = rpcStats.packets_received;
            stats.current_index = rpcStats.current_index;
            stats.total_pages = rpcStats.total_pages;
            stats.total_bytes = rpcStats.total_bytes;
            stats.last_updated = rpcStats.last_updated; // RPC timestamp for comparison
            
            // Note: We do NOT overwrite uptime, storage_committed, storage_used from RPC
            // as gossip data is more reliable and has 100% coverage
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

        // Save history for ALL nodes (active and private)
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

        // 🆕 Convert last_seen_gossip timestamp to ISO string for DB column
        const lastSeenGossipTimestamp = lastSeenGossip && lastSeenGossip > 0 
            ? new Date(lastSeenGossip * 1000).toISOString() 
            : null;

        pnodesToUpsert.push({
            ip: ip,
            status: status,
            node_type: nodeType, // New: public/private/unknown classification
            has_pubkey: !!pubkeyMap.get(ip), // New: track if node has pubkey
            version: versionMap.get(ip) || "unknown",
            pubkey: pubkeyMap.get(ip) || null,
            stats: finalStats as unknown as Json,
            last_seen_gossip: lastSeenGossipTimestamp, // 🆕 Store in dedicated DB column
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
        
        // 🆕 ENHANCED STALE LOGIC: Mark node as stale based on intelligent criteria
        // - 2 failed checks WITHOUT gossip data (truly dead - not in network at all)
        // - OR 4 failed checks WITH gossip data (persistent problem despite being in gossip)
        // - OR uptime=0 AND no recent gossip data (zombie with stale data)
        const currentFailedChecks = node.failed_checks;
        const hasGossipData = versionMap.has(node.ip) || 
                             storageCommittedMap.has(node.ip) || 
                             pubkeyMap.has(node.ip);
        
        // Check if node has uptime=0 AND is not present in gossip network at all
        const nodeUptime = (node.stats as any)?.uptime ?? 0;
        const isInGossipNetwork = uptimeGossipMap.has(node.ip); // Node is in gossip (even with uptime=0)
        
        if (currentFailedChecks >= 2 && !hasGossipData) {
            // Node is truly dead - not even in gossip network
            node.status = 'stale';
        } else if (currentFailedChecks >= 4 && hasGossipData) {
            // Node has persistent issues despite being in gossip
            node.status = 'stale';
        } else if (nodeUptime === 0 && !isInGossipNetwork) {
            // Node has uptime=0 AND is not in gossip network = zombie with stale data
            // Note: Nodes with uptime=0 but IN gossip are OK (just restarted)
            node.status = 'stale';
        }
        // Otherwise keep the status determined earlier (online or private)
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
    // NEW DEFINITION: Hybrid stale logic
    // - 2+ failures WITHOUT gossip data (truly dead)
    // - OR 4+ failures WITH gossip data (persistent issues)
    const zombieIpsSet = new Set<string>();
    if (KEEP_ZOMBIES) {
      for (const n of deduplicatedNodes as any[]) {
        const failedChecks = n.failed_checks ?? 0;
        const hasGossipData = versionMap.has(n.ip) || 
                             storageCommittedMap.has(n.ip) || 
                             pubkeyMap.has(n.ip);
        
        const isZombie = (failedChecks >= 2 && !hasGossipData) || 
                        (failedChecks >= 4 && hasGossipData);
        
        if (isZombie && typeof n.ip === 'string' && !n.ip.startsWith('PRIVATE-')) {
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
    const activeNodesCount = deduplicatedNodes.filter(p => p.status === 'online').length;
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
    // NEW HYBRID LOGIC:
    // - Nodes with 2+ failures WITHOUT gossip data → stale (truly dead)
    // - Nodes with 4+ failures WITH gossip data → stale (persistent issues)
    // BUT: Exclude private nodes (IP starting with PRIVATE-) since they can't respond to RPC
    console.log('\n🧹 Checking for zombie nodes (hybrid stale logic)...');
    
    const { data: zombieNodes, error: zombieError } = await supabaseAdmin
        .from('pnodes')
        .select('ip, failed_checks, last_crawled_at')
        .gte('failed_checks', 2); // 🆕 Lowered from 3 to 2 for faster detection
    
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
      online: 0,
      public: 0,
      private: 0,
      stale: 0,
      MAINNET: 0,
      DEVNET: 0,
      UNKNOWN: 0,
      MAINNET_online: 0,
      MAINNET_public: 0,
      MAINNET_private: 0,
      MAINNET_stale: 0,
      DEVNET_online: 0,
      DEVNET_public: 0,
      DEVNET_private: 0,
      DEVNET_stale: 0,
      UNKNOWN_online: 0,
      UNKNOWN_public: 0,
      UNKNOWN_private: 0,
      UNKNOWN_stale: 0,
    };

    for (const n of deduplicatedNodes as any[]) {
      // Count by status
      if (n.status === 'online') summaryCounts.online++;
      else if (n.status === 'stale') summaryCounts.stale++;
      
      // Count by node_type (NEW classification)
      if (n.node_type === 'public') summaryCounts.public++;
      else if (n.node_type === 'private') summaryCounts.private++;

      const net = n.network;
      if (net === 'MAINNET') {
        summaryCounts.MAINNET++;
        if (n.status === 'online') summaryCounts.MAINNET_online++;
        if (n.status === 'stale') summaryCounts.MAINNET_stale++;
        if (n.node_type === 'public') summaryCounts.MAINNET_public++;
        if (n.node_type === 'private') summaryCounts.MAINNET_private++;
      } else if (net === 'DEVNET') {
        summaryCounts.DEVNET++;
        if (n.status === 'online') summaryCounts.DEVNET_online++;
        if (n.status === 'stale') summaryCounts.DEVNET_stale++;
        if (n.node_type === 'public') summaryCounts.DEVNET_public++;
        if (n.node_type === 'private') summaryCounts.DEVNET_private++;
      } else {
        summaryCounts.UNKNOWN++;
        if (n.status === 'online') summaryCounts.UNKNOWN_online++;
        if (n.status === 'stale') summaryCounts.UNKNOWN_stale++;
        if (n.node_type === 'public') summaryCounts.UNKNOWN_public++;
        if (n.node_type === 'private') summaryCounts.UNKNOWN_private++;
      }
    }

    console.log('\n📊 CRAWL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Mode: CRAWLER_PORT_FALLBACKS=${process.env.CRAWLER_PORT_FALLBACKS ?? '0'} (default ports: ${DEFAULT_PRPC_PORTS.join(',')})`);
    console.log(`Discovered IPs (raw): ${discovered.size}`);
    console.log(`Processing IPs (filtered): ${allIps.length}`);
    console.log(`Final nodes upserted (deduplicated): ${deduplicatedNodes.length}`);

    console.log(`Status breakdown:`);
    console.log(`  - online:  ${summaryCounts.online}`);
    console.log(`  - stale:   ${summaryCounts.stale}`);
    
    console.log(`Node type breakdown:`);
    console.log(`  - public:  ${summaryCounts.public}`);
    console.log(`  - private: ${summaryCounts.private}`);

    console.log(`Network breakdown:`);
    console.log(`  - MAINNET:  ${summaryCounts.MAINNET} (online ${summaryCounts.MAINNET_online}, public ${summaryCounts.MAINNET_public}, private ${summaryCounts.MAINNET_private}, stale ${summaryCounts.MAINNET_stale})`);
    console.log(`  - DEVNET:   ${summaryCounts.DEVNET} (online ${summaryCounts.DEVNET_online}, public ${summaryCounts.DEVNET_public}, private ${summaryCounts.DEVNET_private}, stale ${summaryCounts.DEVNET_stale})`);
    if (summaryCounts.UNKNOWN > 0) {
      console.log(`  - UNKNOWN:  ${summaryCounts.UNKNOWN} (online ${summaryCounts.UNKNOWN_online}, public ${summaryCounts.UNKNOWN_public}, private ${summaryCounts.UNKNOWN_private}, stale ${summaryCounts.UNKNOWN_stale})`);
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

    // ═══════════════════════════════════════════════════════════════
    // PHASE 5: SYNC OFFICIAL MAINNET REGISTRY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 PHASE 5: Syncing Official Mainnet Registry...');
    
    try {
        const { syncMainnetRegistry } = await import('./sync-mainnet-registry');
        const syncStats = await syncMainnetRegistry();
        
        console.log('✅ Registry sync completed:');
        console.log(`   - Total official nodes: ${syncStats.totalRegistry}`);
        console.log(`   - New registry-only: ${syncStats.newRegistryOnly}`);
        console.log(`   - Marked as official: ${syncStats.markedAsOfficial}`);
        if (syncStats.errors > 0) {
            console.log(`   - Errors: ${syncStats.errors}`);
        }
    } catch (error) {
        console.error('⚠️ Failed to sync mainnet registry:', error);
        console.log('   Continuing anyway...');
    }
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
