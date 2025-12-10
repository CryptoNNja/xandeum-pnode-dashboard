import { NextResponse } from 'next/server';
import axios from 'axios';

// Liste MAXIMALE d'amorçage (Brad + Logs Discord + IPs trouvées)
const BOOTSTRAP_NODES = [
  "192.190.136.36", "192.190.136.28", "192.190.136.29", "192.190.136.37", "192.190.136.38",
  "173.212.203.145", "161.97.97.41", "207.244.255.1", "159.69.221.189",
  "147.93.179.46", "178.18.250.133", "37.120.167.241", "173.249.36.181",
  "213.199.44.36", "62.84.180.238", "154.38.169.212", "152.53.248.235",
  "173.212.217.77", "195.26.241.159", "84.21.171.129", "144.126.137.111",
  "161.97.84.233", "45.151.122.71", "173.249.42.124", "152.53.207.59"
];

const TIMEOUT = 2000; // Court pour scanner vite
const MAX_DEPTH = 4;  // On creuse profond

// Stats vides par défaut
const EMPTY_STATS = {
  cpu_percent: 0, ram_used: 0, ram_total: 0, file_size: 0, uptime: 0, packets_sent: 0, packets_received: 0
};

// --- DISCOVERY HELPERS ---

// 1. GOSSIP (Port 5000) - Le plus bavard pour la découverte
async function getGossipPeers(ip: string): Promise<string[]> {
  try {
    const res = await axios.get(`http://${ip}:5000/gossip`, { timeout: TIMEOUT });
    if (res.data?.pnodes) {
      // On prend tout ce qui ressemble à une IP
      return res.data.pnodes.map((p: any) => p.ip).filter((i: string) => i && i.length > 7);
    }
  } catch (e) { /* Silent fail */ }
  return [];
}

// 2. RPC PODS (Port 6000) - Le plan B
async function getRpcPeers(ip: string): Promise<string[]> {
  try {
    const res = await axios.post(`http://${ip}:6000/rpc`, {
      jsonrpc: "2.0", method: "get-pods", id: 1
    }, { timeout: TIMEOUT });
    
    if (res.data?.result?.pods) {
      return res.data.result.pods.map((p: any) => p.address.split(':')[0]);
    }
  } catch (e) { /* Silent fail */ }
  return [];
}

// 3. STATS (Pour savoir si Actif)
async function getStats(ip: string) {
  try {
    const res = await axios.post(`http://${ip}:6000/rpc`, {
      jsonrpc: "2.0", method: "get-stats", id: 1
    }, { timeout: 2500 });
    return res.data?.result || null;
  } catch (e) { return null; }
}

export async function GET() {
  console.log("🕷️ Starting MASSIVE CRAWL...");
  
  // Set pour unicité
  const discovered = new Set<string>(BOOTSTRAP_NODES);
  const processed = new Set<string>();
  
  // File d'attente (Queue)
  let queue = [...BOOTSTRAP_NODES];

  // --- PHASE 1: DISCOVERY LOOP ---
  // On boucle tant qu'on a des IPs à traiter, avec une limite de sécurité
  let loops = 0;
  while (queue.length > 0 && loops < 500) { // Max 500 requêtes de découverte pour pas timeout Vercel
    loops++;
    
    // On prend les 20 prochains (parallèle)
    const batch = queue.splice(0, 20);
    if (batch.length === 0) break;

    const promises = batch.map(async (ip) => {
      if (processed.has(ip)) return;
      processed.add(ip);

      // On demande les voisins via Gossip ET RPC
      const [gossipList, rpcList] = await Promise.all([
        getGossipPeers(ip),
        getRpcPeers(ip)
      ]);

      const newPeers = [...gossipList, ...rpcList];
      
      newPeers.forEach(peer => {
        // Si c'est une nouvelle IP, on l'ajoute à la liste ET à la queue pour l'interroger elle-même
        if (peer && !discovered.has(peer) && peer !== '127.0.0.1') {
          discovered.add(peer);
          queue.push(peer);
        }
      });
    });

    await Promise.allSettled(promises);
  }

  console.log(`✅ Discovery Phase Done. IPs found: ${discovered.size}`);

  // --- PHASE 2: DATA ENRICHMENT ---
  // Maintenant on construit le JSON final
  const results: any[] = [];
  const allIps = Array.from(discovered);

  // Batching pour les stats
  const BATCH_SIZE = 40;
  for (let i = 0; i < allIps.length; i += BATCH_SIZE) {
    const chunk = allIps.slice(i, i + BATCH_SIZE);
    const chunkPromises = chunk.map(async (ip) => {
      const stats = await getStats(ip);
      
      if (stats) {
        results.push({
          ip,
          status: 'active',
          stats,
          version: "v0.6.0" // On suppose actif = à jour par défaut
        });
      } else {
        // Nœud Private (Gossip only)
        results.push({
          ip,
          status: 'gossip_only',
          stats: EMPTY_STATS,
          version: "unknown"
        });
      }
    });
    await Promise.allSettled(chunkPromises);
  }

  // Tri : Actifs en premier
  results.sort((a, b) => (a.status === 'active' ? -1 : 1));

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
