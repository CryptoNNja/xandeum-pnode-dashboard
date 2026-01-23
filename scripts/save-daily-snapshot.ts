// Save daily network snapshot for growth tracking
import { createClient } from "@supabase/supabase-js";
import { calculateNodeScore } from "../lib/scoring";
import type { PNode } from "../lib/types";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function saveDailySnapshot() {
  console.log("📸 Saving daily network snapshot...");

  try {
    // 1. Fetch all pnodes
    const { data: pnodesData, error: fetchError } = await supabase
      .from("pnodes")
      .select("*")
      .neq("ip", "127.0.0.1");

    if (fetchError) {
      console.error("❌ Error fetching pnodes:", fetchError);
      return;
    }

    const pnodes: PNode[] = (pnodesData || []).map((row) => ({
      ip: row.ip,
      status: row.status,
      version: row.version ?? undefined,
      pubkey: row.pubkey ?? undefined,
      stats: row.stats,
      lat: row.lat,
      lng: row.lng,
      city: row.city,
      country: row.country,
      country_code: (row as any).country_code,
      node_type: (row as any).node_type,
      network: (row as any).network,
      has_pubkey: (row as any).has_pubkey,
    }));

    console.log(`📊 Found ${pnodes.length} total nodes`);

    // 2. Calculate metrics
    const totalNodes = pnodes.length;
    const activeNodes = pnodes.filter(p => p.node_type === "public");
    const privateNodes = pnodes.filter(p => p.node_type === "private");

    // 🆕 Calculate network-specific breakdown
    const mainnetNodes = pnodes.filter(p => (p as any).network === "MAINNET");
    const devnetNodes = pnodes.filter(p => (p as any).network === "DEVNET");
    
    const mainnetPublic = mainnetNodes.filter(p => p.node_type === "public").length;
    const mainnetPrivate = mainnetNodes.filter(p => p.node_type === "private").length;
    const devnetPublic = devnetNodes.filter(p => p.node_type === "public").length;
    const devnetPrivate = devnetNodes.filter(p => p.node_type === "private").length;

    // Calculate storage for ALL nodes (not just public)
    const totalStorageBytes = pnodes.reduce(
      (sum, p) => sum + (p.stats?.storage_committed ?? p.stats?.file_size ?? 0),
      0
    );

    // Calculate total pages for ALL nodes
    const totalPages = pnodes.reduce(
      (sum, p) => sum + (p.stats?.total_pages ?? 0),
      0
    );

    // Calculate averages for active nodes only
    const validCpuNodes = activeNodes.filter(p =>
      Number.isFinite(p.stats?.cpu_percent) && p.stats.cpu_percent > 0
    );
    const avgCpuPercent = validCpuNodes.length > 0
      ? validCpuNodes.reduce((sum, p) => sum + p.stats.cpu_percent, 0) / validCpuNodes.length
      : 0;

    const validRamNodes = activeNodes.filter(p =>
      p.stats?.ram_total > 0 && Number.isFinite(p.stats.ram_used)
    );
    const avgRamPercent = validRamNodes.length > 0
      ? validRamNodes.reduce((sum, p) =>
          sum + ((p.stats.ram_used / p.stats.ram_total) * 100), 0
        ) / validRamNodes.length
      : 0;

    const validUptimeNodes = activeNodes.filter(p =>
      Number.isFinite(p.stats?.uptime) && p.stats.uptime > 0
    );
    const avgUptimeHours = validUptimeNodes.length > 0
      ? validUptimeNodes.reduce((sum, p) =>
          sum + (p.stats.uptime / 3600), 0
        ) / validUptimeNodes.length
      : 0;

    // Calculate network health score (average of all active node scores)
    const nodeScores = activeNodes
      .map(p => calculateNodeScore(p))
      .filter(score => score > 0);
    const networkHealthScore = nodeScores.length > 0
      ? Math.round(nodeScores.reduce((sum, s) => sum + s, 0) / nodeScores.length)
      : 0;

    // 3. Get today's date (UTC)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // 4. Insert or update snapshot
    const { error: upsertError } = await supabase
      .from("network_snapshots")
      .upsert({
        snapshot_date: today,
        total_nodes: totalNodes,
        active_nodes: activeNodes.length,
        private_nodes: privateNodes.length,
        total_storage_bytes: totalStorageBytes,
        total_pages: totalPages,
        avg_cpu_percent: Math.round(avgCpuPercent * 100) / 100,
        avg_ram_percent: Math.round(avgRamPercent * 100) / 100,
        avg_uptime_hours: Math.round(avgUptimeHours * 100) / 100,
        network_health_score: networkHealthScore,
        // 🆕 Network-specific breakdown
        mainnet_public: mainnetPublic,
        mainnet_private: mainnetPrivate,
        devnet_public: devnetPublic,
        devnet_private: devnetPrivate,
      }, {
        onConflict: 'snapshot_date'
      });

    if (upsertError) {
      console.error("❌ Error saving snapshot:", upsertError);
      return;
    }

    console.log("✅ Daily snapshot saved successfully!");
    console.log(`📈 Metrics:`);
    console.log(`   - Total Nodes: ${totalNodes}`);
    console.log(`   - Active Nodes: ${activeNodes.length}`);
    console.log(`   - Private Nodes: ${privateNodes.length}`);
    console.log(`   - MAINNET: ${mainnetPublic} public, ${mainnetPrivate} private`);
    console.log(`   - DEVNET: ${devnetPublic} public, ${devnetPrivate} private`);
    console.log(`   - Total Storage: ${(totalStorageBytes / 1e9).toFixed(2)} GB`);
    console.log(`   - Total Pages: ${totalPages.toLocaleString()}`);
    console.log(`   - Avg CPU: ${avgCpuPercent.toFixed(1)}%`);
    console.log(`   - Avg RAM: ${avgRamPercent.toFixed(1)}%`);
    console.log(`   - Avg Uptime: ${avgUptimeHours.toFixed(1)}h`);
    console.log(`   - Network Health: ${networkHealthScore}/100`);

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

saveDailySnapshot();
